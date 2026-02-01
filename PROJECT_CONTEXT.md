# SiteCheck - Project Context & Development Log

> **Elephantfly Scan** - A SaaS platform for website security and GDPR compliance scanning

## 🎯 Where We Are (Quick Status)

**Last Updated:** 2024-12-19

**Current State:**
- ✅ **Core features working**: Scanning, reports, PDFs (neutral + branded), brand profiles, shared report viewing
- ❌ **One missing endpoint**: `POST /scan/{scan_id}/share` - Frontend calls it but backend doesn't implement it (returns 404)
- ⚠️ **Placeholders**: Stripe, Auth, Real LLM (all have stub implementations)

**To Run:**
1. `docker-compose -f infra/docker-compose.yml up -d` (start Postgres)
2. `cd apps/api && source venv/bin/activate && alembic upgrade head` (migrate DB)
3. `make dev` (start both servers)

**Next Priority:** Implement `POST /scan/{scan_id}/share` endpoint in `apps/api/app/api/routes/scan.py`

---

## 📋 Project Overview

SiteCheck is a production-ready monorepo for a SaaS application that scans website URLs and generates security and GDPR/compliance reports. The platform provides instant, non-invasive scanning with clear, actionable insights.

### Core Value Proposition
- **No login required** - Instant scanning
- **60 seconds** - Fast results
- **Non-invasive** - HTTP-only scanning (no headless browsers)
- **Clear action plans** - Prioritized fixes and recommendations

---

## 🏗️ Architecture

### Monorepo Structure
```
sitecheck/
├── apps/
│   ├── web/          # Next.js 14+ frontend (App Router)
│   └── api/          # FastAPI backend (Python 3.11+)
├── packages/
│   └── shared/       # Shared types, schemas, utilities
└── infra/            # Docker Compose, env examples
```

### Tech Stack

#### Frontend (`apps/web`)
- **Framework**: Next.js 14.0.4 (App Router)
- **Language**: TypeScript
- **Styling**: CSS Modules (no Tailwind)
- **Animations**: Framer Motion 10.18.0
- **Icons**: Lucide React 0.294.0
- **Charts**: Recharts 2.15.4
- **Toasts**: Sonner 1.7.4
- **Utilities**: clsx 2.1.1
- **Package Manager**: pnpm workspaces

#### Backend (`apps/api`)
- **Framework**: FastAPI
- **Language**: Python 3.11+
- **ORM**: SQLAlchemy 2.0
- **Migrations**: Alembic
- **Validation**: Pydantic
- **HTTP Client**: httpx (async)
- **PDF Generation**: WeasyPrint
- **Testing**: pytest with respx (HTTP mocking)

#### Database
- **Primary**: PostgreSQL 15+ (via Docker Compose)
- **Admin Tools**: Adminer (via Docker Compose)
- **Note**: Code also supports SQLite for development (redirect_chain stored as JSON string)

#### Infrastructure
- **Containerization**: Docker Compose
- **Environment**: `.env.example` files for both apps

---

## 🚀 Setup & Development

### Prerequisites
- Node.js 18+ (for pnpm)
- Python 3.11+
- Docker Desktop (for Postgres)
- pnpm (install via `npm install -g pnpm` or use `npx pnpm`)

### Quick Start

1. **Install dependencies**
   ```bash
   pnpm install
   ```

2. **Setup backend**
   ```bash
   cd apps/api
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   ```

3. **Start Docker services**
   ```bash
   docker-compose -f infra/docker-compose.yml up -d
   ```
   This starts:
   - Postgres on `localhost:5432`
   - Adminer (DB admin) on `http://localhost:8080`
     - Server: `postgres`
     - Username: `elephantfly`
     - Password: `elephantfly_dev`
     - Database: `elephantfly_scan`

4. **Run database migrations**
   ```bash
   cd apps/api
   source venv/bin/activate
   alembic upgrade head
   ```

5. **Configure environment variables**
   ```bash
   # Backend
   cd apps/api
   cp env.example .env
   # Edit .env if needed (defaults should work for local dev)
   
   # Frontend
   cd ../web
   cp env.example .env.local
   # Edit .env.local if needed
   ```

6. **Run development servers**
   ```bash
   # From root
   make dev
   # Or use start-dev.sh
   ./start-dev.sh
   # Or separately:
   # Terminal 1: cd apps/web && pnpm dev
   # Terminal 2: cd apps/api && source venv/bin/activate && uvicorn main:app --reload
   ```

### Environment Variables

#### Frontend (`apps/web/.env.local`)
```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
# OR
NEXT_PUBLIC_API_URL=http://localhost:8000
```

#### Backend (`apps/api/.env`)
```env
DATABASE_URL=postgresql://elephantfly:elephantfly_dev@localhost:5432/elephantfly_scan
API_HOST=0.0.0.0
API_PORT=8000
CORS_ORIGINS=http://localhost:3000
STRIPE_SECRET_KEY=sk_test_placeholder
STRIPE_PUBLISHABLE_KEY=pk_test_placeholder
LLM_PROVIDER=stub
ENABLE_BRANDED_PDF=false  # Set to "true" to enable white-label PDF reports
```

---

## 📁 Key File Structure

### Frontend
```
apps/web/
├── app/
│   ├── layout.tsx              # Root layout with Sonner Toaster
│   ├── page.tsx                # Landing page
│   ├── scan/
│   │   └── page.tsx            # Scan input page
│   ├── report/
│   │   └── [scanId]/
│   │       └── page.tsx        # Report display page
│   ├── pricing/
│   │   └── page.tsx            # Pricing page
│   ├── sample-report/
│   │   └── page.tsx            # Static sample report
│   ├── settings/
│   │   └── branding/
│   │       └── page.tsx        # Brand profile management
│   └── shared/
│       └── [token]/
│           └── page.tsx        # Shared report view (read-only)
├── components/
│   ├── Layout/
│   │   ├── Layout.tsx          # Main layout with navbar
│   │   └── Layout.module.css
│   └── ui/
│       ├── Button/             # Button component
│       ├── Card/               # Card component
│       ├── Badge/              # Badge component (with icons)
│       ├── Input/              # Input component (with icon support)
│       ├── Modal/              # Modal component
│       ├── Motion/             # Framer Motion helpers
│       ├── PageTransition/     # Desktop-only page transitions
│       ├── Chart/              # Recharts wrapper
│       └── SectionHeader/      # Section header component
└── app/globals.css             # Global styles with CSS variables
```

### Backend
```
apps/api/
├── app/
│   ├── main.py                 # FastAPI app entry
│   ├── core/
│   │   └── config.py           # Settings and configuration
│   ├── db/
│   │   └── database.py          # Database connection and Base
│   ├── models/
│   │   ├── user.py             # User model
│   │   ├── scan.py             # Scan model
│   │   ├── finding.py          # Finding model
│   │   ├── brand_profile.py    # Brand profile model
│   │   └── shared_report_link.py  # Shared report link model
│   ├── schemas/
│   │   ├── scan.py             # Pydantic schemas for scans
│   │   ├── explanation.py      # LLM explanation schemas
│   │   ├── brand_profile.py    # Brand profile schemas
│   │   └── shared_report_link.py  # Shared link schemas
│   ├── api/
│   │   └── routes/
│   │       ├── health.py       # Health check
│   │       ├── scan.py          # Scan endpoints
│   │       ├── stripe.py        # Stripe placeholder routes
│   │       ├── brands.py        # Brand profile CRUD
│   │       └── shared.py        # Shared report link retrieval
│   └── services/
│       ├── scanner.py          # Light Scan v1 implementation
│       ├── llm_client.py       # LLM client interface (stub)
│       └── pdf_generator.py    # PDF report generation (v2)
├── alembic/                    # Database migrations
│   ├── versions/
│   │   ├── 001_initial_migration.py
│   │   ├── 002_add_scan_metadata.py
│   │   ├── 003_add_brand_profiles.py
│   │   └── 004_add_shared_report_links.py
└── tests/                      # pytest tests
```

---

## ✨ Features Implemented

### Core Scanning (Light Scan v1)
- ✅ URL normalization and validation
- ✅ HTTP GET with redirects (max 10, timeout 10s)
- ✅ HTTPS/TLS presence check
- ✅ Security headers check (HSTS, CSP, X-Frame-Options, etc.)
- ✅ Cookie presence heuristic
- ✅ robots.txt check
- ✅ Server header version detection
- ✅ Scoring algorithm (0-100) with risk levels
- ✅ Findings persistence with categories and severities

### PDF Report Generation (v2 - Consultant-Grade)
- ✅ Professional cover page with brand logo/name, score hero panel
- ✅ Table of contents with section navigation
- ✅ Page numbers and footer on all pages (except cover)
- ✅ Executive summary section
- ✅ Score & severity breakdown with visual stats
- ✅ Findings grouped by category (Security, GDPR, SEO, Other)
- ✅ Findings sorted by severity within each category
- ✅ Each finding includes: severity badge, impact, recommendation, estimated effort
- ✅ Quick Wins section (top 3 improvements under 60 minutes)
- ✅ Appendix with technical details (URLs, redirect chain, headers checked)
- ✅ Branded PDF support with custom colors, logo, and footer text
- ✅ Professional typography and spacing
- ✅ Page break controls to prevent awkward splits
- ✅ Deterministic output (same scan data = same PDF)
- ✅ Neutral (default) and branded PDF modes

### Brand Profiles (White-Label PDFs)
- ✅ Brand profile CRUD API (`/brands`)
- ✅ Brand profile model with: name, logo_base64, primary_color, accent_color, footer_text, is_default
- ✅ Frontend branding settings page (`/settings/branding`)
- ✅ Branded PDF generation (requires `ENABLE_BRANDED_PDF=true`)
- ✅ Premium feature gate (returns 402 when disabled)
- ✅ Default brand profile support

### Shared Report Links
- ✅ Shared report link model with token-based access (`SharedReportLink`)
- ✅ Optional expiration dates
- ✅ Frontend shared report page (`/shared/[token]`)
- ✅ Read-only access to reports via token (`GET /shared/{token}`)
- ✅ Expiration checking (returns 410 if expired)
- ✅ Frontend share modal with expiry options
- ✅ Copy-to-clipboard functionality
- ⚠️ **MISSING**: Create share link endpoint (`POST /scan/{scan_id}/share`)
  - Schema exists (`ShareReportRequest`, `ShareReportResponse`)
  - Tests exist and expect the endpoint
  - Frontend calls this endpoint
  - **BUT**: Endpoint not implemented in `apps/api/app/api/routes/scan.py`
  - **Action Needed**: Implement the endpoint to create `SharedReportLink` records

### Frontend Features
- ✅ Landing page with hero, features, pricing preview
- ✅ Scan page with animated progress steps
- ✅ Report page with:
  - Score visualization (animated count-up)
  - Severity breakdown (tiles + Recharts pie chart)
  - Grouped findings by category
  - Filterable findings (severity, category, search)
  - Collapsible recommendations
  - Premium insights stub (locked cards)
  - AI summary generation
  - Back-to-top button (mobile)
  - PDF download (neutral and branded)
- ✅ Sample report page
- ✅ Pricing page with scan_id query param support
- ✅ Branding settings page (`/settings/branding`)
- ✅ Shared report page (`/shared/[token]`) - read-only view

### UI/UX Enhancements
- ✅ Mobile-first responsive design
- ✅ Hamburger menu for mobile navigation
- ✅ Desktop-only page transitions (Framer Motion)
- ✅ Sonner toast notifications
- ✅ Reduced motion support
- ✅ Sticky CTA on scan page (mobile)
- ✅ Collapsible filters drawer (mobile)
- ✅ Premium design system with CSS Modules

### Design System
- ✅ CSS variables for colors, spacing, shadows
- ✅ Reusable UI components (Button, Card, Badge, Input, Modal)
- ✅ Consistent typography hierarchy
- ✅ Subtle animations and hover effects
- ✅ Accessible focus states
- ✅ Mobile tap targets (44px minimum)

---

## 🎨 Design Decisions

### Why CSS Modules (not Tailwind)?
- More control over styling
- Better for component-scoped styles
- Easier to maintain design system consistency
- No build-time class generation overhead

### Why Framer Motion?
- Smooth, performant animations
- Built-in reduced motion support
- Easy to conditionally disable on mobile
- Great for page transitions

### Why Sonner (not react-hot-toast)?
- More modern API
- Better TypeScript support
- Richer customization options
- Better mobile experience

### Why Desktop-Only Transitions?
- Mobile performance optimization
- Better battery life
- Reduced jank on slower devices
- Still provides premium feel on desktop

---

## 🔄 API Endpoints

### Health
- `GET /health` - Health check endpoint

### Scans
- `POST /scan` - Create a new scan
  - Body: `{ "url": "https://example.com" }`
  - Returns: `{ "scan_id": ..., "overall_score": 85, "risk_level": "low", "findings_by_severity": {...} }`

- `GET /scan/{scan_id}` - Get scan report
  - Returns: Full scan data with findings, metadata, redirect chain

- `GET /scan/{scan_id}/explain` - Get AI explanation
  - Returns: `{ "executive_summary": "...", "top_risks": [...], "quick_wins": [...], "recommended_next_step": "..." }`
  - Currently uses stub LLM client

- `GET /scan/{scan_id}/pdf` - Download PDF report
  - Query params:
    - `mode=branded` (optional) - Enable branded PDF
    - `brand_id={id}` (required if mode=branded) - Brand profile ID
  - Returns: PDF file download
  - Premium gate: Branded PDFs require `ENABLE_BRANDED_PDF=true`

- ⚠️ `POST /scan/{scan_id}/share` - **NOT IMPLEMENTED** (but schema, tests, and frontend exist)
  - Expected body: `{ "expires_in_hours": 24 }` (optional, null for no expiry)
  - Expected response: `{ "share_url": "http://localhost:3000/shared/{token}", "token": "uuid", "expires_at": "datetime or null" }`
  - Should create `SharedReportLink` record and return share URL
  - Frontend currently calls this endpoint but it returns 404

### Brands
- `GET /brands` - List all brand profiles
- `POST /brands` - Create brand profile
  - Body: `{ "name": "...", "logo_base64": "...", "primary_color": "#...", "accent_color": "#...", "footer_text": "...", "is_default": false }`
- `GET /brands/{brand_id}` - Get brand profile by ID

### Shared Reports
- `GET /shared/{token}` - Get scan report via shared link token
  - Read-only access
  - Returns 410 if expired
  - Returns 404 if not found

### Stripe (Placeholder)
- `GET /stripe/config` - Get Stripe config (placeholder)
- `POST /stripe/create-checkout-session` - Create checkout (placeholder)

---

## 🧪 Testing

### Backend Tests
```bash
cd apps/api
source venv/bin/activate
pytest
```

**Test Coverage:**
- URL normalization
- HTTPS/TLS checks
- Security headers detection
- Cookie detection
- robots.txt parsing
- Server header detection
- Scoring algorithm
- API endpoints (health, scan creation, scan retrieval)
- PDF generation (neutral and branded)
- Shared report links (including missing create endpoint tests)

### Frontend
- Manual testing across breakpoints (375px, 768px, 1024px+)
- Reduced motion testing
- Mobile device testing

---

## 📊 Database Schema

### Users Table
- `id` (Primary Key, Integer)
- `email` (Unique, String)
- `created_at` (DateTime)

### Scans Table
- `id` (Primary Key, Integer)
- `user_id` (Foreign Key to users.id, nullable)
- `url` (String, indexed)
- `normalized_url` (String, nullable)
- `final_url` (String, nullable)
- `redirect_chain` (Text, nullable) - JSON string for SQLite compatibility
- `response_status` (Integer, nullable)
- `overall_score` (Float, nullable)
- `risk_level` (Enum: critical/high/medium/low/info, nullable)
- `created_at` (DateTime)

### Findings Table
- `id` (Primary Key, Integer)
- `scan_id` (Foreign Key to scans.id)
- `category` (Enum: security/gdpr/seo/other)
- `severity` (Enum: critical/high/medium/low/info)
- `title` (String)
- `description` (String)
- `recommendation` (String, nullable)

### Brand Profiles Table
- `id` (Primary Key, Integer)
- `name` (String, indexed)
- `logo_base64` (Text, nullable) - Base64 encoded image
- `primary_color` (String, default: "#2563eb")
- `accent_color` (String, default: "#10b981")
- `footer_text` (Text, nullable)
- `is_default` (Boolean, default: false)
- `created_at` (DateTime)

### Shared Report Links Table
- `id` (Primary Key, UUID)
- `scan_id` (Foreign Key to scans.id, indexed)
- `token` (UUID, unique, indexed)
- `expires_at` (DateTime, nullable)
- `created_at` (DateTime)

### Relationships
- User → Scans (one-to-many)
- Scan → Findings (one-to-many, cascade delete)
- Scan → SharedReportLinks (one-to-many, cascade delete)

---

## 🚧 Current Status & Known Issues

### ✅ Fully Working
- Core scanning functionality (Light Scan v1)
- PDF generation (neutral and branded, consultant-grade v2)
- Brand profile management (CRUD API + frontend)
- Shared report viewing (read-only via token)
- Frontend pages and UI (all pages functional)
- Database migrations (4 versions, all applied)
- Test suite (except shared link creation tests - endpoint missing)
- AI explanation endpoint (stub implementation)

### ⚠️ Missing/Incomplete Features

1. **Share Link Creation Endpoint** ⚠️ **HIGH PRIORITY**
   - Schema exists (`ShareReportRequest`, `ShareReportResponse` in `apps/api/app/schemas/shared_report_link.py`)
   - Model exists (`SharedReportLink` in `apps/api/app/models/shared_report_link.py`)
   - Tests exist (`test_shared_links.py`) - all tests currently fail because endpoint doesn't exist
   - Frontend expects it (`apps/web/app/report/[scanId]/page.tsx` calls `/scan/{scan_id}/share`)
   - **BUT**: `POST /scan/{scan_id}/share` endpoint is **NOT implemented** in `apps/api/app/api/routes/scan.py`
   - **Action Needed**: 
     - Add endpoint to `apps/api/app/api/routes/scan.py`
     - Create `SharedReportLink` record with `uuid4()` token
     - Set `expires_at` if `expires_in_hours` provided
     - Return `ShareReportResponse` with `share_url` pointing to frontend `/shared/{token}`
     - Use `settings.CORS_ORIGINS.split(',')[0]` for frontend base URL

2. **Stripe Integration**
   - Placeholder routes exist
   - No actual payment processing

3. **User Authentication**
   - User model exists but no auth endpoints
   - All scans currently have `user_id=None`

4. **Real LLM Integration**
   - Stub implementation exists
   - No actual API calls to OpenAI/DeepSeek/etc.

5. **Email Delivery**
   - Not implemented

### 🐛 Known Issues

- None currently documented. All implemented features are working as expected.

---

## 🚧 Future Improvements

### High Priority
- [ ] Implement `POST /scan/{scan_id}/share` endpoint
- [ ] Stripe payment integration
- [ ] User authentication (optional)
- [ ] Real LLM integration (beyond stub)
- [ ] Email report delivery
- [ ] Dashboard page implementation
- [ ] User account management

### Medium Priority
- [ ] Dark mode support
- [ ] Export reports (CSV, JSON)
- [ ] Scheduled scans
- [ ] Scan history
- [ ] Comparison reports
- [ ] API rate limiting
- [ ] Caching layer

### Low Priority
- [ ] Multi-language support
- [ ] Advanced filtering
- [ ] Custom compliance rules
- [ ] Webhook integrations

---

## 📝 Development Notes

### Mobile Optimization
- All pages tested at 375px width
- Tap targets minimum 44px
- No horizontal scrolling
- Collapsible filters on mobile
- Sticky CTAs where appropriate

### Performance
- Charts render client-side only (no SSR issues)
- Page transitions disabled on mobile
- Reduced motion fully supported
- Lazy loading for heavy components

### Accessibility
- Keyboard navigation supported
- Focus states clearly visible
- ARIA labels where needed
- Semantic HTML structure

### Database Compatibility
- Code supports both PostgreSQL and SQLite
- `redirect_chain` stored as JSON string for SQLite compatibility
- UUIDs used for shared report links (PostgreSQL native, SQLite via extension)

---

## 🔐 Security Considerations

- Input validation on all endpoints
- URL normalization prevents injection
- SQL injection protection via SQLAlchemy
- CORS configured for local development
- Environment variables for secrets
- Shared report links use UUID tokens
- Optional expiration dates for shared links

---

## 📚 Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [Framer Motion](https://www.framer.com/motion/)
- [Sonner](https://sonner.emilkowal.ski/)
- [Recharts](https://recharts.org/)
- [WeasyPrint](https://weasyprint.org/)

---

## 👥 Team

**Built by Elephantfly**

---

## 📅 Changelog

### 2024 - Development Progress

#### Recent Additions (2024-12-19)
- ✅ Brand profile system (models, API, frontend settings page)
- ✅ Branded PDF generation with custom logos, colors, and footer text
- ✅ Consultant-grade PDF v2 (cover page, TOC, page numbers, quick wins, appendix)
- ✅ Shared report links infrastructure:
  - ✅ `SharedReportLink` model and migration
  - ✅ `GET /shared/{token}` endpoint (read-only, expiry checking)
  - ✅ Frontend shared report page (`/shared/[token]`)
  - ✅ Share modal UI on report page
  - ❌ **MISSING**: `POST /scan/{scan_id}/share` endpoint (frontend calls it, but 404)
- ✅ Premium feature gating for branded PDFs (402 Payment Required)
- ✅ Mobile-first responsive design optimizations
- ✅ Desktop-only page transitions (Framer Motion)
- ✅ Sonner toast integration

#### Core Features
- ✅ Monorepo scaffold created
- ✅ FastAPI backend with Light Scan v1
- ✅ Next.js frontend with design system
- ✅ Mobile-first responsive design
- ✅ Premium UI polish with animations
- ✅ Sonner toast integration
- ✅ Desktop-only page transitions
- ✅ Reduced motion support
- ✅ PDF report generation (v2 consultant-grade)
- ✅ Database migrations (4 versions)

---

## 🎯 Next Steps for New Agent

If you're picking up this project, here's what to focus on:

1. **Immediate Priority**: Implement `POST /scan/{scan_id}/share` endpoint ⚠️ **BLOCKING**
   - Location: `apps/api/app/api/routes/scan.py` (add new route function)
   - Schema already exists: `ShareReportRequest`, `ShareReportResponse` (imported but unused)
   - Model already exists: `SharedReportLink` (imported but unused)
   - Tests already exist: `apps/api/tests/test_shared_links.py` (currently failing)
   - Frontend already calls it: `apps/web/app/report/[scanId]/page.tsx` (line 157)
   - Implementation needed:
     ```python
     @router.post("/{scan_id}/share", response_model=ShareReportResponse)
     async def create_share_link(
         scan_id: int,
         request: ShareReportRequest,
         db: Session = Depends(get_db)
     ):
         # Check scan exists
         # Create SharedReportLink with uuid4() token
         # Set expires_at if expires_in_hours provided
         # Return ShareReportResponse with share_url
     ```

2. **Check Current State**:
   - Verify Docker is running: `docker ps`
   - Check if migrations are up to date: `alembic current`
   - Test the API: `curl http://localhost:8000/health`
   - Test the frontend: `curl http://localhost:3000`

3. **Development Workflow**:
   - Use `make dev` or `./start-dev.sh` to start both servers
   - Backend runs on port 8000
   - Frontend runs on port 3000
   - Database runs on port 5432 (via Docker)

4. **Testing**:
   - Run backend tests: `cd apps/api && source venv/bin/activate && pytest`
   - Check test coverage for shared links: `pytest tests/test_shared_links.py -v`

---

---

## 📋 Quick Reference: Current State

### What Works Right Now
- ✅ Scan websites and get security/GDPR reports
- ✅ View reports with score, findings, AI summary
- ✅ Download PDF reports (neutral and branded)
- ✅ Create brand profiles for white-label PDFs
- ✅ View shared reports via token (read-only)
- ✅ Mobile-responsive UI with premium design

### What's Broken/Missing
- ❌ **Share link creation** - Frontend calls `/scan/{scan_id}/share` but endpoint doesn't exist (404)
- ⚠️ Stripe integration - placeholder only
- ⚠️ User authentication - not implemented
- ⚠️ Real LLM integration - stub only

### How to Run
```bash
# 1. Start Docker (Postgres)
docker-compose -f infra/docker-compose.yml up -d

# 2. Run migrations
cd apps/api && source venv/bin/activate && alembic upgrade head

# 3. Start dev servers
make dev
# Or: ./start-dev.sh
# Or separately:
# Terminal 1: cd apps/web && pnpm dev
# Terminal 2: cd apps/api && source venv/bin/activate && uvicorn main:app --reload
```

### Key Files
- Backend routes: `apps/api/app/api/routes/scan.py` (missing share endpoint)
- Frontend report: `apps/web/app/report/[scanId]/page.tsx` (calls share endpoint)
- Shared report page: `apps/web/app/shared/[token]/page.tsx` (works)
- Tests: `apps/api/tests/test_shared_links.py` (failing - endpoint missing)

---

*Last updated: 2024-12-19*
*Project Status: Active Development - Core features complete, share link creation endpoint missing (high priority)*
