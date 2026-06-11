const BASE_URL = (import.meta.env.VITE_API_URL as string) || "http://localhost:8000";

export async function uploadPdf(
  file: File
): Promise<{ session_id: string; page_count: number; suggested_questions: string[] }> {
  const form = new FormData();
  form.append("file", file);

  const res = await fetch(`${BASE_URL}/api/upload`, {
    method: "POST",
    body: form,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail ?? "Upload failed");
  }

  return res.json();
}

export async function sendMessage(
  session_id: string,
  question: string
): Promise<{ answer: string }> {
  const res = await fetch(`${BASE_URL}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ session_id, question }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail ?? "Chat request failed");
  }

  return res.json();
}
