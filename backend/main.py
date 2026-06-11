import asyncio
import os
import uuid

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from services.rag_service import ask, build_retriever, generate_questions

load_dotenv()

app = FastAPI(title="ISO RAG API")

origins = [
    o.strip()
    for o in os.getenv("ALLOWED_ORIGINS", "http://localhost:5173").split(",")
    if o.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

os.makedirs("uploads", exist_ok=True)
app.state.retrievers: dict = {}


class ChatRequest(BaseModel):
    session_id: str
    question: str


@app.get("/")
async def health():
    return {"status": "ok"}


@app.post("/api/upload")
async def upload_pdf(file: UploadFile):
    if not file.filename or not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are accepted.")

    session_id = str(uuid.uuid4())
    safe_name = f"{session_id}_{file.filename}"
    pdf_path = os.path.join("uploads", safe_name)

    contents = await file.read()
    with open(pdf_path, "wb") as f:
        f.write(contents)

    retriever, page_count, pages = await asyncio.to_thread(build_retriever, pdf_path)
    app.state.retrievers[session_id] = retriever

    suggested_questions = await asyncio.to_thread(generate_questions, pages)

    return {"session_id": session_id, "page_count": page_count, "suggested_questions": suggested_questions}


@app.post("/api/chat")
async def chat(req: ChatRequest):
    retriever = app.state.retrievers.get(req.session_id)
    if retriever is None:
        raise HTTPException(status_code=404, detail="Session not found. Please upload a PDF first.")

    try:
        answer = await asyncio.to_thread(ask, req.question, retriever)
        return {"answer": answer}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
