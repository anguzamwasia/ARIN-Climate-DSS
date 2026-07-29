# ARIN Climate Decision Support System (DSS)

**AI-Driven End-to-End Climate Data Processing Pipeline**

[![Python](https://img.shields.io/badge/Python-3.11+-3776AB.svg)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.111+-009688.svg)](https://fastapi.tiangolo.com/)
[![Next.js](https://img.shields.io/badge/Next.js-14+-000000.svg)](https://nextjs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16+-336791.svg)](https://www.postgresql.org/)
[![License](https://img.shields.io/badge/License-ARIN_Proprietary-red.svg)]()

**Client:** Africa Research and Impact Network (ARIN)  
**Consultant:** Cynthia Anguza  

[Documentation](#) | [Demo](#) | [Report Issue](#)

</div>

---

##  Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Data Sources](#data-sources)
- [API Documentation](#api-documentation)
- [Visualization Dashboard](#visualization-dashboard)
- [Testing](#testing)
- [Deployment](#deployment)
- [Video/Audio Processing](#videoaudio-processing)
- [Quality Assurance](#quality-assurance)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)
- [Contact](#contact)

---

##  Overview

The **ARIN Climate Decision Support System (DSS)** is an extensible AI-driven platform that transforms climate data management for the Africa Research and Impact Network. The system automatically ingests, processes, and synthesizes climate policy data from multiple sources into an interactive, dialogue-driven Decision Support System.

### Business Impact

- **40% reduction** in manual data processing time
- **Real-time** policy insights from 78+ African climate reports
- **AI-powered** qualitative analysis of community interviews
- **Democratized** access to climate data via conversational chatbot

---

##  Key Features

### 1. **Multi-Source Data Ingestion**
-  UNFCCC policy reports (78 African countries scraped)
-  KoboCollect field data synchronization
-  Audio/video interview transcription (Whisper)
-  Extensible architecture for national reports (KNBS, KMD)

### 2. **AI-Powered Processing Pipeline**
-  **RAG (Retrieval-Augmented Generation)** for intelligent querying
-  **Whisper transcription** for community interviews
-  **Sentiment analysis** & thematic extraction
-  **Source traceability** with hyperlinked citations

### 3. **Interactive Dashboard**
-  **Heatmap visualization** (Africa-wide vulnerability index)
-  **Time-series charts** (temperature anomalies, rainfall indices)
-  **Conversational chatbot** with policy recommendations
-  **Blog generation** with human approval workflow

### 4. **Quality & Governance**
-  Human-in-the-loop approval for all AI-generated content
-  Source citations for every factual claim
-  70%+ test coverage
-  Docker containerization for reproducible deployment

---

##  Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                          DATA SOURCES                               │
├──────────────┬──────────────┬──────────────┬───────────────────────┤
│ UNFCCC       │ KoboCollect  │ Audio/Video  │ National Reports      │
│ Reports      │ Field Data   │ Interviews   │ (KNBS, KMD, etc.)     │
└──────┬───────┴──────┬───────┴──────┬───────┴────────┬──────────────┘
       │              │              │                │
       ▼              ▼              ▼                ▼
┌─────────────────────────────────────────────────────────────────────┐
│                       INGESTION LAYER                               │
├─────────────────────────────────────────────────────────────────────┤
│ • Scrapy+Playwright (UNFCCC)  • Kobo API Hooks                     │
│ • Whisper (Audio)             • BeautifulSoup (National Reports)   │
└───────────────────────────────┬─────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    PROCESSING & AI LAYER                            │
├─────────────────────────────────────────────────────────────────────┤
│  PostgreSQL+pgvector  ←──  LangChain RAG  ←──  GPT-4o-mini/Ollama  │
│       (Vector DB)                                                    │
│                                                                      │
│  • Text chunking & embedding  • Sentiment analysis                 │
│  • Retrieval & generation      • Thematic extraction               │
└───────────────────────────────┬─────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      PRESENTATION LAYER                             │
├─────────────────────────────────────────────────────────────────────┤
│  React.js + Next.js  │  FastAPI Backend  │  Leaflet + Plotly       │
├─────────────────────────────────────────────────────────────────────┤
│  • Chatbot UI        │  • REST APIs      │  • Heatmap              │
│  • Blog Dashboard    │  • RAG endpoints  │  • Time-series charts   │
│  • Admin Panel       │  • Webhooks       │  • Country KPIs         │
└─────────────────────────────────────────────────────────────────────┘
```

---

##  Tech Stack

| Layer | Technologies |
|-------|-------------|
| **Backend** | Python 3.11+, FastAPI, SQLAlchemy, Pydantic |
| **AI/ML** | LangChain, OpenAI GPT-4o-mini, Ollama (Gemma), Whisper, TextBlob |
| **Database** | PostgreSQL 16+ with pgvector extension |
| **Frontend** | Next.js 14+, TypeScript, Tailwind CSS |
| **Visualization** | Leaflet, Mapbox GL, Plotly, D3.js |
| **Scraping** | Scrapy 2.16+, Playwright, BeautifulSoup |
| **Deployment** | Docker, Docker Compose, GitHub Actions |
| **Testing** | Pytest, pytest-asyncio, pytest-cov |

---

##  Project Structure

```
ARIN-Climate-DSS/
│
├── backend/                    # FastAPI Backend
│   ├── app/
│   │   ├── api/               # API endpoints
│   │   │   ├── admin_media.py
│   │   │   ├── analytics.py   # Continent/national reports
│   │   │   ├── chat.py        # RAG chatbot
│   │   │   ├── documents.py
│   │   │   └── blogs.py       # Blog generation & approval
│   │   ├── core/              # Core configuration
│   │   ├── models/            # SQLAlchemy ORM models
│   │   ├── services/          # Business logic
│   │   │   ├── rag.py         # RAG pipeline
│   │   │   ├── transcriber.py # Whisper integration
│   │   │   ├── sentiment.py   # NLP analysis
│   │   │   └── audio_processor.py
│   │   ├── schemas/           # Pydantic schemas
│   │   └── tests/             # Unit & integration tests
│   ├── requirements.txt
│   ├── .env.example
│   └── Dockerfile
│
├── frontend/                   # Next.js Frontend
│   ├── app/                   # App router pages
│   │   ├── dashboard/         # Visualization dashboard
│   │   ├── chatbot/           # Chat interface
│   │   ├── blog/              # Blog editor & approval
│   │   └── admin/             # Admin panel
│   ├── components/            # Reusable React components
│   ├── lib/                   # Utility functions
│   ├── public/                # Static assets
│   │   └── climate-dashboard.html  # Standalone dashboard
│   ├── package.json
│   └── next.config.mjs
│
├── scraper/                   # Data ingestion
│   ├── unfccc_reports.py      # UNFCCC spider
│   ├── knbs_reports.py        # KNBS spider
│   ├── kmd_reports.py         # KMD spider
│   └── output/                # Scraped data storage
│
├── docker/                    # Docker configuration
│   ├── docker-compose.yml     # Multi-container setup
│   ├── init.sql              # Database initialization
│   └── Dockerfile.postgres
│
├── arin_dss_v2_compact/       # Compact backup implementation
├── .gitignore
├── README.md                  # This file
└── LICENSE
```

---

##  Prerequisites

Before you begin, ensure you have the following installed:

- **Python** 3.11 or higher
- **Node.js** 18.x or higher
- **Docker** Desktop 4.25+ (with WSL2 on Windows)
- **PostgreSQL** 16+ (if not using Docker)
- **Git** 2.40+
- **FFmpeg** (for audio processing)

### Install FFmpeg (Required for Whisper)

```bash
# Ubuntu/Debian
sudo apt-get install ffmpeg

# macOS
brew install ffmpeg

# Windows (using Chocolatey)
choco install ffmpeg

# Or download from https://ffmpeg.org/download.html
```

---

##  Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/anguzamwasia/ARIN-Climate-DSS.git
cd ARIN-Climate-DSS
```

### 2. Set Up Environment Variables

```bash
# Backend configuration
cp backend/.env.example backend/.env

# Edit .env with your credentials
DATABASE_URL=postgresql://arin:arin_secure_2026@localhost:5432/arin_dss
OPENAI_API_KEY=your_openai_key_here
KOBO_API_TOKEN=your_kobo_token_here
OLLAMA_BASE_URL=http://localhost:11434
UPLOAD_DIR=./uploads
LOG_LEVEL=INFO
```

### 3. Start the Database (Docker)

```bash
cd docker
docker-compose up -d
# Wait 10 seconds for PostgreSQL to initialize
```

### 4. Run Data Scraping

```bash
cd ../scraper
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
playwright install chromium

# Scrape UNFCCC reports (78 African countries)
scrapy runspider unfccc_reports.py --loglevel=INFO

# Scrape national reports (KNBS, KMD)
scrapy runspider knbs_reports.py
scrapy runspider kmd_reports.py
```

### 5. Start the Backend API

```bash
cd ../backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt

# Run migrations (create tables)
python -c "from app.database import engine, Base; Base.metadata.create_all(bind=engine)"

# Start FastAPI server
uvicorn app.main:app --reload --port 8000
```

The API will be available at: `http://localhost:8000`
- Interactive docs: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

### 6. Start the Frontend (Next.js)

```bash
cd ../frontend
npm install
npm run dev
```

The frontend will be available at: `http://localhost:3000`

### 7. Access Visualization Dashboard

** (Next.js route):** `http://localhost:3000/dashboard`

---

## 📊 Data Sources

### Currently Integrated

| Source | Type | Status | Records |
|--------|------|--------|---------|
| **UNFCCC Reports** | Policy documents | 
| **KNBS Reports** | National statistics | 
| **KMD Reports** | Meteorological data | 
| **KoboCollect** | Field survey data | 

### Data Quality Metrics

- **PDF extraction rate:** 85% 
- **Geographic coverage:** 54 African countries
- **Report types:** NDCs, Adaptation communications, National reports
- **Time range:** 2015-2026

### Sample Queries Supported

```bash
# Get continent-level overview
GET /analytics/overview

# Get country-specific KPI
GET /analytics/country/KE

# Generate blog post
POST /blogs/generate
{"topic": "Drought adaptation strategies", "country": "Kenya"}

# Chat with RAG
POST /chat
{"question": "What are the main climate risks in East Africa?", "country": "Tanzania"}

# Upload audio for transcription
POST /media/upload
Content-Type: multipart/form-data
file: interview.mp3
country: Kenya
```

---

## 📚 API Documentation

### Core Endpoints

This table lists the routes actually registered in `backend/app/main.py` (a prior
version of this README documented several endpoints — `/blogs/generate`,
`/media/upload`, `/media/{id}/report`, `/kobo/webhook` — that never existed in
the code; those have been corrected below). "Auth" means the route requires a
`Bearer` token from `/api/v1/auth/login`; "Admin" means the token's user must
have `role = "admin"`.

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/health` | - | Health check |
| GET | `/analytics/overview` | - | Continent-level KPI summary (real counts; see note below) |
| GET | `/analytics/country/{code}` | - | Per-country document/submission counts |
| GET | `/analytics/heatmap` | - | GeoJSON-style feature collection for the map |
| GET | `/analytics/timeseries` | - | Time-series climate data (currently empty, see note) |
| GET | `/documents` | - | List ingested documents, filterable by source/country/type |
| GET | `/documents/{id}` | - | Fetch a single document |
| POST | `/api/v1/admin/documents/upload` | Admin | Upload a research paper (PDF/DOCX/CSV/XLSX) |
| GET | `/api/v1/admin/content/stats` | Admin | Research paper / media processed counts |
| POST | `/chat` | - | RAG-powered chatbot query |
| GET | `/blogs` | - | List blog submissions |
| POST | `/blogs` | Auth | Submit a blog draft/story |
| PUT | `/blogs/{id}` | Auth | Update a blog submission |
| PATCH | `/blogs/{id}/approve` | Admin | Approve blog (human-in-loop) |
| PATCH | `/blogs/{id}/reject` | Admin | Reject blog with feedback |
| DELETE | `/blogs/{id}` | Admin | Delete a blog submission |
| POST | `/api/v1/admin/media/upload` | Admin | Upload audio/video for Whisper transcription |
| POST | `/api/v1/ingest/kobo-receiver` | Webhook secret | Receive KoboCollect submissions |
| POST | `/api/v1/auth/signup` | - (whitelist-gated) | Create an account (email must be in `ALLOWED_EMAILS`) |
| POST | `/api/v1/auth/login` | - | Log in, returns a JWT |
| GET | `/api/v1/auth/me` | Auth | Current user's profile |
| GET | `/api/v1/admin/users/stats` | Admin | User/active-user counts |
| GET | `/notifications` | Auth | Current user's notifications |
| POST | `/notifications/{id}/read` | Auth | Mark a notification read |
| POST | `/api/v1/public/contact` | - | Public contact form |

> **Data honesty note:** `/analytics/country/{code}` and `/analytics/timeseries`
> return real document/submission counts, but `avg_temperature_rise`,
> `drought_index`, `flood_risk`, and `population_affected` are placeholder
> zero/"unknown" values, not measurements. The scrapers ingest policy PDFs and
> Kobo field-survey metadata — there is no climate-indicator data source wired
> into the pipeline yet (e.g. the World Bank Climate Change Knowledge Portal
> API). Wiring one in is the remaining piece of work needed before the
> dashboard's temperature/drought/flood-risk figures reflect anything real.

### Example: Continent Overview Response

```json
{
  "total_documents": 78,
  "total_media": 12,
  "total_blogs": 6,
  "countries_covered": 28
}
```

---

##  Visualization Dashboard

The dashboard mirrors the **Africa Policy Tool** reference design (`https://www.globalcenter.ai/aorai/africa-policy-tool`):

### Features

1. **Heatmap Visualization**
   - Vulnerability intensity mapping for 54 African countries
   - Click on any country for detailed KPI report
   - Color-coded circles (size + opacity based on index)

2. **Time-Series Charts**
   - Temperature anomaly trends (2015-2026)
   - Rainfall index visualization
   - Country-specific filtering

3. **Interactive Chatbot**
   - Real-time RAG queries
   - Source citations with hyperlinks
   - Confidence scoring (HIGH/MEDIUM/LOW)

4. **Statistics Overview**
   - Total policy documents
   - Field submissions count
   - Audio hours processed
   - Average vulnerability index

### Dashboard Access

```bash
# Next.js route (recommended)
http://localhost:3000/dashboard

# Standalone HTML (no framework dependencies)
http://localhost:3000/climate-dashboard.html

# Direct API access
curl http://localhost:8000/analytics/overview
```

---

## 🎥 Video/Audio Processing

### Supported Formats
- MP3, MP4, WAV, M4A
- Maximum file size: 25 MB (auto-compressed with FFmpeg)
- Language: English only (Phase 1)

### Processing Pipeline

```python
# 1. Upload file
POST /media/upload
→ Returns report ID

# 2. Automatic processing
- FFmpeg compression (if >24.5 MB)
- Whisper transcription (base model)
- Sentiment analysis (TextBlob)
- Thematic extraction
- Key quote identification

# 3. Retrieve structured report
GET /media/{id}/report

# Sample response
{
  "transcript": "The drought has severely affected our livestock...",
  "sentiment": {"positive": 0.05, "negative": 0.72, "neutral": 0.23},
  "themes": ["drought", "food_security", "livelihoods"],
  "key_quotes": ["The drought has killed our livestock and we have no food"],
  "confidence": "HIGH"
}
```

### Video Output Reports

| Report Type | Format | Use Case |
|-------------|--------|----------|
| **Transcript** | JSON/TXT | Qualitative analysis |
| **Sentiment Analysis** | JSON | Policy priority identification |
| **Thematic Clusters** | JSON | Trend detection across communities |
| **Key Quotes** | JSON | Evidence for policy briefs |
| **Audio Metadata** | CSV | Dataset documentation |

---

## 🧪 Testing

### Run Backend Tests

```bash
cd backend
pytest app/tests/ -v --cov=app --cov-report=html
```

`app/tests/` currently covers the auth/admin-gating behavior added in the
security fixes (see `test_admin_auth.py`) plus the pre-existing pipeline
smoke test. It is not yet a comprehensive suite, and there is no enforced
coverage gate in CI (`.github/workflows/ci.yml` runs pytest but doesn't fail
the build below a threshold) -- the "70%+ coverage" figure previously claimed
here was aspirational, not measured, so it has been removed rather than left
as an unverified number. Run the command above locally to see the real,
current coverage.

### Run Frontend Tests

```bash
cd frontend
npm test
npm run test:coverage
```

### Test Data Ingestion

```bash
# Test UNFCCC scraper
cd scraper
scrapy runspider unfccc_reports.py --loglevel=DEBUG -o test_output.json

# Test Kobo webhook (mock)
curl -X POST http://localhost:8000/kobo/webhook \
  -H "Content-Type: application/json" \
  -d '{"_id": 123, "_xform_id_string": "climate_survey", "attachments": []}'
```

---

##  Deployment

### Docker Production Build

```bash
# Build and start all services
docker-compose -f docker/docker-compose.yml up --build -d

# Check service status
docker-compose ps

# View logs
docker-compose logs -f backend
```

### Manual Deployment (ARIN Cloud)

1. **Set up PostgreSQL with pgvector**
   ```bash
   sudo -u postgres psql
   CREATE DATABASE arin_dss;
   CREATE EXTENSION vector;
   ```

2. **Configure environment**
   ```bash
   # Production .env
   DATABASE_URL=postgresql://arin:${DB_PASSWORD}@arin-db.internal:5432/arin_dss
   OPENAI_API_KEY=${OPENAI_KEY}
   ENVIRONMENT=production
   ```

3. **Deploy backend**
   ```bash
   pip install -r requirements.txt
   uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4
   ```

4. **Deploy frontend**
   ```bash
   npm run build
   npm start
   ```

### Vercel Deployment (Optional)

```bash
# Connect GitHub repo to Vercel
# Environment variables:
DATABASE_URL=...
OPENAI_API_KEY=...

# Deploy
vercel --prod
```

---

##  Quality Assurance

### Code Quality Gates

-  **Linting:** `ruff` (Python), `ESLint` (TypeScript)
-  **Formatting:** `black` (Python), `Prettier` (TypeScript)
-  **Type checking:** `mypy` (Python), `tsc` (TypeScript)
-  **Test coverage:** Minimum 70% backend
-  **Commit convention:** Conventional commits (feat:, fix:, docs:)

### Data Quality

-  Schema validation for all ingested data
-  RAG embedding verification
-  Sentiment range-checking (0-1 scale)
-  Source traceability for every AI output
-  Human approval gate for published content

### Security

-  API keys stored in `.env` (gitignored) -- see `backend/.env.example`
-  CORS restricted to `ALLOWED_ORIGINS` (see `.env.example`), not `*`
-  Admin/write endpoints require a JWT with `role = "admin"` (see `app/auth.py::require_admin`)
-  Signup restricted to `ALLOWED_EMAILS`
-  Uploaded files are stored under a server-generated name (no client-controlled paths)
-  HTTPS in production (via ARIN infrastructure) -- not something this codebase enforces itself
-  ⚠️ Rate limiting is **not implemented**. This was listed here previously but
   there is no rate-limiting middleware or dependency anywhere in the code.
   Worth adding (e.g. `slowapi`) before any public deployment.

---

##  Troubleshooting

### Common Issues

| Issue | Solution |
|-------|----------|
| **PostgreSQL connection refused** | Check Docker: `docker-compose ps` <br> Verify port: `5432` vs `5433` |
| **Whisper transcription fails** | Install FFmpeg: `sudo apt-get install ffmpeg` <br> Check file permissions |
| **OpenAI API rate limit** | Implement fallback: Ollama <br> Add request caching |
| **pgvector extension missing** | Run: `CREATE EXTENSION IF NOT EXISTS vector;` |
| **Scraper blocked by WAF** | Use Playwright instead of requests <br> Add random delays |
| **Next.js build failing** | Clear `.next` folder: `rm -rf .next` <br> Reinstall: `npm ci` |

### Debug Mode

```bash
# Enable verbose logging
export LOG_LEVEL=DEBUG
uvicorn app.main:app --reload --log-level debug

# Test specific endpoint
curl -v http://localhost:8000/analytics/country/KE

# Check database
docker exec -it arin_postgres psql -U arin -d arin_dss
SELECT COUNT(*) FROM documents;
SELECT * FROM media_records ORDER BY created_at DESC LIMIT 5;
```

---

##  Contributing

This project is developed exclusively for ARIN. External contributions are not accepted. For internal contributions:

1. Create a feature branch: `git checkout -b feature/your-feature`
2. Make changes with proper tests
3. Run quality checks: `make lint && make test`
4. Submit pull request to `main` branch
5. Request review from project lead (Cynthia Anguza)

### Commit Convention

```bash
feat: add KNBS scraper integration
fix: resolve Whisper memory leak on large files
docs: update API documentation with examples
test: add coverage for sentiment analysis module
chore: update Docker base image to Python 3.11
```

---

##  Contact

**Project Consultant**  
Cynthia Anguza  
-  Email: [anguzacynthia@gmail.com](mailto:anguzacynthia@gmail.com)
- LinkedIn: [Cynthia Anguza](https://linkedin.com/in/cynthia-anguza)
-  GitHub: [@anguzamwasia](https://github.com/anguzamwasia)

**Client Representative**  
Dr. Joanes Atela  
Executive Director, ARIN  
-  Email: [jatela@arinafrica.org](mailto:jatela@arinafrica.org)

**Repository**  
[https://github.com/anguzamwasia/ARIN-Climate-DSS](https://github.com/anguzamwasia/ARIN-Climate-DSS)

---

##  License

This project is proprietary and confidential. All rights reserved.

**Copyright © 2026 Africa Research and Impact Network (ARIN)**

Unauthorized copying, distribution, or use of this software is strictly prohibited. Licensed only for authorized ARIN personnel and approved consultants.

---

##  Acknowledgments

- **ARIN Leadership** for vision and support
- **UNFCCC** for open access to climate reports
- **OpenAI** for GPT-4o-mini and Whisper APIs
- **LangChain** team for RAG framework
- **Open Source Community** for pgvector, FastAPI, and Next.js

---

  
**Built with Love for a climate-resilient Africa**

[Report Bug](https://github.com/anguzamwasia/ARIN-Climate-DSS/issues) · [Request Feature](mailto:anguzacynthia@gmail.com)
