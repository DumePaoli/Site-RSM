#!/usr/bin/env bash
# RSM Shop — dev mode (hot reload)
# Backend: http://localhost:8001  Frontend: http://localhost:5174

set -e
ROOT="$(cd "$(dirname "$0")" && pwd)"

echo "[rsm-shop] Starting backend…"
cd "$ROOT/backend"
pip install -q -r requirements.txt

uvicorn main:app --host 0.0.0.0 --port 8001 --reload &
BACKEND_PID=$!

echo "[rsm-shop] Starting frontend…"
cd "$ROOT/frontend"
npm install --silent
npm run dev &
FRONTEND_PID=$!

echo ""
echo "  Backend  → http://localhost:8001"
echo "  Frontend → http://localhost:5174"
echo "  Admin    → http://localhost:5174/admin"
echo ""
echo "Press Ctrl+C to stop both."
trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null" EXIT INT TERM
wait
