#!/bin/bash

# Clash Royale Development Setup Script

echo "🎮 Clash Royale Web Game - Development Setup"
echo "============================================="
echo ""

# Check if pnpm is installed
if ! command -v pnpm &> /dev/null; then
    echo "❌ pnpm is not installed. Please install it first:"
    echo "   npm install -g pnpm"
    exit 1
fi

echo "✅ pnpm found: $(pnpm --version)"
echo ""

# Install dependencies
echo "📦 Installing dependencies..."
pnpm install

if [ $? -eq 0 ]; then
    echo "✅ Dependencies installed successfully"
else
    echo "❌ Failed to install dependencies"
    exit 1
fi

echo ""
echo "🚀 Setup complete! To start the application:"
echo ""
echo "Terminal 1 (Server):"
echo "  cd $(pwd)"
echo "  pnpm --filter server dev"
echo ""
echo "Terminal 2 (Client):"
echo "  cd $(pwd)"
echo "  pnpm --filter client dev"
echo ""
echo "Then open: http://localhost:3000"
echo ""
echo "Happy coding! 🎉"
