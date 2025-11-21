#!/usr/bin/env bash
set -euo pipefail

if [[ $# -lt 1 ]]; then
  echo "用法: $0 <profile-id> [firefox-额外参数...]" >&2
  exit 1
fi

PROFILE_ID="$1"
shift || true
EXTRA_ARGS=("$@")

SCRIPT_DIR="$(cd -- "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd -- "${SCRIPT_DIR}/../.." && pwd)"
CLI_ENTRY="${PROJECT_ROOT}/dist/cli.js"
NODE_BIN="${NODE_BIN:-node}"

run_cli() {
  "${NODE_BIN}" "${CLI_ENTRY}" "$@"
}

THAWED=0
cleanup() {
  if [[ ${THAWED} -eq 1 ]]; then
    run_cli freeze "${PROFILE_ID}" >/dev/null
  fi
}

trap cleanup EXIT

run_cli thaw "${PROFILE_ID}"
THAWED=1
run_cli extensions sync "${PROFILE_ID}"

if [[ ${#EXTRA_ARGS[@]} -gt 0 ]]; then
  run_cli launch "${PROFILE_ID}" --args "${EXTRA_ARGS[*]}"
else
  run_cli launch "${PROFILE_ID}"
fi
