import json
import os
import re
from langchain_community.document_loaders import PyPDFLoader
from langchain_community.retrievers import BM25Retriever
from langchain_community.vectorstores import FAISS
from langchain_huggingface import HuggingFaceEmbeddings
from langchain.retrievers import EnsembleRetriever
from langchain.chains import RetrievalQA
from langchain_groq import ChatGroq


def build_retriever(pdf_path: str) -> tuple:
    loader = PyPDFLoader(pdf_path)
    pages = loader.load_and_split()

    bm25_retriever = BM25Retriever.from_documents(pages)
    bm25_retriever.k = 2

    embedding_model = HuggingFaceEmbeddings(
        model_name="sentence-transformers/all-MiniLM-L6-v2"
    )
    faiss_db = FAISS.from_documents(pages, embedding_model)
    faiss_retriever = faiss_db.as_retriever(search_kwargs={"k": 2})

    ensemble_retriever = EnsembleRetriever(
        retrievers=[bm25_retriever, faiss_retriever],
        weights=[0.4, 0.6],
    )

    return ensemble_retriever, len(pages), pages


def generate_questions(pages: list) -> list[str]:
    sample = "\n\n".join(p.page_content for p in pages[:5])[:3000]
    llm = ChatGroq(model="llama-3.3-70b-versatile")
    prompt = (
        "Tu es un assistant expert en analyse de documents. "
        "Voici un extrait du document :\n\n"
        f"{sample}\n\n"
        "Génère exactement 3 questions pertinentes et concises qu'un utilisateur pourrait poser sur ce document. "
        "Réponds UNIQUEMENT avec un tableau JSON de 3 chaînes, sans aucun autre texte. "
        'Exemple : ["Question 1 ?", "Question 2 ?", "Question 3 ?"]'
    )
    response = llm.invoke(prompt).content.strip()
    match = re.search(r'\[.*?\]', response, re.DOTALL)
    if match:
        return json.loads(match.group())
    return []


def ask(query: str, retriever) -> str:
    llm = ChatGroq(model="llama-3.3-70b-versatile")
    qa = RetrievalQA.from_chain_type(
        llm=llm, chain_type="stuff", retriever=retriever
    )
    return qa.invoke(query)["result"]
