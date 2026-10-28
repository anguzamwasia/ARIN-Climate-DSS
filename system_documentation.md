# ARIN Climate Resilience Decision Support System (ARIN Climate DSS)
## **Comprehensive System Documentation & Operational Manual**

**Commissioning Organisation:** Africa Research & Impact Network (ARIN)  
**Programme:** Leveraging Mathematical Sciences for Climate-Resilient Solutions (Math4CCR)  
**Project Title:** Developing an Extensible AI-Driven End-to-End Climate Data Processing Pipeline  
**Consultant:** Cynthia Anguza — Geoinformatics & Data Analytics Specialist  
**Report Date:** August 2026  
**Local Code Directory:** `C:\Users\PC\Documents\ARIN\ARIN-Climate-DSS`  
**Live Application URL:** [https://arin-climatedata.org](https://arin-climatedata.org)  

---

## **Table of Contents**
1. **SECTION A: NON-TECHNICAL DOCUMENTATION**
   * 1.1 Executive Summary
   * 1.2 Project Objectives & Expected Achievements
   * 1.3 The Role of an AI Data Processing Pipeline in Climate Action
   * 1.4 Core User Roles & Functional Workflows
   * 1.5 Step-by-Step User Walkthrough
   * 1.6 Project Milestones & Progress Summary
   * 1.7 Strategic Recommendations & Best Practices
   * 1.8 Constraints & Future Roadmap
2. **SECTION B: TECHNICAL DOCUMENTATION**
   * 2.1 Technical Architectural Overview (API-First Microservices)
   * 2.2 Ingestion Engineering & Source Pipelines (Scrapers, Kobo, Whisper)
   * 2.3 Retrieval-Augmented Generation (RAG) & Citation Engine
   * 2.4 Database Schema & PostgreSQL Relations
   * 2.5 Dynamic Frontend Stack & Recharts Visualization
   * 2.6 Comprehensive API Endpoints Inventory
   * 2.7 Deployment, Docker Orchestration, and Operations Guide
3. **APPENDICES**
   * Appendix A — Project Inception and MVP Deliverables
   * Appendix B — Glossary of Key Technical Terms

---

# **SECTION A: NON-TECHNICAL DOCUMENTATION**

## **1.1 Executive Summary**
The **ARIN Climate Resilience Decision Support System (ARIN Climate DSS)** is a continent-wide digital platform built to translate climate research, policy reports, and qualitative community stories into actionable decision-support insights. 

Rather than relying on static, hardcoded information, the system introduces a fully automated, AI-driven end-to-end data processing pipeline. Deployed at [arin-climatedata.org](https://arin-climatedata.org), the platform automates:
* **Multi-Source Data Ingestion:** Intelligently scraping policy documents, syncing mobile field surveys, and transcribing audio/video community interviews.
* **Semantic Policy Chatbot:** A dialogue-driven interface performing Retrieval-Augmented Generation (RAG) to synthesize policy briefs with strict source citations.
* **Expert Blogging Hub:** A collaborative workspace allowing climate researchers to submit findings and articles through a secure human-in-the-loop review workflow.

---

## **1.2 Project Objectives & Expected Achievements**
The primary objective of this consultancy was to transition ARIN's climate data handling pipelines from fragmented, offline processes into an integrated, interactive digital workspace.

### **Expected Achievements:**
1. **Consolidated Data Repository:** Create a single ingestion gateway for unstructured reports (UNFCCC, KNBS), qualitative interviews (recordings), and structured forms (KoboCollect).
2. **Automated Content Refresh:** Eliminate manual coding by building background tasks that automatically index newly uploaded or scraped documents into the AI database.
3. **Grassroots Voice Synthesis:** Develop a Natural Language Processing (NLP) pipeline that transcribes raw audio/video community interviews and converts them into structured summaries.
4. **Controlled Content Creation:** Empower climate fellows to publish insights on the platform while maintaining full editorial control via an admin approval gate.
5. **Traceable AI Assistance:** Ensure all AI Chatbot answers provide hyperlinked inline citations pointing back to source documents, minimizing hallucinations.

---

## **1.3 The Role of an AI Data Processing Pipeline in Climate Action**
In climate resilience planning, the gap is not a lack of data, but a lack of *accessible, context-specific* data. Policy briefs, stakeholder interviews, and field surveys are often archived in formats that make them hard to search.

An AI-driven data processing pipeline serves as a knowledge translation layer:
* **Converts qualitative experiences:** Whisper speech-to-text converts community audio records into readable transcripts, exposing local challenges to regional planners.
* **Saves analytical overhead:** Automatically structures scraped reports, allowing policymakers to query multiple lengthy PDFs at once.
* **Grounds policy in evidence:** RAG pipelines retrieve exact paragraphs from verified records, guaranteeing that decisions are backed by traceable sources.

---

## **1.4 Core User Roles & Functional Workflows**
The system governs user features across three permission tiers:

### **1. Public / Guest Users**
* Browse the **Climate Content Hub** to read approved research articles and local narratives.
* Inspect the **Data Sources Overview** to view report timelines and document volumes.
* Query the **AI Chatbot** using natural language to search the platform's public index documents.

### **2. Registered Researchers**
* Submit draft articles or field findings to the review queue via the blogging dashboard.
* Maintain a secure, **persistent Chatbot history** across multiple login sessions on both mobile and desktop screens.

### **3. System Administrators**
* Access the **Admin Panel Portal** to edit, approve, or reject pending blogs.
* Upload research PDFs/DOCX files directly to index them in the vector database.
* Upload raw video/audio recordings (up to 1GB) to trigger local transcription tasks.
* Track ingestion volumes and scraped vs. manually uploaded monthly trends.

---

## **1.5 Step-by-Step User Walkthrough**
1. **AI Chatbot Thread Setup:** Log in as a researcher, start a new chat thread, and query specific files (e.g., *"What does the KNBS report say about agriculture in the target counties?"*).
2. **Citation Verification:** Hover over or click the numbered inline citations (e.g., `[Source: UNFCCC 2024]`) to view and access the verified original document.
3. **Article Creation:** Navigate to the Blog Submit workspace, fill in the template (Background, Methodology, Findings, and Actionable Policy Implications), and submit it to the queue.
4. **Ingestion Inquest:** As an admin, check the Ingestion Analytics tab to inspect the monthly chart tracking how many files have been scraped vs. manually uploaded.

---

## **1.6 Project Milestones & Progress Summary**
The pipeline development was executed in structured milestones:
* **Weeks 1–2 (Inception & Audit):** Conducted audit of ARIN's environment, finalized data requirements (audio records, reports, Kobo sync forms), and set up the repository container structure.
* **Weeks 3–4 (Data Ingestion Layer):** Built UNFCCC scrapers, KoboCollect API webhooks, and the Whisper speech-to-text transcriber.
* **Weeks 5–6 (AI & RAG Logic):** Completed the pgvector database schemas, FastAPI backend core routes, and citation mapping logic.
* **Weeks 7–8 (Chatbot Interface):** Implemented the conversational chat UI with persistent cloud context, thread management, and mobile sidebar drawers.
* **Weeks 9–10 (UI, Blog & Visualization):** Built the expert blog submission editor, the admin moderation dashboard, and integrated Recharts graphs.
* **Weeks 11–12 (QA, Handover & Deployment):** Completed User Acceptance Testing (UAT), compiled Next.js build packages, and deployed the production system.

---

## **1.7 Strategic Recommendations & Best Practices**
1. **Strict Citation Policies:** Ensure the RAG prompt remains strictly gated to *only* answer using retrieved documents. If a query is outside the platform's index, the AI must output `[LOW CONFIDENCE - VERIFY SOURCE]` rather than hallucinating.
2. **Background Sync Caching:** Since local Whisper transcribing is computationally heavy, reuse loaded weights via a persistent memory cache to avoid CPU overload.
3. **Admin Verification Gates:** Maintain human-in-the-loop validation for all blog submissions and transcribed community summaries to guarantee editorial control.

---

## **1.8 Constraints & Future Roadmap**
* **Server Constraints:** The system runs on limited server resources (approx. 1GB RAM/8GB ROM on the target production VPS). Heavy database growth requires active memory monitoring and file cleanup routines.
* **Next Steps:**
  * **Short-Term:** Transition backend models to local offline instances (Ollama/Gemma) to eliminate third-party API costs.
  * **Medium-Term:** Set up automatic translation pipelines to transcribe local vernacular recordings into English.
  * **Long-Term:** Connect the backend pipeline to external early-warning early-action reporting networks.

---

# **SECTION B: TECHNICAL DOCUMENTATION**

## **2.1 Technical Architectural Overview**
The ARIN Climate DSS architecture is designed as a modular, API-first data processing and knowledge retrieval pipeline. The architecture is divided into four sequential layers:

### **2.1.1 Layer 1: Data Sources & Inputs**
This layer manages the entry points for all structured and unstructured datasets:
* **Web Scrapers (Reports & Data):** Periodically crawls international and regional climate portals (e.g., UNFCCC, national statistics) via an automated `Pull` mechanism to extract policy PDFs and HTML reports.
* **KoboCollect (Field Surveys):** Receives structured mobile field survey responses in real-time via HTTP `Webhook` triggers configured on the KoboToolbox server.
* **Admin Portal (Media & Papers):** Allows authorized administrators to manually `Upload` qualitative media files (audio/video records) and research papers directly into the system storage.
* **User Portal (Drafts & Queries):** Serves as the interface where registered researchers `Submit Drafts` of policy findings and where public/authenticated users submit natural language questions.

### **2.1.2 Layer 2: Processing Engine**
The processing engine acts as the normalization, transcription, and vectorization pipeline, managed by a FastAPI backend:
* **FastAPI Backend (Data Normalization):**
  * **Ingest Routing:** Acts as the central traffic controller, validating credentials, routing file uploads, and sanitizing incoming KoboCollect survey keys.
  * **Metadata Ingestion:** Extracts document attributes (title, date, country, source, description) and saves them as normalized `Metadata` directly to the relational database.
* **Whisper AI (Speech-to-Text):**
  * **Local Execution:** Intercepts raw video and audio uploads from the storage volumes.
  * **Weight Caching:** Employs a persistent memory cache to transcribe speech to text quickly, producing high-fidelity text transcripts.
* **Admin Review (Blog Verification):**
  * **Human-in-the-Loop Moderation:** Holds submitted researcher drafts in a gated moderation queue. Approved drafts are converted to finalized `Blog Text` for vectorization, while relational data is saved.
* **Embedding Model (Text-to-Vector):**
  * **Semantic Representation:** Converts processed texts (transcripts, normalized documents, and verified blogs) into dense mathematical vector representations (384-dimensional embeddings) using a sentence-transformer model.

### **2.1.3 Layer 3: Knowledge Hub**
The storage layer utilizes dual database instances configured to handle relational metadata and high-speed semantic searches:
* **PostgreSQL (Relational Data):**
  * **Role:** Stores structured relational tables including user profiles, blog posts, document metadata, chat histories, and thread metrics.
  * **Relational Mapping:** Maps document IDs to their original file URLs and tags, allowing the application to resolve document references instantly.
* **ChromaDB (Semantic Vectors):**
  * **Role:** Acts as the vector store for semantic embeddings.
  * **Index Lookup:** Performs high-speed cosine similarity searches to match user queries against cached document segments.

### **2.1.4 Layer 4: System Outputs**
This layer represents the user-facing presentation services fed by the Knowledge Hub:
* **Published Reports & Verified Blogs:** Fetches verified feeds from PostgreSQL to render policy documents and approved articles on the public site.
* **Interactive Maps & Analytics Dashboard:** Dynamically loads quantitative data feeds from PostgreSQL to render monthly ingestion volumes, document source distributions, and country metrics.
* **ARIN AI Chatbot (RAG Synthesis):**
  * **Contextual Querying:** When a user asks a question, the backend queries ChromaDB to retrieve relevant context.
  * **RAG Synthesis:** Injects retrieved context into the LLM prompt to generate an answer with strict inline citations.
  * **Feedback Loop:** Saves assistant answers back to the message history, enhancing the knowledge cache.

---

## **2.2 Ingestion Engineering & Source Pipelines**
The system's data ingestion capabilities are located in the local project paths:

### **2.2.1 Document Scrapers**
Scrapers are configured in [scheduler.py](file:///C:/Users/PC/Documents/ARIN/ARIN-Climate-DSS/backend/app/scheduler.py). 
* **BeautifulSoup / Scrapy:** Automatically crawl the UNFCCC portal twice a week, extracting newly published PDFs and HTML pages.
* **Extensibility:** The scheduler is modularly designed to scale, allowing the future integration of national statistics pages (e.g., KNBS) by mounting new Scrapy spiders.

### **2.2.2 KoboCollect Webhook Sync**
Ingested inside [scheduler.py](file:///C:/Users/PC/Documents/ARIN/ARIN-Climate-DSS/backend/app/scheduler.py) every **1 minute**. 
* Syncs JSON payloads from KoboCollect forms.
* Clean-up scripts sanitize raw alphanumeric alphanumeric keys (e.g. stripping `GROUP_OV9WE37/` labels) and format them into readable questions and answers before indexing.

### **2.2.3 Whisper Transcription Node**
Ingested inside [transcriber.py](file:///C:/Users/PC/Documents/ARIN/ARIN-Climate-DSS/backend/app/services/transcriber.py) every **2 minutes**.
* Scans the `uploads/` folder for audio/video media (up to 1GB supported via Nginx body configuration).
* Uses a persistent memory cache (`_MODEL_CACHE`) to hold Whisper weights in RAM, speeding up inference and preventing RAM out-of-memory errors on limited VPS hardware.

---

## **2.3 Retrieval-Augmented Generation (RAG) & Citation Engine**
The Chatbot RAG query logic is located inside [chat.py](file:///C:/Users/PC/Documents/ARIN/ARIN-Climate-DSS/backend/app/routers/chat.py).

```
[User Query] ──> [HuggingFace Embedder] ──> [ChromaDB Vector Match] ──> [Context Injected Prompt] ──> [OpenAI GPT-4o-mini] ──> [Response with Inline Citations]
```

1. **Embedding:** Chunked text paragraphs are converted into `384`-dimension vectors using sentence-transformers.
2. **Context Retrieval:** Queries are matched against vectors in ChromaDB to retrieve top relevant contexts.
3. **Prompt Construction:** Retrieved context is injected into the LLM system prompt:
   ```
   System Prompt: Use ONLY the provided context to answer the user query. 
   Every factual claim MUST include an inline citation in the format [Source: Document Title].
   If the answer cannot be found in the context, output: [LOW CONFIDENCE - VERIFY SOURCE].
   ```

### **2.3.1 Token Optimization: Rate Limiting & Semantic Query Caching**
To prevent third-party API token depletion and control operational costs, the chatbot implements two protective mechanisms:
* **Rolling Rate Limit:** Users are restricted to a maximum of **10 token-consuming queries per rolling 18-hour period**. If this limit is exceeded, subsequent prompts that require new LLM processing are blocked with a `429 Too Many Requests` response.
* **Semantic Cache Fallback:** Before calling the OpenAI API, the chatbot scans the database `chat_messages` table for identical past queries from any user. If a match is found, it immediately serves the **cached response** from database records. Queries resolved via this cache do not count toward the user's 10-prompt limit, allowing unlimited exploration of previously answered topics.

---

## **2.4 Database Schema & PostgreSQL Relations**
The database is structured in PostgreSQL. Models are defined in:  
📂 `C:\Users\PC\Documents\ARIN\ARIN-Climate-DSS\backend\app\models`

```
┌─────────────────────────────────┐       ┌─────────────────────────────────┐
│             users               │       │          chat_threads           │
├─────────────────────────────────┤       ├─────────────────────────────────┤
│ id: SERIAL (PK)                 │       │ id: VARCHAR(100) (PK)           │
│ email: VARCHAR(255) (UQ, IX)    │◄──────┤ user_email: VARCHAR(255) (IX)   │
│ hashed_password: VARCHAR(255)   │       │ title: VARCHAR(255)             │
│ is_active: BOOLEAN              │       │ created_at: TIMESTAMP           │
└─────────────────────────────────┘       └────────────────┬────────────────┘
                                                           │
                                                           │ 1
                                                           │
                                                           │ M
                                                           ▼
┌─────────────────────────────────┐       ┌─────────────────────────────────┐
│            documents            │       │          chat_messages          │
├─────────────────────────────────┤       ├─────────────────────────────────┤
│ id: SERIAL (PK)                 │       │ id: SERIAL (PK)                 │
│ title: VARCHAR(255) (IX)        │       │ thread_id: VARCHAR (FK)         │
│ url: VARCHAR(500)               │       │ role: VARCHAR(50)               │
│ date: VARCHAR(100)              │       │ content: TEXT                   │
│ type: VARCHAR(100)              │       │ created_at: TIMESTAMP           │
│ body: TEXT                      │       │ feedback_rating: INTEGER        │
│ file_url: VARCHAR(500)          │       │ feedback_text: TEXT             │
│ source: VARCHAR(100)            │       └─────────────────────────────────┘
│ country: VARCHAR(100)           │
│ scraped_at: TIMESTAMP           │
│ content_text: TEXT              │
└─────────────────────────────────┘
```

#### **Auth Validation Rule:**
Rather than relying on a mutable `role` field, user administrative authorization is strictly managed in [auth.py](file:///C:/Users/PC/Documents/ARIN/ARIN-Climate-DSS/backend/app/auth.py) by verifying matching emails:
```python
if current_user.email != "admin@arin-africa.org":
    raise HTTPException(status_code=403, detail="Administrative privileges required.")
```

---

## **2.5 Dynamic Frontend Stack & Recharts Visualization**
Located in the local path:  
📂 `C:\Users\PC\Documents\ARIN\ARIN-Climate-DSS\frontend`

* **LineChart Visualization:** Configured in [AnalyticsDashboard.tsx](file:///C:/Users/PC/Documents/ARIN/ARIN-Climate-DSS/frontend/app/data-sources/AnalyticsDashboard.tsx) using Recharts. It plots document counts chronologically based on their publication years and source.
* **BarChart Ingestion Rate:** Integrated inside [page.tsx](file:///C:/Users/PC/Documents/ARIN/ARIN-Climate-DSS/frontend/app/admin/page.tsx). It shows the stacked monthly volume of scraped vs. manually uploaded admin reports.

---

## **2.6 Comprehensive API Endpoints Inventory**

| Category | Method | Path | Controller File | Purpose |
| :--- | :--- | :--- | :--- | :--- |
| **Auth** | `POST` | `/api/v1/auth/signup` | [auth.py](file:///C:/Users/PC/Documents/ARIN/ARIN-Climate-DSS/backend/app/routers/auth.py) | Register user profile |
| | `POST` | `/api/v1/auth/login` | [auth.py](file:///C:/Users/PC/Documents/ARIN/ARIN-Climate-DSS/backend/app/routers/auth.py) | Retrieve JWT token |
| | `POST` | `/api/v1/auth/reset-password` | [auth.py](file:///C:/Users/PC/Documents/ARIN/ARIN-Climate-DSS/backend/app/routers/auth.py) | Update user password |
| **Admin** | `GET` | `/api/v1/admin/users/stats` | [auth.py](file:///C:/Users/PC/Documents/ARIN/ARIN-Climate-DSS/backend/app/routers/auth.py) | Fetch user numbers |
| | `GET` | `/api/v1/admin/content/stats` | [auth.py](file:///C:/Users/PC/Documents/ARIN/ARIN-Climate-DSS/backend/app/routers/auth.py) | Fetch content volumes |
| | `GET` | `/api/v1/admin/reports/monthly` | [analytics.py](file:///C:/Users/PC/Documents/ARIN/ARIN-Climate-DSS/backend/app/routers/analytics.py) | Monthly ingestion data |
| **Media/Doc**| `GET` | `/documents` | [documents.py](file:///C:/Users/PC/Documents/ARIN/ARIN-Climate-DSS/backend/app/routers/documents.py) | Listing of indexed records |
| | `POST` | `/documents/upload` | [documents.py](file:///C:/Users/PC/Documents/ARIN/ARIN-Climate-DSS/backend/app/routers/documents.py) | Upload PDF research |
| | `POST` | `/media/upload` | [documents.py](file:///C:/Users/PC/Documents/ARIN/ARIN-Climate-DSS/backend/app/routers/documents.py) | Upload audio recordings |
| **RAG Chat** | `GET` | `/api/v1/chat/threads` | [chat.py](file:///C:/Users/PC/Documents/ARIN/ARIN-Climate-DSS/backend/app/routers/chat.py) | Fetch past chat threads |
| | `POST` | `/api/v1/chat/threads` | [chat.py](file:///C:/Users/PC/Documents/ARIN/ARIN-Climate-DSS/backend/app/routers/chat.py) | Create new chat thread |
| | `POST` | `/api/v1/chat/query` | [chat.py](file:///C:/Users/PC/Documents/ARIN/ARIN-Climate-DSS/backend/app/routers/chat.py) | Chatbot RAG query |

---

## **2.7 Deployment, Docker Orchestration, and Operations Guide**
Docker orchestration is configured in `C:\Users\PC\Documents\ARIN\ARIN-Climate-DSS\docker-compose.yml`.

### **2.7.1 Nginx Server Configuration (`nginx/conf.d/app.conf`)**
```nginx
server {
    listen 80;
    server_name arin-climatedata.org;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl;
    server_name arin-climatedata.org;

    ssl_certificate /etc/nginx/certs/fullchain.pem;
    ssl_certificate_key /etc/nginx/certs/privkey.pem;

    client_max_body_size 1024M; # Support large video uploads

    location / {
        proxy_pass http://arin_frontend:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location /api/v1/ {
        proxy_pass http://arin_backend:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_connect_timeout 300s;
        proxy_read_timeout 300s;
    }
}
```

### **2.7.2 Compiling Next.js Builds on VPS**
Whenever frontend files are updated, compile the production static assets inside the frontend container:
```bash
# SSH into the VPS
ssh cynthia-consultant@204.48.20.139

# Build NextJS statically
docker-compose exec -T frontend pnpm build

# Restart the service
docker-compose restart frontend
```

---

# **APPENDICES**

## **Appendix A — Milestone Summary & Project Lifecycle**
* **D1 — Inception (Week 2):** Scoped objectives, languages, ingestion frameworks, and data specification plans. Submitted and approved May 17, 2026.
* **D2 — AI Conceptual Model (Week 6):** Mapped architecture blueprints, pgvector embeddings integration schemas, and RAG pipelines.
* **D3 — Functional Codebase / MVP (Week 10):** Integrated UNFCCC scrapers, KoboCollect API synchronization webhooks, local Whisper models, and the expert blogging workflow dashboard. Approved July 12, 2026.
* **D4 — Production Deployment (Week 12):** Hardened authentication layers, configured auto-logout routines, optimized Whisper model caching, and completed live production deployment on ARIN cloud infrastructure.

---

## **Appendix B — Glossary of Key Terms**
* **APScheduler:** Advanced Python Scheduler used for managing background tasks within Python applications.
* **ChromaDB:** A fast, lightweight vector database used for semantic search and document retrieval in RAG systems.
* **Deno:** A secure runtime for JavaScript and TypeScript that acts as the default EJS solver runtime for decrypting YouTube signature challenges inside the container environment.
* **Docker & Docker-Compose:** A containerization platform and orchestrator used to isolate and deploy the application's microservices (Frontend, Backend, Database, Nginx).
* **FastAPI:** A high-performance, modern ASGI web framework for building Python APIs.
* **GET (HTTP Method):** An idempotent, read-only request method used exclusively to retrieve data from a server without modifying system states.
* **JSON Web Token (JWT):** A compact, URL-safe means of representing claims to be transferred between two parties, used for securing administrative and researcher sessions.
* **KoboCollect:** An open-source suite of tools for field data collection, using forms to gather survey results.
* **Next.js:** A React framework for building fast web applications, powering the system's dynamic user interface, search portals, and admin management pages.
* **Nginx:** A high-performance HTTP web server and reverse proxy, managing SSL encryption, static file caching, and client upload request sizes (configured up to 1GB).
* **pgvector:** A PostgreSQL extension enabling open-source vector similarity searches directly inside standard SQL databases.
* **POST (HTTP Method):** A non-idempotent request method used to send data to a server to create/modify records, initiate tasks, or upload binary payloads.
* **Recharts:** A composable charting library built on React components, used for rendering data ingestion bar charts and country volume metrics.
* **Retrieval-Augmented Generation (RAG):** An AI framework that fetches relevant context from a database to ground the response of a Large Language Model.
* **SentenceTransformers:** A Python framework for state-of-the-art sentence, text, and image embeddings, converting unstructured documents into 384-dimension vectors.
* **Whisper AI:** An open-source speech recognition model developed by OpenAI, deployed locally for transcribing media uploads.
