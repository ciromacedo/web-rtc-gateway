#!/bin/bash
# Instala dependências e baixa o binário MediaMTX para o ambiente atual.
# Suporta: Linux x86_64 (WSL), Linux ARM64 (Raspberry Pi 4), Linux ARMv7 (Raspberry Pi 3/Zero 2)
set -e

MEDIAMTX_VERSION="v1.9.3"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

# ─── Detecta arquitetura ──────────────────────────────────────────────────────
ARCH=$(uname -m)
case "$ARCH" in
  x86_64)         MEDIAMTX_ARCH="linux_amd64" ;;
  aarch64|arm64)  MEDIAMTX_ARCH="linux_arm64v8" ;;
  armv7l)         MEDIAMTX_ARCH="linux_arm7" ;;
  *)              echo "Arquitetura não suportada: $ARCH"; exit 1 ;;
esac

echo "Sistema  : $(uname -s) $ARCH"
echo "MediaMTX : $MEDIAMTX_VERSION ($MEDIAMTX_ARCH)"
echo "Diretório: $SCRIPT_DIR"
echo ""

# ─── Python dependencies ─────────────────────────────────────────────────────
echo ">>> Instalando dependências Python..."
pip3 install -r "$SCRIPT_DIR/requirements.txt" --break-system-packages --quiet \
  || pip3 install -r "$SCRIPT_DIR/requirements.txt" --quiet \
  || python3 -m pip install -r "$SCRIPT_DIR/requirements.txt" --quiet
echo "    OK"

# ─── MediaMTX binary ─────────────────────────────────────────────────────────
MEDIAMTX_BIN="$SCRIPT_DIR/mediamtx"

if [ -f "$MEDIAMTX_BIN" ]; then
  echo ">>> MediaMTX já instalado ($("$MEDIAMTX_BIN" --version 2>&1 | head -1))"
else
  TARBALL="mediamtx_${MEDIAMTX_VERSION}_${MEDIAMTX_ARCH}.tar.gz"
  URL="https://github.com/bluenviron/mediamtx/releases/download/${MEDIAMTX_VERSION}/${TARBALL}"

  echo ">>> Baixando MediaMTX..."
  echo "    $URL"
  wget -q --show-progress -O "/tmp/$TARBALL" "$URL"

  echo ">>> Extraindo..."
  tar -xzf "/tmp/$TARBALL" -C "$SCRIPT_DIR" mediamtx
  chmod +x "$MEDIAMTX_BIN"
  rm "/tmp/$TARBALL"
  echo "    OK — $MEDIAMTX_BIN"
fi

# ─── Config base (symlink para o mediamtx.base.yml do gateway Docker) ─────────
BASE_LINK="$SCRIPT_DIR/mediamtx.base.yml"
BASE_SOURCE="$SCRIPT_DIR/../gateway/mediamtx/mediamtx.base.yml"

if [ ! -f "$BASE_LINK" ]; then
  if [ -f "$BASE_SOURCE" ]; then
    ln -s "$(realpath "$BASE_SOURCE")" "$BASE_LINK"
    echo ">>> mediamtx.base.yml vinculado de ../gateway/mediamtx/"
  else
    echo "AVISO: $BASE_SOURCE não encontrado. Crie mediamtx.base.yml manualmente."
  fi
else
  echo ">>> mediamtx.base.yml já existe"
fi

# ─── .env ────────────────────────────────────────────────────────────────────
if [ ! -f "$SCRIPT_DIR/.env" ]; then
  cp "$SCRIPT_DIR/.env.example" "$SCRIPT_DIR/.env"
  echo ">>> .env criado a partir do .env.example — edite com suas credenciais"
else
  echo ">>> .env já existe"
fi

# ─── iot_devices.yml ─────────────────────────────────────────────────────────
if [ ! -f "$SCRIPT_DIR/iot_devices.yml" ]; then
  cp "$SCRIPT_DIR/iot_devices.yml.example" "$SCRIPT_DIR/iot_devices.yml"
  echo ">>> iot_devices.yml criado a partir do exemplo — edite com seus dispositivos"
else
  echo ">>> iot_devices.yml já existe"
fi

echo ""
echo "Instalação concluída!"
echo ""
echo "Próximos passos:"
echo "  1. Edite .env com RELAY_SERVER e API_KEY"
echo "  2. Edite iot_devices.yml com seus dispositivos"
echo "  3. Execute: bash run.sh"
