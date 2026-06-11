# ISO 9001 RAG Chatbot

A RAG (Retrieval-Augmented Generation) chatbot that lets you upload any PDF and ask questions about it in natural language. Built as a demo with the ISO 9001:2015 standard.

## Live Demo

- **Frontend**: https://iso-rag-chatbot-frontend.onrender.com
- **Backend API**: https://iso-rag-chatbot-backend.onrender.com

> The backend runs on Render's free tier and may take 30–60 seconds to wake up after inactivity.

## Features

- Upload any PDF via drag & drop or file browser
- BM25 + FAISS ensemble retrieval for accurate document search
- Multilingual support (French, English, Arabic, and more)
- Auto-generated suggested questions based on the document content
- Markdown rendering for LLM responses
- Smart system prompt — prioritizes the uploaded document, complements with ISO 9001 / quality management expertise, and rejects off-topic questions

## Architecture

```
┌─────────────────────┐        ┌──────────────────────────┐
│   React Frontend    │  HTTP  │     FastAPI Backend       │
│   Vite + Tailwind   │◄──────►│                          │
│   Render Static     │        │  BM25 + FAISS Retriever  │
└─────────────────────┘        │  Cohere Embeddings       │
                                │  Cohere LLM (chat)       │
                                │  Render Web Service      │
                                └──────────────────────────┘
```

## Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite + TypeScript + Tailwind CSS |
| Backend | FastAPI + Python 3.12 |
| LLM | Cohere `command-r-plus-08-2024` |
| Embeddings | Cohere `embed-multilingual-v3.0` |
| Vector store | FAISS |
| Keyword search | BM25 (rank-bm25) |
| Hosting | Render (backend + frontend) |

## Project Structure

```
iso-rag-chatbot/
├── backend/
│   ├── main.py                 # FastAPI app, endpoints
│   ├── requirements.txt
│   ├── .env.example
│   └── services/
│       └── rag_service.py      # RAG pipeline (build + query)
├── frontend/
│   ├── src/
│   │   ├── App.tsx
│   │   ├── components/
│   │   │   ├── PdfUploader.tsx
│   │   │   └── ChatPanel.tsx
│   │   └── api/
│   │       └── client.ts
│   ├── public/
│   │   └── _redirects
│   └── .env.example
└── render.yaml
```

## Local Setup

### Prerequisites

- Python 3.10+
- Node.js 18+
- Cohere API key (free at [cohere.com](https://cohere.com))

### Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\Activate.ps1
pip install -r requirements.txt
cp .env.example .env             # fill in your API keys
uvicorn main:app --reload
```

### Frontend

```bash
cd frontend
cp .env.example .env             # set VITE_API_URL=http://localhost:8000
npm install
npm run dev
```

Open http://localhost:5173

## Environment Variables

### Backend `.env`

```
COHERE_API_KEY=your_cohere_api_key
ALLOWED_ORIGINS=http://localhost:5173
```

### Frontend `.env`

```
VITE_API_URL=http://localhost:8000
```

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/` | Health check |
| `POST` | `/api/upload` | Upload PDF, build RAG index |
| `POST` | `/api/chat` | Ask a question |

### POST /api/upload

```json
// Response
{
  "session_id": "uuid",
  "page_count": 29,
  "suggested_questions": ["Question 1?", "Question 2?", "Question 3?"]
}
```

### POST /api/chat

```json
// Request
{ "session_id": "uuid", "question": "Quelles sont les exigences du chapitre 4 ?" }

// Response
{ "answer": "Le chapitre 4 traite du contexte de l'organisme..." }
```

## Deployment on Render

### Backend — Web Service

| Field | Value |
|---|---|
| Root Directory | `backend` |
| Build Command | `pip install -r requirements.txt` |
| Start Command | `uvicorn main:app --host 0.0.0.0 --port $PORT` |

**Environment Variables:** `COHERE_API_KEY`, `ALLOWED_ORIGINS`

### Frontend — Static Site

| Field | Value |
|---|---|
| Root Directory | `frontend` |
| Build Command | `npm install && npm run build` |
| Publish Directory | `dist` |

**Environment Variables:** `VITE_API_URL`

## Notes

- Sessions are stored in-memory — lost on backend restart (expected on free tier)
- Uploaded PDFs are saved temporarily in `uploads/` and lost on restart
- Free tier backend sleeps after 15 min of inactivity — first request takes ~30s
