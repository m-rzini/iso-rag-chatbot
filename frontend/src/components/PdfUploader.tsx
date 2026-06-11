import React, { useRef, useState } from "react";
import { uploadPdf } from "../api/client";

interface Props {
  onUploadSuccess: (sessionId: string, pageCount: number) => void;
}

type State = "idle" | "uploading" | "done" | "error";

export default function PdfUploader({ onUploadSuccess }: Props) {
  const [state, setState] = useState<State>("idle");
  const [fileName, setFileName] = useState("");
  const [pageCount, setPageCount] = useState(0);
  const [errorMsg, setErrorMsg] = useState("");
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    if (!file.name.toLowerCase().endsWith(".pdf")) {
      setErrorMsg("Please select a PDF file.");
      setState("error");
      return;
    }
    setFileName(file.name);
    setState("uploading");
    setErrorMsg("");
    try {
      const { session_id, page_count } = await uploadPdf(file);
      setPageCount(page_count);
      setState("done");
      onUploadSuccess(session_id, page_count);
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : "Upload failed");
      setState("error");
    }
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }

  function onInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }

  return (
    <div className="flex flex-col gap-4">
      <div
        onClick={() => state !== "uploading" && inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={`
          relative flex flex-col items-center justify-center gap-3
          rounded-xl border-2 border-dashed px-6 py-10 cursor-pointer
          transition-colors duration-150
          ${dragging
            ? "border-blue-400 bg-slate-700"
            : state === "done"
            ? "border-emerald-500 bg-slate-800/60"
            : state === "error"
            ? "border-red-500 bg-slate-800/60"
            : "border-slate-600 bg-slate-800 hover:border-slate-400 hover:bg-slate-700/60"
          }
        `}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".pdf"
          className="hidden"
          onChange={onInputChange}
        />

        {state === "idle" || state === "error" ? (
          <>
            <svg className="w-12 h-12 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <p className="text-slate-300 text-sm text-center">
              <span className="font-semibold text-blue-400">Click to upload</span> or drag &amp; drop
            </p>
            <p className="text-slate-500 text-xs">PDF files only</p>
          </>
        ) : state === "uploading" ? (
          <>
            <svg className="w-10 h-10 text-blue-400 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <p className="text-slate-300 text-sm">Processing <span className="font-medium text-blue-300">{fileName}</span>…</p>
            <p className="text-slate-500 text-xs">Building RAG index — this may take a moment</p>
          </>
        ) : (
          <>
            <svg className="w-10 h-10 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-emerald-300 font-semibold text-sm">{fileName}</p>
            <p className="text-slate-400 text-xs">{pageCount} pages indexed</p>
          </>
        )}
      </div>

      {state === "error" && (
        <p className="text-red-400 text-xs text-center">{errorMsg}</p>
      )}
      {state === "done" && (
        <button
          onClick={() => { setState("idle"); setFileName(""); }}
          className="text-xs text-slate-500 hover:text-slate-300 underline self-center transition-colors"
        >
          Upload a different PDF
        </button>
      )}
    </div>
  );
}
