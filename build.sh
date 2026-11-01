#!/usr/bin/env bash
set -e

echo "=== Installing Python dependencies ==="
pip install -r backend/requirements.txt

echo "=== Building React frontend ==="
cd frontend
npm install
npm run build
cd ..

echo "=== GuideLens Build Complete ==="
