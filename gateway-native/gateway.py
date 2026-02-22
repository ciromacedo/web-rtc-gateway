#!/usr/bin/env python3
"""
SmartMesh Gateway — Agente nativo (sem Docker)
Equivalente ao entrypoint.sh + container mediamtx, mas rodando nativamente.

Fluxo:
  1. Lê iot_devices.yml
  2. Autentica API key no backend (registra local_api_url para PTZ)
  3. Registra dispositivos IoT no backend
  4. Gera mediamtx.yml com os paths de câmeras RTSP
  5. Inicia o binário mediamtx como subprocesso
  6. Sobe HTTP API na porta 9000 para comandos PTZ (thread separada)
  7. Monitora e reinicia se cair
"""

import http.server
import json
import os
import signal
import socket
import subprocess
import sys
import threading
import time
import urllib.parse
from pathlib import Path

import requests
import yaml

try:
    from onvif import ONVIFCamera
    ONVIF_AVAILABLE = True
except ImportError:
    ONVIF_AVAILABLE = False

# ─── Configuração ─────────────────────────────────────────────────────────────

BASE_DIR    = Path(__file__).parent
CONFIG_FILE = BASE_DIR / "iot_devices.yml"
BASE_CONFIG = BASE_DIR / "mediamtx.base.yml"
FINAL_CONFIG = BASE_DIR / "mediamtx.yml"
MEDIAMTX_BIN = BASE_DIR / "mediamtx"

RELAY_SERVER = os.environ.get("RELAY_SERVER", "")
API_KEY      = os.environ.get("API_KEY", "")

BACKEND_URL  = f"http://{RELAY_SERVER}:3000"
PTZ_PORT     = 9000

# ─── Helpers ──────────────────────────────────────────────────────────────────

def log(msg):
    print(f"[gateway] {msg}", flush=True)


def die(msg):
    print(f"[ERRO] {msg}", file=sys.stderr)
    sys.exit(1)


def get_local_ip():
    """Detecta o IP local usado para alcançar o relay server."""
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect((RELAY_SERVER, 3000))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except Exception as e:
        log(f"Aviso: não foi possível detectar IP local: {e}")
        return "127.0.0.1"


# ─── Backend ──────────────────────────────────────────────────────────────────

def authenticate(local_api_url=None):
    log("Autenticando no backend...")
    body = {"api_key": API_KEY}
    if local_api_url:
        body["local_api_url"] = local_api_url

    try:
        resp = requests.post(
            f"{BACKEND_URL}/api/gateways/auth",
            json=body,
            timeout=10,
        )
        data = resp.json()
    except Exception as e:
        die(f"Falha ao conectar ao backend ({BACKEND_URL}): {e}")

    if not data.get("valid"):
        die(f"API key inválida ou gateway inativo. Resposta: {data}")

    log(f"Gateway autenticado: {data['name']}")
    return data["name"]


def register_devices(devices):
    log("Registrando dispositivos IoT no backend...")
    try:
        resp = requests.post(
            f"{BACKEND_URL}/api/iot-devices/register",
            json={"api_key": API_KEY, "devices": devices},
            timeout=10,
        )
        result = resp.json()
        log(f"Registro: {json.dumps(result, ensure_ascii=False)}")
        return result
    except Exception as e:
        log(f"Aviso: falha ao registrar dispositivos — {e}")
        return {}


# ─── ONVIF PTZ ────────────────────────────────────────────────────────────────

def build_onvif_cameras(devices):
    """Instancia câmeras ONVIF para dispositivos com onvif_port definido."""
    if not ONVIF_AVAILABLE:
        has_ptz = any(d.get("onvif_port") for d in devices if d.get("type") == "CAMERA")
        if has_ptz:
            log("Aviso: onvif-zeep não instalado. Execute: pip3 install onvif-zeep")
        return {}

    cameras = {}
    for device in devices:
        if device.get("type") != "CAMERA":
            continue
        onvif_port = device.get("onvif_port")
        if not onvif_port:
            continue

        name = device.get("name", "")
        url  = device.get("url", "")
        if not name or not url:
            continue

        try:
            parsed   = urllib.parse.urlparse(url)
            host     = parsed.hostname
            user     = parsed.username or ""
            password = parsed.password or ""

            cam = ONVIFCamera(host, onvif_port, user, password)
            ptz = cam.create_ptz_service()

            media    = cam.create_media_service()
            profiles = media.GetProfiles()
            token    = profiles[0].token

            cameras[name] = {"ptz": ptz, "token": token}
            log(f"ONVIF PTZ configurado: {name} ({host}:{onvif_port})")
        except Exception as e:
            log(f"Aviso: falha ao configurar ONVIF para {name}: {e}")

    return cameras


def make_ptz_handler(onvif_cameras):
    """Cria classe de handler HTTP com acesso ao mapa de câmeras ONVIF."""

    class PTZHandler(http.server.BaseHTTPRequestHandler):

        _cameras = onvif_cameras

        _MOVES = {
            "up":    (0.0,  0.1),
            "down":  (0.0, -0.1),
            "left":  (-0.1, 0.0),
            "right": ( 0.1, 0.0),
        }

        def do_OPTIONS(self):
            self.send_response(200)
            self._cors()
            self.end_headers()

        def do_POST(self):
            if self.path != "/ptz":
                self.send_response(404)
                self.end_headers()
                return

            length = int(self.headers.get("Content-Length", 0))
            body   = json.loads(self.rfile.read(length)) if length else {}

            camera_name = body.get("camera_name", "")
            direction   = body.get("direction", "")

            cam = self._cameras.get(camera_name)
            if cam is None:
                self._respond(404, {"error": "camera not found or PTZ not configured"})
                return

            try:
                ptz   = cam["ptz"]
                token = cam["token"]

                if direction == "home":
                    req = ptz.create_type("GotoHomePosition")
                    req.ProfileToken = token
                    req.Speed = None
                    ptz.GotoHomePosition(req)
                elif direction in self._MOVES:
                    dx, dy = self._MOVES[direction]
                    req = ptz.create_type("RelativeMove")
                    req.ProfileToken = token
                    req.Translation  = {
                        "PanTilt": {"x": dx, "y": dy},
                        "Zoom":    {"x": 0.0},
                    }
                    ptz.RelativeMove(req)
                else:
                    self._respond(400, {"error": "invalid direction"})
                    return

                self._respond(200, {"ok": True})
            except Exception as e:
                log(f"Erro PTZ ({camera_name}, {direction}): {e}")
                self._respond(500, {"error": "ptz error"})

        def _respond(self, code, data):
            self.send_response(code)
            self._cors()
            self.end_headers()
            self.wfile.write(json.dumps(data).encode())

        def _cors(self):
            self.send_header("Access-Control-Allow-Origin",  "*")
            self.send_header("Access-Control-Allow-Methods", "POST, OPTIONS")
            self.send_header("Access-Control-Allow-Headers", "Content-Type")
            self.send_header("Content-Type", "application/json")

        def log_message(self, format, *args):
            pass  # silencia log de acesso padrão

    return PTZHandler


def start_ptz_server(onvif_cameras):
    """Sobe ThreadingHTTPServer na porta PTZ_PORT em daemon thread."""
    handler = make_ptz_handler(onvif_cameras)
    server  = http.server.ThreadingHTTPServer(("0.0.0.0", PTZ_PORT), handler)
    t = threading.Thread(target=server.serve_forever, daemon=True)
    t.start()
    return server


# ─── Configuração MediaMTX ────────────────────────────────────────────────────

def build_mediamtx_config(devices):
    if not BASE_CONFIG.exists():
        die(f"Config base não encontrada: {BASE_CONFIG}")

    with open(BASE_CONFIG) as f:
        config = yaml.safe_load(f) or {}

    paths = {}
    camera_count = 0

    for device in devices:
        if device.get("type") != "CAMERA":
            continue

        name = device.get("name", "")
        url  = device.get("url", "")

        if not name or not url:
            log(f"Aviso: dispositivo CAMERA sem name ou url — ignorado")
            continue

        log(f"Configurando câmera: {name} ({url})")
        camera_count += 1

        paths[name] = {
            "source": url,
            "sourceOnDemand": False,
            "runOnReady": (
                f"ffmpeg -analyzeduration 5000000 -probesize 5000000 "
                f"-rtsp_transport tcp -i rtsp://localhost:8554/{name} "
                f"-map 0 -c copy -f rtsp -rtsp_transport tcp "
                f"rtsp://gateway:{API_KEY}@{RELAY_SERVER}:8554/{name}"
            ),
            "runOnReadyRestart": True,
        }

    if camera_count == 0:
        log("Aviso: nenhum dispositivo CAMERA definido")

    paths["all_others"] = {}
    config["paths"] = paths

    with open(FINAL_CONFIG, "w") as f:
        yaml.dump(config, f, default_flow_style=False, allow_unicode=True)

    log(f"mediamtx.yml gerado ({camera_count} câmera(s))")


# ─── MediaMTX ─────────────────────────────────────────────────────────────────

mediamtx_proc = None


def start_mediamtx():
    global mediamtx_proc
    log(f"Iniciando MediaMTX ({MEDIAMTX_BIN})...")
    mediamtx_proc = subprocess.Popen([str(MEDIAMTX_BIN), str(FINAL_CONFIG)])
    log(f"MediaMTX PID: {mediamtx_proc.pid}")
    return mediamtx_proc


def monitor_mediamtx(proc):
    """Aguarda o processo e reinicia se cair inesperadamente."""
    while True:
        code = proc.wait()
        if code == 0:
            log("MediaMTX encerrado normalmente.")
            break
        log(f"MediaMTX saiu com código {code}. Reiniciando em 5s...")
        time.sleep(5)
        proc = start_mediamtx()


# ─── Shutdown ─────────────────────────────────────────────────────────────────

def shutdown(sig, frame):
    log("Sinal de encerramento recebido.")
    if mediamtx_proc and mediamtx_proc.poll() is None:
        log("Encerrando MediaMTX...")
        mediamtx_proc.terminate()
        try:
            mediamtx_proc.wait(timeout=5)
        except subprocess.TimeoutExpired:
            mediamtx_proc.kill()
    sys.exit(0)


# ─── Main ─────────────────────────────────────────────────────────────────────

def main():
    # Validações de ambiente
    if not RELAY_SERVER:
        die("Variável RELAY_SERVER não definida")
    if not API_KEY:
        die("Variável API_KEY não definida")
    if not CONFIG_FILE.exists():
        die(f"{CONFIG_FILE} não encontrado. Copie iot_devices.yml.example e ajuste.")
    if not MEDIAMTX_BIN.exists():
        die(
            f"Binário mediamtx não encontrado em {MEDIAMTX_BIN}.\n"
            "Execute: bash install.sh"
        )

    # Carrega dispositivos
    with open(CONFIG_FILE) as f:
        raw = yaml.safe_load(f)
    devices = raw.get("devices", [])
    log(f"{len(devices)} dispositivo(s) em {CONFIG_FILE}")

    # Detecta IP local e monta URL da API PTZ
    local_ip      = get_local_ip()
    local_api_url = f"http://{local_ip}:{PTZ_PORT}"

    # Fluxo principal
    authenticate(local_api_url=local_api_url)
    register_devices(devices)
    build_mediamtx_config(devices)

    # Inicia API PTZ (daemon thread)
    onvif_cameras = build_onvif_cameras(devices)
    start_ptz_server(onvif_cameras)
    log(f"PTZ API em {local_api_url}")

    # Signals
    signal.signal(signal.SIGINT, shutdown)
    signal.signal(signal.SIGTERM, shutdown)

    # Inicia e monitora MediaMTX
    proc = start_mediamtx()
    monitor_mediamtx(proc)


if __name__ == "__main__":
    main()
