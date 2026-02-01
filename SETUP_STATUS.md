# Setup Status & Next Steps

## ✅ Completed
- Python virtual environment created
- Python dependencies installed (FastAPI, SQLAlchemy, Alembic, etc.)
- Environment files created

## ⚠️  Manual Steps Required

### 1. Install pnpm
You have two options:

**Option A: With sudo (recommended)**
```bash
sudo npm install -g pnpm
```

**Option B: Using npx (no sudo needed)**
```bash
# This will use npx each time, or you can alias it
npx pnpm install
```

### 2. Start Docker Desktop
**You must manually start Docker Desktop application first!**

1. Open Docker Desktop from Applications
2. Wait for it to fully start (whale icon in menu bar)
3. Then run:
```bash
docker-compose -f infra/docker-compose.yml up -d
```

### 3. Install Node.js dependencies
Once pnpm is available:
```bash
pnpm install
# OR if using npx:
npx pnpm install
```

### 4. Run database migrations
**Only after Docker is running:**
```bash
cd apps/api
source venv/bin/activate
alembic upgrade head
cd ../..
```

### 5. Start development servers
```bash
# Option 1: Use Make
make dev

# Option 2: Manual
# Terminal 1:
cd apps/api && source venv/bin/activate && pnpm dev

# Terminal 2:
cd apps/web && pnpm dev
```

## Quick Check Commands

```bash
# Check if Docker is running
docker info

# Check if pnpm is available
which pnpm || echo "pnpm not found"

# Check if ports are free
lsof -ti:3000 || echo "Port 3000 is free"
lsof -ti:8000 || echo "Port 8000 is free"
```

## Current Blockers

1. **Docker Desktop** - Must be started manually
2. **pnpm** - Needs sudo or use npx method

Once these are resolved, you can proceed with the remaining steps.

