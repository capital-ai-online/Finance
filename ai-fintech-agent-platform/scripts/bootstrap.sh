#!/bin/bash
# ==========================================
# Platform Bootstrap Automation Script
# ==========================================
set -e

echo "=========================================================="
echo "🤖 Starting AI Agent FinTech Orchestration V2 Bootstrap"
echo "=========================================================="

# Check for Docker installation
if ! command -v docker &> /dev/null; then
    echo "⚠️ Warning: docker command is missing. Please install Docker for production orchestration."
fi

# Check for Node.js installation
if ! command -v node &> /dev/null; then
    echo "❌ Error: Node.js is required to boot local workspace layers. Exiting."
    exit 1
fi

echo "📦 Installing Monorepo package trees..."
yarn install

echo "🛠 Building core shared modules..."
yarn build

echo "⚡ Booting dependent services (Redis, NATS)..."
if command -v docker-compose &> /dev/null; then
    docker-compose up -d
else
    echo "⚠️ docker-compose not detected. Running services in memory-only model."
fi

echo "=========================================================="
echo "🚀 Bootstrap successful! Start developing with: yarn dev"
echo "=========================================================="
