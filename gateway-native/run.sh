#!/bin/bash
# Inicia o gateway nativo carregando variáveis do .env
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ENV_FILE="$SCRIPT_DIR/.env"

if [ ! -f "$ENV_FILE" ]; then
  echo "ERRO: $ENV_FILE não encontrado. Execute: bash install.sh"
  exit 1
fi

# Carrega .env
set -a
source "$ENV_FILE"
set +a

exec python3 "$SCRIPT_DIR/gateway.py"
