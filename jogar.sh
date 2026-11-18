#!/usr/bin/env bash
set -euo pipefail
cd -- "$(dirname -- "${BASH_SOURCE[0]}")"
url='http://127.0.0.1:4173'
if command -v curl >/dev/null && curl -fsS --max-time 1 "$url/ark.svg" 2>/dev/null | cmp -s - public/ark.svg; then
  printf 'Bash Quest está em %s\n' "$url"
  if command -v xdg-open >/dev/null; then xdg-open "$url" >/dev/null 2>&1 || true; fi
  exit 0
fi
command -v npm >/dev/null || { printf 'Instale Node.js e npm para iniciar o jogo.\n' >&2; exit 1; }
if [[ ! -x node_modules/.bin/vite ]]; then npm ci; fi
exec npm start
