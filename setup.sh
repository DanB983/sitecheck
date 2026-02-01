#!/bin/bash
set -e

echo "🚀 Setting up Elephantfly Scan..."

# Check prerequisites
echo "Checking prerequisites..."
command -v pnpm >/dev/null 2>&1 || { echo "❌ pnpm is required. Install with: npm install -g pnpm"; exit 1; }
command -v python3 >/dev/null 2>&1 || { echo "❌ python3 is required"; exit 1; }
command -v docker >/dev/null 2>&1 || { echo "❌ docker is required"; exit 1; }

# Install Node dependencies
echo "📦 Installing Node dependencies..."
pnpm install

# Setup Python backend
echo "🐍 Setting up Python backend..."
cd apps/api
if [ ! -d "venv" ]; then
    python3 -m venv venv
fi
source venv/bin/activate
pip install -r requirements.txt
cd ../..

# Copy env files
echo "📝 Setting up environment files..."
if [ ! -f "apps/api/.env" ]; then
    cp apps/api/env.example apps/api/.env
    echo "✓ Created apps/api/.env"
fi

if [ ! -f "apps/web/.env.local" ]; then
    cp apps/web/env.example apps/web/.env.local
    echo "✓ Created apps/web/.env.local"
fi

echo ""
echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Start Docker: make docker-up"
echo "2. Run migrations: make migrate"
echo "3. Start dev servers: make dev"
echo ""

