# Current Setup Status

## ✅ Completed
- Python virtual environment created
- Python dependencies installed (FastAPI, SQLAlchemy, Alembic, etc.)
- Environment files created (.env and .env.local)
- Ports 3000 and 8000 cleared

## ⚠️  Action Required

### 1. Install pnpm (if not installed)
```bash
npm install -g pnpm
```

### 2. Start Docker Desktop
Make sure Docker Desktop is running, then:
```bash
docker-compose -f infra/docker-compose.yml up -d
```

### 3. Install Node.js dependencies
```bash
pnpm install
```

### 4. Run database migrations
```bash
cd apps/api
source venv/bin/activate
alembic upgrade head
cd ../..
```

### 5. Start development servers

**Option A: Use the start script**
```bash
./start-dev.sh
```

**Option B: Use Make**
```bash
make dev
```

**Option C: Manual (two terminals)**

Terminal 1:
```bash
cd apps/api
source venv/bin/activate
pnpm dev
```

Terminal 2:
```bash
cd apps/web
pnpm dev
```

## Quick Commands

```bash
# Kill ports
lsof -ti:3000 | xargs kill -9
lsof -ti:8000 | xargs kill -9

# Start Docker
make docker-up

# Run migrations
make migrate

# Start dev
make dev
```

