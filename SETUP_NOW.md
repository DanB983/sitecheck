# 🚀 Setup Instructions - Start Here

## Step 1: Install Prerequisites

### Install pnpm (if not installed)
```bash
npm install -g pnpm
```

### Install PostgreSQL development libraries (for psycopg2)
```bash
# macOS
brew install postgresql@15

# Or if you have Docker, you can skip this and use Docker's Postgres
```

### Start Docker Desktop
Make sure Docker Desktop is running before proceeding.

## Step 2: Install Dependencies

```bash
# Install Node.js dependencies
pnpm install

# Install Python dependencies
cd apps/api
python3 -m venv venv
source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt
cd ../..
```

**Note:** If `psycopg2-binary` fails to install, you can:
- Install PostgreSQL via Homebrew: `brew install postgresql@15`
- Or use Docker's Postgres (which we'll start next)

## Step 3: Start Docker Services

```bash
# Start Postgres and Adminer
docker-compose -f infra/docker-compose.yml up -d

# Wait a few seconds for Postgres to be ready
sleep 5
```

## Step 4: Run Database Migrations

```bash
cd apps/api
source venv/bin/activate
alembic upgrade head
cd ../..
```

## Step 5: Start Development Servers

### Option A: Use the start script
```bash
./start-dev.sh
```

### Option B: Use Make
```bash
make dev
```

### Option C: Manual (two terminals)

**Terminal 1 - Backend:**
```bash
cd apps/api
source venv/bin/activate
pnpm dev
```

**Terminal 2 - Frontend:**
```bash
cd apps/web
pnpm dev
```

## Step 6: Access the Application

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:8000
- **API Docs:** http://localhost:8000/docs
- **Adminer (DB):** http://localhost:8080
  - Server: `postgres`
  - Username: `elephantfly`
  - Password: `elephantfly_dev`
  - Database: `elephantfly_scan`

## Quick Commands Reference

```bash
# Kill processes on ports 3000/8000
lsof -ti:3000 | xargs kill -9
lsof -ti:8000 | xargs kill -9

# Start Docker
make docker-up

# Stop Docker
make docker-down

# Run migrations
make migrate

# Run tests
make test
```

## Troubleshooting

### "pnpm: command not found"
```bash
npm install -g pnpm
```

### "Docker daemon not running"
Start Docker Desktop application

### "psycopg2 installation failed"
```bash
# Install PostgreSQL libraries
brew install postgresql@15

# Then retry
cd apps/api
source venv/bin/activate
pip install psycopg2-binary
```

### "Port already in use"
```bash
# Kill processes
lsof -ti:3000 | xargs kill -9
lsof -ti:8000 | xargs kill -9
```

### Reset everything
```bash
make clean
make docker-down
make docker-up
cd apps/api && source venv/bin/activate && alembic upgrade head
```

