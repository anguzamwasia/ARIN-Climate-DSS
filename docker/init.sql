-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Main documents table
CREATE TABLE IF NOT EXISTS documents (
    id            SERIAL PRIMARY KEY,
    title         TEXT NOT NULL,
    url           TEXT UNIQUE NOT NULL,
    date          TEXT,
    type          TEXT,
    body          TEXT,
    file_url      TEXT,
    source        TEXT DEFAULT 'UNFCCC',
    country       TEXT,
    scraped_at    TIMESTAMP,
    -- RAG fields
    content_text  TEXT,
    embedding     vector(1536),
    chunk_index   INT DEFAULT 0,
    metadata      JSONB DEFAULT '{}'
);

-- Index for fast vector similarity search
CREATE INDEX IF NOT EXISTS documents_embedding_idx
    ON documents USING ivfflat (embedding vector_cosine_ops)
    WITH (lists = 100);

-- Index for country filtering
CREATE INDEX IF NOT EXISTS documents_country_idx ON documents (country);
CREATE INDEX IF NOT EXISTS documents_type_idx ON documents (type);

-- View for quick stats
CREATE OR REPLACE VIEW document_stats AS
    SELECT
        country,
        COUNT(*) as total_reports,
        COUNT(file_url) as reports_with_files,
        MAX(scraped_at) as last_scraped
    FROM documents
    GROUP BY country
    ORDER BY total_reports DESC;
