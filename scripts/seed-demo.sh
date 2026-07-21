#!/usr/bin/env bash
set -euo pipefail
[[ "${CONFIRM_DEMO_SEED:-}" == "yes" && "${NODE_ENV:-}" != "production" ]] || { echo "Set CONFIRM_DEMO_SEED=yes outside production; this legacy seed rebuilds tables." >&2; exit 1; }
npm --prefix "$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)" run seed
