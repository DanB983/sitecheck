# Development Server Status

## 🚀 Servers Starting

The development servers are being started in the background.

### Access Points

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:8000
- **API Docs:** http://localhost:8000/docs

## ⚠️  Important Note

**Docker is not currently running**, which means:
- ✅ Frontend will work (can view pages)
- ⚠️  Backend will start but database operations will fail
- ❌ Scans won't work until Docker/Postgres is running

## To Enable Full Functionality

1. **Start Docker Desktop**
2. **Start containers:**
   ```bash
   docker-compose -f infra/docker-compose.yml up -d
   ```
3. **Run migrations:**
   ```bash
   cd apps/api
   source venv/bin/activate
   alembic upgrade head
   ```

## Check Server Status

```bash
# Check if servers are running
curl http://localhost:3000
curl http://localhost:8000/health

# Check processes
lsof -ti:3000,8000
```

## Stop Servers

```bash
# Kill processes on ports
lsof -ti:3000 | xargs kill -9
lsof -ti:8000 | xargs kill -9
```

