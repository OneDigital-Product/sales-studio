#!/bin/bash

# Sales Studio - Development Environment Initialization Script
# This script sets up and runs the development environment for future agents

set -e  # Exit on error

echo "=========================================="
echo "Sales Studio - Environment Initialization"
echo "=========================================="
echo ""

# Check if bun is installed
if ! command -v bun &> /dev/null; then
    echo "❌ Error: Bun is not installed"
    echo "Please install Bun from https://bun.sh"
    echo "Run: curl -fsSL https://bun.sh/install | bash"
    exit 1
fi

echo "✅ Bun is installed ($(bun --version))"
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found"
    echo "Please run this script from the project root directory"
    exit 1
fi

echo "📦 Installing dependencies..."
bun install

echo ""
echo "🔧 Checking Convex configuration..."

# Check if .env.local exists and has NEXT_PUBLIC_CONVEX_URL
if [ ! -f ".env.local" ]; then
    echo "⚠️  Warning: .env.local not found"
    echo "You may need to create it with your NEXT_PUBLIC_CONVEX_URL"
    echo ""
fi

# Check if Convex is configured
if [ ! -f "convex/schema.ts" ]; then
    echo "⚠️  Warning: Convex schema not found"
    echo "You may need to initialize Convex"
    echo ""
fi

echo "✅ Dependencies installed"
echo ""

echo "=========================================="
echo "🚀 Starting Development Servers"
echo "=========================================="
echo ""
echo "This will start:"
echo "  - Next.js frontend (http://localhost:3000)"
echo "  - Convex backend (real-time database)"
echo ""
echo "Press Ctrl+C to stop all servers"
echo ""

# Start both servers concurrently
bun run dev:all
