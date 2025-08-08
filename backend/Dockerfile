# ============================================================================
# Multi-Stage Docker Build for PrepPad Backend - Optimized for Size
# Target: Reduce from 9.7GB to ~1.5-2.5GB while maintaining full functionality
# ============================================================================

# ============================================================================
# STAGE 1: Builder - Install dependencies and download models
# ============================================================================
FROM python:3.11-slim as builder

# Set environment variables for build stage
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV DEBIAN_FRONTEND=noninteractive
ENV PIP_NO_CACHE_DIR=1
ENV PIP_DISABLE_PIP_VERSION_CHECK=1

# Install build dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    gcc \
    g++ \
    libc-dev \
    libffi-dev \
    libssl-dev \
    libxml2-dev \
    libxslt1-dev \
    zlib1g-dev \
    pkg-config \
    libfreetype6-dev \
    libpng-dev \
    libjpeg-dev \
    wget \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Create virtual environment
RUN python -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# Copy and install Python dependencies
COPY requirements.txt /tmp/
WORKDIR /tmp

# Install Python packages in virtual environment with verbose output for debugging
RUN pip install --upgrade pip setuptools wheel

# Install PyTorch CPU version separately (major size optimization)
RUN pip install --verbose torch==2.1.2+cpu --index-url https://download.pytorch.org/whl/cpu

# Install requirements in stages for better debugging
# Stage 1: Core Django packages
RUN pip install --no-cache-dir --verbose \
    "Django>=5.0,<5.1" \
    "djangorestframework>=3.14,<3.16" \
    "django-cors-headers>=4.0,<5.0" \
    "djangorestframework-simplejwt>=5.0,<6.0" \
    "dj-database-url>=2.0,<3.0" \
    "python-dotenv>=1.0,<2.0"

# Stage 2: Production server
RUN pip install --no-cache-dir --verbose \
    "gunicorn>=21.0,<22.0" \
    "whitenoise>=6.0,<7.0" \
    "psycopg2-binary>=2.9,<3.0"

# Stage 3: File processing and basic libraries
RUN pip install --no-cache-dir --verbose \
    "requests>=2.28,<3.0" \
    "beautifulsoup4>=4.11,<5.0" \
    "pdfplumber>=0.10,<1.0" \
    "python-docx>=1.0,<2.0"

# Stage 4: NLP libraries (potential issue packages)
RUN pip install --no-cache-dir --verbose \
    "nltk>=3.8,<4.0" \
    "spacy>=3.7,<4.0"

# Stage 5: ML libraries (depend on PyTorch)
RUN pip install --no-cache-dir --verbose \
    "transformers>=4.30,<5.0" \
    "huggingface-hub>=0.19,<1.0" \
    "accelerate>=0.20,<1.0"

# Stage 6: Web scraping (complex dependencies)
RUN pip install --no-cache-dir --verbose \
    "selenium>=4.15,<5.0" \
    "webdriver-manager>=4.0,<5.0" \
    "lxml>=4.9,<5.0"

# Stage 7: Optional cloud storage and security
RUN pip install --no-cache-dir --verbose \
    "cryptography>=41.0,<42.0" \
    "cloudinary>=1.30,<2.0" \
    "django-cloudinary-storage>=0.3,<1.0"

# Download NLP models (in builder stage to avoid runtime downloads)
# Using en_core_web_sm (50MB) instead of en_core_web_lg (800MB) for size optimization
RUN python -m spacy download en_core_web_sm && \
    python -c "import nltk; nltk.download('words', quiet=True); nltk.download('stopwords', quiet=True); nltk.download('punkt', quiet=True)"

# ============================================================================
# STAGE 2: Runtime - Minimal production image
# ============================================================================
FROM python:3.11-slim as runtime

# Set production environment variables
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV CHROME_BIN=/usr/bin/chromium
ENV CHROMEDRIVER_PATH=/usr/bin/chromedriver
ENV DEBIAN_FRONTEND=noninteractive
ENV PATH="/opt/venv/bin:$PATH"

# Create app user for security
RUN groupadd -r appuser && useradd -r -g appuser appuser

# Install minimal runtime dependencies only
RUN apt-get update && apt-get install -y --no-install-recommends \
    # Essential libraries for Python packages
    libxml2 \
    libxslt1.1 \
    libffi8 \
    libssl3 \
    zlib1g \
    # Chromium for web scraping (lightweight installation)
    chromium \
    chromium-driver \
    # PostgreSQL client
    libpq5 \
    # Cleanup
    && rm -rf /var/lib/apt/lists/* \
    && apt-get purge -y --auto-remove \
    && rm -rf /var/cache/apt/archives/* \
    && find /usr/share/doc -depth -type f ! -name copyright -delete \
    && find /usr/share/man -depth -type f -delete

# Copy virtual environment from builder
COPY --from=builder /opt/venv /opt/venv

# Copy NLTK and Spacy data from builder
COPY --from=builder /root/nltk_data /home/appuser/nltk_data
COPY --from=builder /opt/venv/lib/python3.11/site-packages/en_core_web_sm /opt/venv/lib/python3.11/site-packages/en_core_web_sm

# Set NLTK data path
ENV NLTK_DATA=/home/appuser/nltk_data

# Create working directory and set permissions
WORKDIR /app
RUN chown -R appuser:appuser /app

# Copy application code (excluding unnecessary files via .dockerignore)
COPY --chown=appuser:appuser . .

# Remove unnecessary files that might have been copied
RUN find . -name "*.pyc" -delete && \
    find . -name "__pycache__" -type d -exec rm -rf {} + && \
    find . -name "*.pyo" -delete && \
    find . -name ".git" -type d -exec rm -rf {} + && \
    find . -name ".pytest_cache" -type d -exec rm -rf {} + && \
    find . -name "*.log" -delete && \
    rm -rf venv/ .venv/ node_modules/ .env 2>/dev/null || true

# Switch to non-root user
USER appuser

# Change to Django project directory
WORKDIR /app/file_upload_project

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=30s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:8000/api/health/ || exit 1

# Production command using Gunicorn
CMD ["gunicorn", "--workers", "3", "--bind", "0.0.0.0:8000", "--timeout", "120", "--keepalive", "5", "file_upload_project.wsgi:application"]