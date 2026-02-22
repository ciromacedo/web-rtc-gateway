#!/usr/bin/env python3
"""
SmartMesh Gateway — Agente nativo (sem Docker)
Equivalente ao entrypoint.sh + container mediamtx, mas rodando nativamente.

Fluxo:
  1. Lê iot_devices.yml
  2. Autentica API key no backend
  3. Registra dispositivos IoT no backend
  4. Gera mediamtx.yml com os paths de câmeras RTSP
  5. Inicia o binário mediamtx como subprocesso
  6. Monitora e reinicia se cair
"""

import json
import os
import signal
import subprocess
import sys
import time
from pathlib import Path

import requests
import yaml

# ─── Configuração ─────────────────────────────────────────────────────────────

BASE_DIR    = Path(__file__).parent
CONFIG_FILE = BASE_DIR / "iot_devices.yml"
BASE_CONFIG = BASE_DIR / "mediamtx.base.yml"
FINAL_CONFIG = BASE_DIR / "mediamtx.yml"
MEDIAMTX_BIN = BASE_DIR / "mediamtx"

RELAY_SERVER = os.environ.get("RELAY_SERVER", "")
API_KEY      = os.environ.get("API_KEY", "")

BACKEND_URL  = f"http://{RELAY_SERVER}:3000"

# ─── Helpers ──────────────────────────────────────────────────────────────────

def log(msg):
    print(f"[gateway] {msg}", flush=True)


def die(msg):
    print(f"[ERRO] {msg}", file=sys.stderr)
    sys.exit(1)


# ─── Backend ──────────────────────────────────────────────────────────────────

def authenticate():
    log("Autenticando no backend...")
    try:
        resp = requests.post(
            f"{BACKEND_URL}/api/gateways/auth",
            json={"api_key": API_KEY},
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
                f"ffmpeg -rtsp_transport tcp -i rtsp://localhost:8554/{name} "
                f"-c copy -f rtsp -rtsp_transport tcp "
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

    # Fluxo principal
    authenticate()
    register_devices(devices)
    build_mediamtx_config(devices)

    # Signals
    signal.signal(signal.SIGINT, shutdown)
    signal.signal(signal.SIGTERM, shutdown)

    # Inicia e monitora MediaMTX
    proc = start_mediamtx()
    monitor_mediamtx(proc)


if __name__ == "__main__":
    main()
