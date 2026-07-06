#!/bin/bash
# ==========================================
# Automated Test Runner
# ==========================================
set -e

echo "🧪 [FinTech Platform V2] Initiating validation test suites..."

# Check if Jest is installed
if ! npx jest --version &> /dev/null; then
  echo "Installing development test framework (Jest)..."
  yarn add -D jest @types/jest ts-jest ts-node
fi

echo "🚀 Executing Policy Evaluation and Multi-Agent integration tests..."
npx jest --verbose
