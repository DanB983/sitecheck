# Quick Start Guide

## Prerequisites Check

1. **Docker Desktop** - Must be running
2. **Node.js 18+** and **pnpm** - `npm install -g pnpm`
3. **Python 3.11+** - Check with `python3 --version`

## One-Time Setup

```bash
# Install all dependencies
./setup.sh

# Or manually:
pnpm install
cd apps/api && python3 -m venv venv && source venv/bin/activate && pip install -r requirements.txt
```

## Daily Development Workflow

### Option 1: Use the start script (Recommended)
```bash
./start-dev.sh
```
This script will:
- Kill any processes on ports 3000/8000
- Start Docker containers
- Run migrations
- Start both frontend and backend

### Option 2: Manual steps

1. **Start Docker:**
   ```bash
   make docker-up
   # Or: docker-compose -f infra/docker-compose.yml up -d
   ```

2. **Run migrations:**
   ```bash
   make migrate
   # Or: cd apps/api && source venv/bin/activate && alembic upgrade head
   ```

3. **Start dev servers:**
   ```bash
   make dev
   # Or: pnpm dev
   ```

## Access Points

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:8000
- **API Documentation:** http://localhost:8000/docs
- **Database Admin (Adminer):** http://localhost:8080
  - Server: `postgres`
  - Username: `elephantfly`
  - Password: `elephantfly_dev`
  - Database: `elephantfly_scan`

## Troubleshooting

### Ports already in use
```bash
# Kill processes on ports 3000 and 8000
lsof -ti:3000 | xargs kill -9
lsof -ti:8000 | xargs kill -9
```

### Docker not running
```bash
# Start Docker Desktop, then:
docker-compose -f infra/docker-compose.yml up -d
```

### Database connection errors
```bash
# Restart Docker containers
make docker-down
make docker-up
make migrate
```

### Python dependencies missing
```bash
cd apps/api
source venv/bin/activate
pip install -r requirements.txt
```

### Reset everything
```bash
make clean
./setup.sh
make docker-up
make migrate
```

