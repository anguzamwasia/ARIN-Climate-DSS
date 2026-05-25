# ARIN AI-Driven Climate Data Processing Pipeline


## Overview
An extensible AI-driven end-to-end climate data processing pipeline for the **Africa Research and Impact Network (ARIN)**. The system automatically ingests, processes, and synthesizes climate policy data from multiple sources into a dialogue-driven Decision Support System (DSS).

**Consultant:** Cynthia Anguza  
**Client:** Africa Research and Impact Network (ARIN)  
**Timeline:** May 12 – August 10, 2026 (12 weeks)

---

## Project Architecture

```
Data Sources          Ingestion Layer       AI/RAG Layer         Frontend
─────────────         ───────────────       ────────────         ────────
UNFCCC Reports   ──►  Scrapy+Playwright ──► PostgreSQL+pgvector  React.js
KoboCollect API  ──►  REST API hooks    ──► LangChain RAG    ──► Chatbot UI
Audio/Video      ──►  Whisper STT       ──► GPT-4o-mini      ──► Dashboard
                                                              ──► Blog Editor
```

---

## Project Structure

```
ARIN_DSS/
├── scrapper/                  # Data ingestion layer
│   ├── unfccc_reports.py      # UNFCCC Scrapy+Playwright spider
│   ├── output/                # Scraped data (gitignored)
│   └── venv/                  # Python virtual environment
├── backend/                   # FastAPI backend (in progress)
│   ├── main.py                # API endpoints
│   └── .env                   # Environment variables (gitignored)
├── frontend/                  # React.js frontend (weeks 9-10)
├── docker/                    # Docker configuration
│   ├── docker-compose.yml     # PostgreSQL + pgvector + pgAdmin
│   └── init.sql               # Database schema
└── README.md
```

---

## Deliverables & Progress

| # | Deliverable | Due | Status |
|---|-------------|-----|--------|
| D1.1 | Inception Report | Week 2 | ✅ Complete |
| D3.1 | GitHub repo + Docker environment | Week 2 | ✅ Complete |
| D3.2 | UNFCCC scraper + KoboCollect hooks | Week 4 | ✅ Scraper done |
| D2.1 | AI Conceptual Model + Architecture | Week 6 | 🔄 In progress |
| D3.3 | RAG pipeline + FastAPI endpoints | Week 6 | 🔄 In progress |
| D3.4 | React chatbot UI + blog module | Week 10 | ⏳ Pending |
| D4.2 | DSS deployed on ARIN server | Week 12 | ⏳ Pending |
| D5.1 | Technical System Manual | Week 12 | ⏳ Pending |
| D6.3 | 1-day training workshop | Week 12 | ⏳ Pending |

---

## Data Sources

### 1. UNFCCC Reports (Complete ✅)
- **Source:** https://unfccc.int/reports
- **Spider:** Scrapy + Playwright (bypasses Incapsula WAF)
- **Filter:** Africa-only (54 African countries)
- **Results:** 78 African climate reports scraped
- **File types:** PDF, XLSX, ZIP
- **Countries covered:** Zimbabwe, Mali, Kenya, Nigeria, Rwanda, Malawi, Madagascar, Burkina Faso, and 25+ more

### 2. KoboCollect Field Data (In Progress 🔄)
- Real-time field data synchronization via KoboCollect API
- 50+ submissions target for RAG pipeline testing

### 3. Audio/Video Interviews (Pending ⏳)
- Automated transcription via OpenAI Whisper
- English-language audio/video only (2-4 hours total)

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Scraping | Python, Scrapy 2.16, Playwright, Chromium |
| Database | PostgreSQL 16 + pgvector extension |
| AI/RAG | LangChain, GPT-4o-mini, OpenAI embeddings |
| Backend | Python, FastAPI, psycopg2 |
| Frontend | React.js, Leaflet, Plotly, D3.js |
| Deployment | Docker, Docker Compose |
| Version Control | GitHub |

---

## Quick Start

### Prerequisites
- Docker Desktop installed and running
- Python 3.11+
- WSL2 (if on Windows)

### 1. Clone the repository
```bash
git clone https://github.com/anguzamwasia/ARIN-Climate-DSS.git
cd ARIN-Climate-DSS
```

### 2. Start the database
```bash
cd docker
docker compose up -d
```

### 3. Set up the scraper
```bash
cd scrapper
python -m venv venv
source venv/bin/activate
pip install scrapy scrapy-playwright psycopg2-binary
playwright install chromium
```

### 4. Run the UNFCCC spider
```bash
scrapy runspider unfccc_reports.py --loglevel=INFO
```

### 5. Start the API (coming soon)
```bash
cd backend
pip install fastapi uvicorn
uvicorn main:app --reload --port 8000
```

---

## Database Schema

```sql
CREATE TABLE documents (
    id            SERIAL PRIMARY KEY,
    title         TEXT NOT NULL,
    url           TEXT UNIQUE NOT NULL,
    date          TEXT,
    type          TEXT,
    country       TEXT,
    file_url      TEXT,
    source        TEXT,
    scraped_at    TIMESTAMP,
    content_text  TEXT,           -- extracted PDF text
    embedding     vector(1536),   -- OpenAI embeddings for RAG
    chunk_index   INT,
    metadata      JSONB
);
```

---

## Data Quality Notes
- 78 African reports stored (43 with direct file URLs)
- 35 NDC submissions lack direct file URLs (use external government links) — fix planned in next iteration
- All AI-generated content requires human approval before publication (per ARIN policy)
- Source citations included in all RAG outputs

---

## Environment Variables
Create a `.env` file in the `backend/` directory:
```
DATABASE_URL=postgresql://arin:arin_secure_2026@localhost:5432/arin_dss
OPENAI_API_KEY=your_key_here
ENVIRONMENT=development
```

---

## Contact
- **Consultant:** Cynthia Anguza
- **Client:** Africa Research and Impact Network (ARIN)
- **Repository:** https://github.com/anguzamwasia/ARIN-Climate-DSS
