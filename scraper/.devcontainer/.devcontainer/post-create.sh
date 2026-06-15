#!/bin/bash
set -e

echo "🚀 Setting up ARIN DSS Development Environment..."

# Update system
sudo apt-get update && sudo apt-get install -y \
    libnss3 libnspr4 libatk1.0-0 libatk-bridge2.0-0 \
    libcups2 libdbus-1-3 libdrm2 libxkbcommon0 libxcomposite1 \
    libxdamage1 libxfixes3 libxrandr2 libgbm1 libasound2

# Install Playwright system dependencies
pip install playwright
playwright install --with-deps chromium

# Install project dependencies
pip install --upgrade pip
pip install scrapy scrapy-playwright pandas psycopg2-binary \
            langchain langchain-community langchain-openai \
            python-dotenv unstructured[pdf] pillow

echo "✅ Environment setup completed!"
echo "📁 Project ready at: $(pwd)"
echo ""
echo "Next steps:"
echo "1. Run: scrapy startproject ingestion .   (if not already done)"
echo "2. Create your spiders as planned"
