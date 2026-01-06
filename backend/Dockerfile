FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

WORKDIR /app

# Dépendances système nécessaires pour OpenCV, face-recognition, dlib, etc.
# Separate layer for system dependencies to improve caching
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    cmake \
    libgl1 \
    libglib2.0-0 \
    libssl-dev \
    curl \
    libopenblas-dev \
    liblapack-dev \
    libx11-dev \
    libgtk-3-dev \
    && rm -rf /var/lib/apt/lists/* \
    && apt-get clean

# Variables d'environnement pour accélérer la compilation de dlib
ENV DLIB_BUILD_USE_AVX_INSTRUCTIONS=1 \
    DLIB_BUILD_USE_SSE2_INSTRUCTIONS=1 \
    DLIB_BUILD_USE_SSE4_INSTRUCTIONS=1

# Copy requirements first for better layer caching
COPY requirements-docker.txt .

# Install Python dependencies in separate layer
# Note: dlib compilation (via face-recognition) can take 20-30 minutes
# The build dependencies above help speed this up
RUN pip install --no-cache-dir --upgrade pip setuptools wheel && \
    pip install --no-cache-dir -r requirements-docker.txt

# Copy application code last (changes most frequently)
COPY . .

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]


