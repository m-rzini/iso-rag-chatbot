import React, { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { sendMessage } from "../api/client";

interface Message {
  role: "user" | "ai";
  content: string;
}

const SUGGESTED_QUESTIONS = [
  "Comment établir une politique qualité ?",
  "Que dit la norme sur les références normatives ?",
  "Quelles sont les exigences concernant les besoins et attentes des parties intéressées ?",
];

interface Props {
  sessionId: string | null;
}

function Spinner() {
  return (
    <svg className="w-5 h-5 text-slate-400 animate-spin" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

export default function ChatPanel({ sessionId }: Props) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function submit(question: string) {
    if (!sessionId || !question.trim() || loading) return;
    const q = question.trim();
    setInput("");
    setError("");
    setMessages((prev) => [...prev, { role: "user", content: q }]);
    setLoading(true);
    try {
      const { answer } = await sendMessage(sessionId, q);
      setMessages((prev) => [...prev, { role: "ai", content: answer }]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit(input);
    }
  }

  const disabled = !sessionId || loading;

  return (
    <div className="flex flex-col h-full">
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
        {messages.length === 0 && !loading && (
          <div className="flex flex-col items-center justify-center h-full gap-6 text-center">
            <div>
              <p className="text-slate-400 text-sm mb-1">
                {sessionId
                  ? "PDF prêt. Posez n'importe quelle question sur votre document."
                  : "Chargez un PDF à gauche pour commencer."}
              </p>
            </div>
            {sessionId && (
              <div className="flex flex-wrap gap-2 justify-center">
                {SUGGESTED_QUESTIONS.map((q) => (
                  <button
                    key={q}
                    onClick={() => submit(q)}
                    className="px-3 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300 text-xs transition-colors border border-slate-600 hover:border-slate-500"
                  >
                    {q}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`
                max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed
                ${msg.role === "user"
                  ? "bg-blue-600 text-white rounded-br-sm"
                  : "bg-slate-700 text-slate-100 rounded-bl-sm"}
              `}
            >
              {msg.role === "ai" ? (
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  className="prose prose-invert prose-sm max-w-none"
                >
                  {msg.content}
                </ReactMarkdown>
              ) : (
                msg.content
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-slate-700 rounded-2xl rounded-bl-sm px-4 py-3 flex items-center gap-2">
              <Spinner />
              <span className="text-slate-400 text-xs">Réflexion en cours…</span>
            </div>
          </div>
        )}

        {error && (
          <p className="text-center text-red-400 text-xs">{error}</p>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input bar */}
      <div className="border-t border-slate-700 px-4 py-3 bg-slate-800/50">
        <div className="flex gap-2 items-end">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            disabled={disabled}
            rows={1}
            placeholder={
              sessionId ? "Posez une question… (Entrée pour envoyer)" : "Chargez un PDF pour commencer"
            }
            className="
              flex-1 resize-none rounded-xl bg-slate-700 border border-slate-600
              text-slate-100 placeholder-slate-500 text-sm px-4 py-3
              focus:outline-none focus:border-blue-500 transition-colors
              disabled:opacity-40 disabled:cursor-not-allowed
              max-h-32 overflow-y-auto
            "
          />
          <button
            onClick={() => submit(input)}
            disabled={disabled || !input.trim()}
            className="
              flex-shrink-0 rounded-xl bg-blue-600 hover:bg-blue-500
              disabled:opacity-40 disabled:cursor-not-allowed
              text-white px-4 py-3 transition-colors
            "
            aria-label="Send"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
