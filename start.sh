#!/usr/bin/env bash
set -euo pipefail
root_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$root_dir"
[[ -f .env ]] || { echo "Missing .env; copy .env.example and configure it." >&2; exit 1; }
[[ -d node_modules ]] || { echo "Dependencies missing; run scripts/bootstrap.sh." >&2; exit 1; }
set -a
# shellcheck disable=SC1091
source .env
set +a

backend_port="${BACKEND_PORT:-${PORT:-4000}}"
frontend_port="${FRONTEND_PORT:-5173}"
[[ "$backend_port" != "$frontend_port" ]] || { echo "Backend and frontend ports must differ." >&2; exit 1; }
for port in "$backend_port" "$frontend_port"; do
  if command -v lsof >/dev/null 2>&1 && lsof -tiTCP:"$port" -sTCP:LISTEN >/dev/null 2>&1; then
    echo "Port $port is already in use." >&2
    exit 1
  fi
done

if [[ "${MIGRATE_ON_START:-false}" == "true" ]]; then
  node server/scripts/runtime-init.js
fi

PORT="$backend_port" BACKEND_PORT="$backend_port" npm start &
backend_pid=$!
FRONTEND_PORT="$frontend_port" BACKEND_PORT="$backend_port" node server/frontend.js &
frontend_pid=$!
cleanup() {
  kill "$backend_pid" "$frontend_pid" 2>/dev/null || true
  wait "$backend_pid" "$frontend_pid" 2>/dev/null || true
}
trap cleanup EXIT INT TERM
wait "$backend_pid" "$frontend_pid"
