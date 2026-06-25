#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

: "${CLOUDBASE_ENV_ID:?CLOUDBASE_ENV_ID is required}"

API_SERVICE_NAME="${API_SERVICE_NAME:-lifetracker-api}"
WEB_SERVICE_NAME="${WEB_SERVICE_NAME:-lifetracker-web}"
API_PORT="${API_PORT:-80}"

cd "$ROOT_DIR"

echo "Deploy backend CloudRun service: ${API_SERVICE_NAME}"
printf '\n' | tcb cloudrun deploy \
  --env-id "$CLOUDBASE_ENV_ID" \
  --serviceName "$API_SERVICE_NAME" \
  --source ./backend \
  --port "$API_PORT" \
  --installDependency false \
  --force

echo "Build frontend Web bundle"
(
  cd frontend
  npm run build:web
)

echo "Deploy frontend CloudBase App: ${WEB_SERVICE_NAME}"
printf '\n' | tcb app deploy "$WEB_SERVICE_NAME" \
  --env-id "$CLOUDBASE_ENV_ID" \
  --framework static \
  --install-command "" \
  --build-command "" \
  --output-dir dist \
  --cwd ./frontend \
  --force

echo "CloudBase deployment submitted."
