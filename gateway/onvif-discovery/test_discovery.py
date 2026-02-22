#!/usr/bin/env python3
"""
Script de teste de descoberta ONVIF.
Tenta WS-Discovery (multicast) primeiro, depois faz scan no range de IPs fornecido.

Uso:
  python test_discovery.py
  python test_discovery.py --range 192.168.15.1-254 --user admin --password senha
"""

import argparse
import re
import socket
import sys
from concurrent.futures import ThreadPoolExecutor, as_completed
from urllib.parse import urlparse

# ─── Dependências opcionais com mensagens claras ───────────────────────────────

try:
    from wsdiscovery import WSDiscovery
    HAS_WSD = True
except ImportError:
    HAS_WSD = False
    print("[AVISO] wsdiscovery não instalado. Pulando WS-Discovery.")
    print("        pip install WSDiscovery\n")

try:
    from onvif import ONVIFCamera
    HAS_ONVIF = True
except ImportError:
    HAS_ONVIF = False
    print("[AVISO] onvif-zeep não instalado. Não será possível obter stream URI.")
    print("        pip install onvif-zeep\n")

ONVIF_PORTS = [80, 8080, 8899, 2020, 10080]


# ─── WS-Discovery ─────────────────────────────────────────────────────────────

def discover_ws(timeout=5):
    if not HAS_WSD:
        return []

    print(f"[1] WS-Discovery (multicast UDP 3702, timeout={timeout}s)...")
    try:
        wsd = WSDiscovery()
        wsd.start()
        services = wsd.searchServices(timeout=timeout)
        wsd.stop()

        found = []
        for svc in services:
            for addr in svc.getXAddrs():
                parsed = urlparse(addr)
                host = parsed.hostname
                port = parsed.port or 80
                if host:
                    found.append({"host": host, "port": port, "xaddr": addr})
                    print(f"    WS-Discovery → {addr}")

        print(f"    Total: {len(found)} dispositivo(s)\n")
        return found
    except Exception as e:
        print(f"    Falha: {e}\n")
        return []


# ─── Scan por IP ──────────────────────────────────────────────────────────────

def check_port(host, port, timeout=1.5):
    try:
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        sock.settimeout(timeout)
        result = sock.connect_ex((host, port))
        sock.close()
        return result == 0
    except Exception:
        return False


def scan_range(ip_range, ports=ONVIF_PORTS, workers=60):
    match = re.match(r"^(\d+\.\d+\.\d+\.)(\d+)-(\d+)$", ip_range)
    if not match:
        print(f"[ERRO] Range inválido: '{ip_range}'. Formato: 192.168.1.1-254")
        return []

    prefix, start, end = match.group(1), int(match.group(2)), int(match.group(3))
    hosts = [f"{prefix}{i}" for i in range(start, end + 1)]
    total = len(hosts) * len(ports)

    print(f"[2] Scan de rede — {len(hosts)} IPs × {len(ports)} portas = {total} sondas (workers={workers})...")

    found = []
    with ThreadPoolExecutor(max_workers=workers) as ex:
        futures = {ex.submit(check_port, h, p): (h, p) for h in hosts for p in ports}
        for future in as_completed(futures):
            host, port = futures[future]
            if future.result():
                print(f"    Porta aberta → {host}:{port}")
                found.append({"host": host, "port": port})

    print(f"    Total: {len(found)} porta(s) abertas\n")
    return found


# ─── Info ONVIF ───────────────────────────────────────────────────────────────

def get_onvif_info(host, port, user, password):
    if not HAS_ONVIF:
        return None
    try:
        cam = ONVIFCamera(host, port, user, password)
        info = cam.devicemgmt.GetDeviceInformation()
        return info
    except Exception as e:
        return None


def get_stream_uri(host, port, user, password):
    if not HAS_ONVIF:
        return None
    try:
        cam = ONVIFCamera(host, port, user, password)
        media = cam.create_media_service()
        profiles = media.GetProfiles()
        if not profiles:
            return None

        uri_resp = media.GetStreamUri({
            "StreamSetup": {"Stream": "RTP-Unicast", "Transport": {"Protocol": "RTSP"}},
            "ProfileToken": profiles[0].token,
        })
        uri = uri_resp.Uri

        # injeta credenciais se necessário
        parsed = urlparse(uri)
        if not parsed.username and password:
            uri = uri.replace(f"rtsp://{parsed.hostname}",
                              f"rtsp://{user}:{password}@{parsed.hostname}")
        return uri
    except Exception as e:
        return None


# ─── Main ─────────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(description="Testa descoberta de câmeras ONVIF")
    parser.add_argument("--range", dest="ip_range", default="",
                        help="Range de IPs para scan (ex: 192.168.15.1-254)")
    parser.add_argument("--user", default="admin", help="Usuário ONVIF (padrão: admin)")
    parser.add_argument("--password", default="", help="Senha ONVIF")
    parser.add_argument("--wsd-timeout", type=int, default=5,
                        help="Timeout WS-Discovery em segundos (padrão: 5)")
    args = parser.parse_args()

    print("=" * 60)
    print("  ONVIF Camera Discovery — Teste")
    print("=" * 60)
    print(f"  Usuário  : {args.user}")
    print(f"  Senha    : {'***' if args.password else '(vazia)'}")
    print(f"  IP range : {args.ip_range or '(não definido)'}")
    print("=" * 60 + "\n")

    candidates = []

    # 1. WS-Discovery
    candidates += discover_ws(timeout=args.wsd_timeout)

    # 2. Scan de rede (se range fornecido)
    if args.ip_range:
        scan_results = scan_range(args.ip_range)
        # evita duplicatas
        existing = {(c["host"], c["port"]) for c in candidates}
        for r in scan_results:
            if (r["host"], r["port"]) not in existing:
                candidates.append(r)

    if not candidates:
        print("Nenhum dispositivo encontrado.")
        print("Dicas:")
        print("  • Passe --range 192.168.15.1-254 para scan por IP")
        print("  • Verifique se ONVIF está habilitado na câmera")
        print("  • Em WSL2/Docker, WS-Discovery (multicast) pode não funcionar")
        sys.exit(0)

    # 3. Identifica câmeras ONVIF nos candidatos
    print(f"[3] Verificando {len(candidates)} candidato(s) via ONVIF...\n")
    cameras = []

    for c in candidates:
        host, port = c["host"], c["port"]
        print(f"  → {host}:{port} ... ", end="", flush=True)

        info = get_onvif_info(host, port, args.user, args.password)
        if info:
            print(f"CÂMERA ONVIF!")
            print(f"     Fabricante : {getattr(info, 'Manufacturer', '?')}")
            print(f"     Modelo     : {getattr(info, 'Model', '?')}")
            print(f"     Firmware   : {getattr(info, 'FirmwareVersion', '?')}")
            print(f"     Serial     : {getattr(info, 'SerialNumber', '?')}")

            uri = get_stream_uri(host, port, args.user, args.password)
            if uri:
                print(f"     Stream URI : {uri}")
            else:
                print(f"     Stream URI : (não obtido)")

            cameras.append({"host": host, "port": port, "info": info, "uri": uri})
            print()
        else:
            print("não é ONVIF ou credenciais incorretas")

    # 4. Resumo
    print("\n" + "=" * 60)
    print(f"  Resultado: {len(cameras)} câmera(s) ONVIF encontrada(s)")
    print("=" * 60)
    for cam in cameras:
        info = cam["info"]
        print(f"  {cam['host']}:{cam['port']} — "
              f"{getattr(info,'Manufacturer','?')} {getattr(info,'Model','?')}")
        if cam["uri"]:
            print(f"    └ {cam['uri']}")


if __name__ == "__main__":
    main()
