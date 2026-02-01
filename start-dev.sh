#!/bin/bash
set -e

echo "🚀 Starting Elephantfly Scan Development Environment"
echo ""

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker Desktop and try again."
    exit 1
fi

# Kill any existing processes on ports 3000 and 8000
echo "🔍 Checking ports 3000 and 8000..."
lsof -ti:3000 | xargs kill -9 2>/dev/null || true
lsof -ti:8000 | xargs kill -9 2>/dev/null || true
echo "✓ Ports cleared"

# Start Docker containers
echo ""
echo "🐳 Starting Docker containers..."
docker-compose -f infra/docker-compose.yml up -d
sleep 3
echo "✓ Docker containers started"

# Check if dependencies are installed
if [ ! -d "node_modules" ]; then
    echo ""
    echo "📦 Installing Node dependencies..."
    pnpm install
fi

if [ ! -d "apps/api/venv" ]; then
    echo ""
    echo "🐍 Setting up Python virtual environment..."
    cd apps/api
    python3 -m venv venv
    source venv/bin/activate
    pip install -r requirements.txt
    cd ../..
fi

# Run migrations
echo ""
echo "🗄️  Running database migrations..."
cd apps/api
source venv/bin/activate
alembic upgrade head || echo "⚠️  Migration may have already run"
cd ../..

# Start dev servers
echo ""
echo "🎉 Starting development servers..."
echo "   Frontend: http://localhost:3000"
echo "   Backend:  http://localhost:8000"
echo "   API Docs: http://localhost:8000/docs"
echo "   Adminer:  http://localhost:8080"
echo ""
echo "Press Ctrl+C to stop all servers"
echo ""

# Start both servers in background
cd apps/api
source venv/bin/activate
pnpm dev &
API_PID=$!
cd ../web
pnpm dev &
WEB_PID=$!

# Wait for user interrupt
trap "kill $API_PID $WEB_PID 2>/dev/null; exit" INT TERM
wait

