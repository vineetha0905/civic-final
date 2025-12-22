#!/bin/bash
# Startup script for Render deployment
# Render sets PORT environment variable automatically

PORT=${PORT:-7860}
echo "Starting ML Backend on port $PORT"

# Use uvicorn to start the FastAPI app
uvicorn app.main:app --host 0.0.0.0 --port $PORT --workers 1

