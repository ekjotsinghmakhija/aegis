#!/bin/bash

echo "🚀 Building Aegis Frontend..."
cd dashboard
npm install && npm run build
cd ..

echo "📦 Compiling Single Binary..."
# Ensure CGO is enabled for SQLite support
export CGO_ENABLED=1
go build -o aegis cmd/aegis/main.go

echo "✅ Success! Run './aegis' to start the monitor."
