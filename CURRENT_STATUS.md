# ✅ Setup Progress

## Completed Steps

1. ✅ **Python dependencies installed** - FastAPI, SQLAlchemy, Alembic, etc.
2. ✅ **Node.js dependencies installed** - Using npx pnpm (57 packages)
3. ✅ **Environment files created** - .env and .env.local ready
4. ✅ **Ports cleared** - 3000 and 8000 are free

## ⚠️  Action Required: Start Docker Desktop

**You must manually start Docker Desktop before proceeding!**

1. Open **Docker Desktop** from your Applications
2. Wait for it to fully start (you'll see the Docker icon in your menu bar)
3. Once Docker is running, execute:

```bash
# Start Postgres and Adminer
docker-compose -f infra/docker-compose.yml up -d

# Wait a few seconds, then run migrations
cd apps/api
source venv/bin/activate
alembic upgrade head
cd ../..
```

## 🚀 Once Docker is Running

After Docker is started and migrations are run, you can start development:

```bash
# Option 1: Use Make
make dev

# Option 2: Use the start script
./start-dev.sh

# Option 3: Manual (two terminals)
# Terminal 1:
cd apps/api && source venv/bin/activate && npx pnpm dev

# Terminal 2:
cd apps/web && npx pnpm dev
```

## 📍 Access Points

Once everything is running:
- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:8000
- **API Docs:** http://localhost:8000/docs
- **Adminer (DB):** http://localhost:8080

## Note About pnpm

Since pnpm isn't globally installed, you can either:
- Use `npx pnpm` for commands (works now)
- Or install globally: `sudo npm install -g pnpm`

