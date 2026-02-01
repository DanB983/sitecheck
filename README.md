# Elephantfly Scan

A production-ready SaaS monorepo for scanning websites and generating security & GDPR/compliance reports.

## 🚀 Quick Start (macOS)

### Prerequisites

- **Node.js** 18+ and **pnpm** (install via `npm install -g pnpm`)
- **Python** 3.11+ (check with `python3 --version`)
- **Docker** and **Docker Compose** (for Postgres)

### Setup Steps

1. **Run the setup script:**
   ```bash
   ./setup.sh
   ```
   Or use Make:
   ```bash
   make setup
   ```
   Or manually:
   ```bash
   pnpm install
   cd apps/api && python3 -m venv venv && source venv/bin/activate && pip install -r requirements.txt
   ```

2. **Start Docker services (Postgres + Adminer):**
   ```bash
   make docker-up
   ```
   This starts:
   - Postgres on `localhost:5432`
   - Adminer (DB admin) on `http://localhost:8080`
     - Server: `postgres`
     - Username: `elephantfly`
     - Password: `elephantfly_dev`
     - Database: `elephantfly_scan`

3. **Configure environment variables:**
   ```bash
   # Backend
   cd apps/api
   cp .env.example .env
   # Edit .env if needed (defaults should work for local dev)
   
   # Frontend
   cd ../web
   cp .env.example .env.local
   # Edit .env.local if needed
   ```

4. **Run database migrations:**
   ```bash
   make migrate
   ```
   Or manually:
   ```bash
   cd apps/api
   source venv/bin/activate
   alembic upgrade head
   ```

5. **Start development servers:**
   ```bash
   make dev
   ```
   Or manually:
   ```bash
   # Terminal 1: Backend
   cd apps/api
   source venv/bin/activate
   pnpm dev
   
   # Terminal 2: Frontend
   cd apps/web
   pnpm dev
   ```

6. **Access the application:**
   - Frontend: http://localhost:3000
   - API: http://localhost:8000
   - API Docs: http://localhost:8000/docs
   - Adminer: http://localhost:8080

## 📁 Project Structure

```
elephantfly-scan/
├── apps/
│   ├── web/          # Next.js 14+ frontend (App Router, TypeScript, CSS Modules)
│   └── api/          # FastAPI backend (Python 3.11+, SQLAlchemy 2.0, Alembic)
├── packages/
│   └── shared/       # Shared TypeScript types and schemas
├── infra/
│   └── docker-compose.yml  # Postgres + Adminer
├── Makefile          # Common tasks (setup, dev, migrate, test)
└── README.md
```

## 🛠️ Available Commands

### Root Level (via Makefile)

- `make setup` - Install all dependencies
- `make dev` - Start both frontend and backend
- `make migrate` - Run database migrations
- `make test` - Run backend tests
- `make docker-up` - Start Docker containers
- `make docker-down` - Stop Docker containers
- `make clean` - Clean all build artifacts and dependencies

### Backend (apps/api)

- `pnpm dev` - Start FastAPI dev server (with hot reload)
- `pnpm migrate` - Run Alembic migrations
- `pnpm migrate-create <message>` - Create a new migration
- `pnpm test` - Run pytest tests

### Frontend (apps/web)

- `pnpm dev` - Start Next.js dev server
- `pnpm build` - Build for production
- `pnpm start` - Start production server

## 🗄️ Database

### Models

- **User**: `id`, `email`, `created_at`
- **Scan**: `id`, `user_id` (nullable), `url`, `created_at`, `overall_score`, `risk_level`
- **Finding**: `id`, `scan_id`, `category`, `severity`, `title`, `description`, `recommendation`

### Migrations

Alembic is configured. Create migrations with:
```bash
cd apps/api
source venv/bin/activate
alembic revision --autogenerate -m "description"
alembic upgrade head
```

## 🔌 API Endpoints

- `GET /health` - Health check
- `POST /scan` - Create a new scan
  ```json
  { "url": "https://example.com" }
  ```
- `GET /scan/{scan_id}` - Get scan report
- `GET /scan/{scan_id}/pdf` - Download PDF report (neutral)
  - Query params: `mode=branded&brand_id={id}` for branded PDFs
- `GET /scan/{scan_id}/explain` - Get AI explanation
- `GET /brands` - List brand profiles
- `POST /brands` - Create brand profile
- `GET /brands/{brand_id}` - Get brand profile
- `GET /stripe/config` - Get Stripe config (placeholder)
- `POST /stripe/create-checkout-session` - Create checkout (placeholder)

## 🎨 Frontend Pages

- `/` - Landing page
- `/scan` - URL input form
- `/report/[scanId]` - Scan report display (with PDF download)
- `/pricing` - Pricing page (3 tiers)
- `/settings/branding` - Brand profile management (for white-label PDFs)

## 🔧 Configuration

### Backend Environment Variables (apps/api/.env)

```env
DATABASE_URL=postgresql://elephantfly:elephantfly_dev@localhost:5432/elephantfly_scan
API_HOST=0.0.0.0
API_PORT=8000
CORS_ORIGINS=http://localhost:3000
STRIPE_SECRET_KEY=sk_test_placeholder
STRIPE_PUBLISHABLE_KEY=pk_test_placeholder
LLM_PROVIDER=stub

# Premium Features
ENABLE_BRANDED_PDF=false  # Set to "true" to enable white-label PDF reports
```

#### Branded PDF Export

To enable white-label/branded PDF reports:
1. Set `ENABLE_BRANDED_PDF=true` in `apps/api/.env`
2. Run migrations: `make migrate` (creates `brand_profiles` table)
3. Access branding settings at `/settings/branding` in the frontend

When enabled, users can:
- Create brand profiles with custom logos, colors, and footer text
- Download branded PDF reports via the report page
- Use white-label reports for client deliverables

When disabled (default), branded PDF requests return `402 Payment Required`.

### Frontend Environment Variables (apps/web/.env.local)

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## 🧪 Testing

Backend tests are in `apps/api/tests/`. Run with:
```bash
cd apps/api
source venv/bin/activate
pytest
```

## 📝 Current Implementation Status

### ✅ Completed

- Monorepo structure with pnpm workspaces
- Docker Compose setup (Postgres + Adminer)
- FastAPI backend with SQLAlchemy 2.0 models
- Alembic migrations setup
- API routes (health, scan create/get)
- Next.js 14 frontend with App Router
- All required pages (landing, scan, report, pricing)
- CSS Modules (no Tailwind)
- Deterministic mock scanner
- LLM client interface (stub implementation)
- Stripe placeholder routes
- Basic tests (health, scan)

### 🚧 Next Steps

1. **Real Scanning Implementation:**
   - Implement actual HTTP header checks (SSL, security headers)
   - Cookie detection and GDPR compliance checks
   - SEO meta tag analysis
   - Response time and performance metrics

2. **Authentication:**
   - User registration/login
   - JWT or session-based auth
   - Protected routes

3. **Stripe Integration:**
   - Implement checkout flow
   - Webhook handling
   - Subscription management

4. **Background Jobs:**
   - Move scanning to background tasks (Celery or similar)
   - Queue system for multiple scans

5. **Email:**
   - Send scan reports via email
   - Notification system

6. **Advanced Features:**
   - ✅ Export reports (PDF) - **Implemented**
   - ✅ White-label/branded PDF reports - **Implemented** (requires `ENABLE_BRANDED_PDF=true`)
   - API access for premium users
   - Bulk scanning
   - CSV export

## 🐛 Troubleshooting

### Port already in use
- Change ports in `.env` files or docker-compose.yml

### Database connection errors
- Ensure Docker containers are running: `docker ps`
- Check DATABASE_URL in `apps/api/.env`

### Python virtual environment issues
- Recreate: `rm -rf apps/api/venv && python3 -m venv apps/api/venv && source apps/api/venv/bin/activate && pip install -r apps/api/requirements.txt`

### Migration errors
- Reset database: `docker-compose -f infra/docker-compose.yml down -v` then `make docker-up` and `make migrate`

## 📄 License

Private - All rights reserved

