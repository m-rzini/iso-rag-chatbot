import { useState } from "react";
import ChatPanel from "./components/ChatPanel";
import PdfUploader from "./components/PdfUploader";

export default function App() {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [pageCount, setPageCount] = useState<number | null>(null);

  function handleUploadSuccess(sid: string, pages: number) {
    setSessionId(sid);
    setPageCount(pages);
  }

  return (
    <div className="flex h-screen bg-slate-900 text-slate-100 overflow-hidden">
      {/* Left panel — upload */}
      <div className="w-80 flex-shrink-0 flex flex-col border-r border-slate-700 bg-slate-800/40">
        <div className="px-5 py-5 border-b border-slate-700">
          <h1 className="text-lg font-bold text-white tracking-tight">
            ISO 9001 RAG Chatbot
          </h1>
          <p className="text-slate-400 text-xs mt-1">
            Upload a PDF, then ask questions about it.
          </p>
        </div>

        <div className="flex-1 px-4 py-5 flex flex-col gap-4 overflow-y-auto">
          <PdfUploader onUploadSuccess={handleUploadSuccess} />

          {sessionId && pageCount !== null && (
            <div className="rounded-lg bg-slate-800 border border-slate-700 px-4 py-3 text-xs text-slate-400 space-y-1">
              <p>
                <span className="text-slate-500">Session</span>{" "}
                <code className="text-slate-300 font-mono break-all">{sessionId.slice(0, 8)}…</code>
              </p>
              <p>
                <span className="text-slate-500">Pages indexed</span>{" "}
                <span className="text-emerald-400 font-semibold">{pageCount}</span>
              </p>
            </div>
          )}
        </div>

        <div className="px-4 py-3 border-t border-slate-700 text-slate-600 text-xs text-center">
          Powered by Groq · LangChain · FAISS
        </div>
      </div>

      {/* Right panel — chat */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="px-5 py-4 border-b border-slate-700 flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full flex-shrink-0 ${sessionId ? "bg-emerald-400" : "bg-slate-600"}`} />
          <span className="text-sm text-slate-300">
            {sessionId ? "Ready — ask your question below" : "Waiting for PDF upload…"}
          </span>
        </div>
        <div className="flex-1 min-h-0">
          <ChatPanel sessionId={sessionId} />
        </div>
      </div>
    </div>
  );
}
