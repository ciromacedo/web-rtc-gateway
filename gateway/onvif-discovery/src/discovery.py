"""
ONVIF Camera Discovery Service

Descobre câmeras ONVIF na rede local e registra seus streams RTSP no MediaMTX.
Suporta dois modos:
  1. WS-Discovery (multicast) — funciona em redes com suporte a multicast
  2. Scan por range de IPs — fallback para ambientes como WSL2/Docker
"""

import logging
import os
import re
import socket
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from urllib.parse import urlparse

import requests
from onvif import ONVIFCamera

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
)
logger = logging.getLogger(__name__)

ONVIF_USER = os.environ.get("ONVIF_USER", "admin")
ONVIF_PASSWORD = os.environ.get("ONVIF_PASSWORD", "")
MEDIAMTX_API = os.environ.get("MEDIAMTX_API", "http://127.0.0.1:9997")
DISCOVERY_INTERVAL = int(os.environ.get("DISCOVERY_INTERVAL", "60"))

# Range de IPs para scan (ex: "192.168.15.1-254")
SCAN_RANGE = os.environ.get("SCAN_RANGE", "")

# Portas ONVIF comuns
ONVIF_PORTS = [80, 8080, 8899, 2020]

registered_cameras = set()


def scan_onvif_host(host, port, timeout=2):
    """Tenta conectar em um host:port para verificar se é uma câmera ONVIF."""
    try:
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        sock.settimeout(timeout)
        result = sock.connect_ex((host, port))
        sock.close()
        if result == 0:
            # Porta aberta — tenta criar uma conexão ONVIF
            try:
                cam = ONVIFCamera(host, port, ONVIF_USER, ONVIF_PASSWORD)
                device_info = cam.devicemgmt.GetDeviceInformation()
                logger.info(
                    "Câmera ONVIF encontrada: %s:%d — %s %s",
                    host, port, device_info.Manufacturer, device_info.Model,
                )
                return {"host": host, "port": port, "info": device_info}
            except Exception:
                return None
    except Exception:
        pass
    return None


def parse_scan_range(scan_range):
    """Converte 'x.x.x.1-254' em lista de IPs."""
    if not scan_range:
        return []

    match = re.match(r"^(\d+\.\d+\.\d+\.)(\d+)-(\d+)$", scan_range)
    if not match:
        logger.error("SCAN_RANGE inválido: %s (formato: x.x.x.START-END)", scan_range)
        return []

    prefix = match.group(1)
    start = int(match.group(2))
    end = int(match.group(3))
    return [f"{prefix}{i}" for i in range(start, end + 1)]


def discover_by_ws_discovery():
    """Tenta descoberta via WS-Discovery (multicast)."""
    try:
        from wsdiscovery import WSDiscovery

        wsd = WSDiscovery()
        wsd.start()
        services = wsd.searchServices(timeout=5)
        wsd.stop()

        cameras = []
        for service in services:
            for addr in service.getXAddrs():
                parsed = urlparse(addr)
                host = parsed.hostname
                port = parsed.port or 80
                if host:
                    cameras.append({"host": host, "port": port})
                    logger.info("WS-Discovery: dispositivo em %s:%s", host, port)
        return cameras
    except Exception as e:
        logger.warning("WS-Discovery falhou: %s", e)
        return []


def discover_by_scan():
    """Descobre câmeras ONVIF por scan de rede."""
    if not SCAN_RANGE:
        return []

    hosts = parse_scan_range(SCAN_RANGE)
    logger.info("Escaneando %d IPs no range %s...", len(hosts), SCAN_RANGE)

    cameras = []
    with ThreadPoolExecutor(max_workers=50) as executor:
        futures = {}
        for host in hosts:
            for port in ONVIF_PORTS:
                future = executor.submit(scan_onvif_host, host, port)
                futures[future] = (host, port)

        for future in as_completed(futures):
            result = future.result()
            if result:
                cameras.append(result)

    return cameras


def get_rtsp_uri(host, port, user, password):
    """Obtém a URI RTSP de uma câmera ONVIF."""
    try:
        camera = ONVIFCamera(host, port, user, password)
        media_service = camera.create_media_service()

        profiles = media_service.GetProfiles()
        if not profiles:
            logger.warning("Nenhum perfil encontrado em %s", host)
            return None

        profile = profiles[0]
        stream_setup = {
            "Stream": "RTP-Unicast",
            "Transport": {"Protocol": "RTSP"},
        }

        uri_response = media_service.GetStreamUri(
            {"StreamSetup": stream_setup, "ProfileToken": profile.token}
        )

        rtsp_uri = uri_response.Uri
        logger.info("Stream URI para %s: %s", host, rtsp_uri)

        # Injeta credenciais na URI se não estiverem presentes
        parsed = urlparse(rtsp_uri)
        if not parsed.username:
            rtsp_uri = rtsp_uri.replace(
                f"rtsp://{parsed.hostname}",
                f"rtsp://{user}:{password}@{parsed.hostname}",
            )

        return rtsp_uri

    except Exception as e:
        logger.error("Erro ao obter stream de %s:%s — %s", host, port, e)
        return None


def register_in_mediamtx(camera_name, rtsp_uri):
    """Registra um stream no MediaMTX via API."""
    url = f"{MEDIAMTX_API}/v3/config/paths/add/{camera_name}"
    payload = {
        "source": rtsp_uri,
        "sourceOnDemand": False,
    }

    try:
        resp = requests.post(url, json=payload, timeout=5)
        if resp.status_code in (200, 201):
            logger.info("Câmera '%s' registrada no MediaMTX", camera_name)
            return True
        else:
            logger.warning(
                "Falha ao registrar '%s': %s %s",
                camera_name, resp.status_code, resp.text,
            )
            return False
    except requests.RequestException as e:
        logger.error("Erro ao comunicar com MediaMTX: %s", e)
        return False


def sanitize_name(host):
    """Gera um nome de câmera seguro a partir do host."""
    return "onvif-" + re.sub(r"[^a-zA-Z0-9]", "-", host)


def main():
    logger.info("ONVIF Discovery Service iniciado")
    logger.info("MediaMTX API: %s", MEDIAMTX_API)
    logger.info("Usuário ONVIF: %s", ONVIF_USER)
    logger.info("Scan range: %s", SCAN_RANGE or "(desabilitado)")

    while True:
        try:
            # Tenta WS-Discovery primeiro, depois scan
            cameras = discover_by_ws_discovery()
            if not cameras and SCAN_RANGE:
                cameras = discover_by_scan()

            logger.info("Encontradas %d câmeras na rede", len(cameras))

            for cam in cameras:
                host = cam["host"]
                if host in registered_cameras:
                    continue

                rtsp_uri = get_rtsp_uri(
                    host, cam["port"], ONVIF_USER, ONVIF_PASSWORD
                )
                if rtsp_uri:
                    name = sanitize_name(host)
                    if register_in_mediamtx(name, rtsp_uri):
                        registered_cameras.add(host)

        except Exception as e:
            logger.error("Erro no ciclo de descoberta: %s", e)

        logger.info(
            "Próxima descoberta em %ds. Câmeras registradas: %d",
            DISCOVERY_INTERVAL, len(registered_cameras),
        )
        time.sleep(DISCOVERY_INTERVAL)


if __name__ == "__main__":
    main()
