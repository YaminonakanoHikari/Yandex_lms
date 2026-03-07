FROM python:3.11-slim

WORKDIR /app
COPY backend/ ./backend/
COPY frontend/ ./frontend/

RUN pip install fastapi uvicorn anthropic

CMD ["uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8000"]