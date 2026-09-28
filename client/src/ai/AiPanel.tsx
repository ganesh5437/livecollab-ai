import { useState } from "react";
import { api, getAccessToken } from "../services/api";

interface AiPanelProps {
  documentId: string;
  editorText: string;
  onClose: () => void;
}

type Tab = "summarize" | "ask" | "autocomplete";

interface Citation {
  chunkId: number;
  chunkText: string;
}

export default function AiPanel({ documentId, editorText, onClose }: AiPanelProps) {
  const [tab, setTab] = useState<Tab>("summarize");

  return (
    <div className="fixed right-0 top-0 h-full w-96 border-l border-neutral-800 bg-neutral-950/95 backdrop-blur-xl shadow-2xl z-40 flex flex-col">
      <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-800">
        <h3 className="font-display font-semibold">AI Assistant</h3>
        <button onClick={onClose} className="text-neutral-500 hover:text-neutral-200">
          ✕
        </button>
      </div>

      <div className="flex border-b border-neutral-800 text-sm">
        {(["summarize", "ask", "autocomplete"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-2.5 capitalize transition ${
              tab === t
                ? "text-accent-light border-b-2 border-accent"
                : "text-neutral-500 hover:text-neutral-300"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {tab === "summarize" && <SummarizeTab documentId={documentId} />}
        {tab === "ask" && <AskTab documentId={documentId} />}
        {tab === "autocomplete" && <AutocompleteTab documentId={documentId} editorText={editorText} />}
      </div>
    </div>
  );
}

function SummarizeTab({ documentId }: { documentId: string }) {
  const [summary, setSummary] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function runSummarize() {
    setLoading(true);
    setSummary(null);
    try {
      const res = await api.post(`/documents/${documentId}/ai/summarize`);
      const data = await res.json();
      setSummary(data.summary ?? data.error ?? "No summary returned.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <button
        onClick={runSummarize}
        disabled={loading}
        className="w-full rounded-lg bg-accent py-2 text-sm font-medium hover:bg-accent-light transition disabled:opacity-50"
      >
        {loading ? "Summarizing…" : "Summarize this document"}
      </button>
      {summary && (
        <p className="mt-4 text-sm text-neutral-300 leading-relaxed whitespace-pre-wrap">{summary}</p>
      )}
    </div>
  );
}

function AskTab({ documentId }: { documentId: string }) {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [citations, setCitations] = useState<Citation[]>([]);
  const [loading, setLoading] = useState(false);

  async function askQuestion() {
    if (!question.trim()) return;
    setLoading(true);
    setAnswer("");
    setCitations([]);

    const API_URL = import.meta.env.VITE_API_URL;
    const res = await fetch(`${API_URL}/documents/${documentId}/ai/ask`, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${getAccessToken()}`,
      },
      body: JSON.stringify({ question }),
    });

    if (!res.body) {
      setLoading(false);
      return;
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      const lines = buffer.split("\n\n");
      buffer = lines.pop() ?? "";

      for (const line of lines) {
        if (!line.startsWith("data: ")) continue;
        const payload = line.slice(6);
        if (payload === "[DONE]") continue;

        try {
          const event = JSON.parse(payload);
          if (event.type === "text") {
            setAnswer((prev) => prev + event.value);
          } else if (event.type === "citations") {
            setCitations(event.value);
          }
        } catch {
          // skip malformed chunk
        }
      }
    }

    setLoading(false);
  }

  return (
    <div className="flex flex-col h-full">
      <textarea
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
        placeholder="Ask a question about this document…"
        rows={3}
        className="w-full rounded-lg bg-neutral-800 px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-accent resize-none"
      />
      <button
        onClick={askQuestion}
        disabled={loading}
        className="mt-2 w-full rounded-lg bg-accent py-2 text-sm font-medium hover:bg-accent-light transition disabled:opacity-50"
      >
        {loading ? "Thinking…" : "Ask"}
      </button>

      {answer && (
        <div className="mt-4 text-sm text-neutral-300 leading-relaxed whitespace-pre-wrap">{answer}</div>
      )}

      {citations.length > 0 && (
        <div className="mt-4 space-y-2 border-t border-neutral-800 pt-3">
          <p className="text-xs uppercase tracking-wide text-neutral-500">Sources</p>
          {citations.map((c) => (
            <div key={c.chunkId} className="text-xs text-neutral-500 bg-neutral-900 rounded-lg p-2">
              <span className="text-accent-light">[chunk {c.chunkId}]</span> {c.chunkText.slice(0, 120)}…
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function AutocompleteTab({ documentId, editorText }: { documentId: string; editorText: string }) {
  const [suggestion, setSuggestion] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function suggest() {
    setLoading(true);
    setSuggestion(null);
    try {
      const res = await api.post(`/documents/${documentId}/ai/autocomplete`, { context: editorText });
      const data = await res.json();
      setSuggestion(data.completion || "(no suggestion — write a bit more first)");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <p className="text-xs text-neutral-500 mb-3">
        Suggests a continuation based on what you've written so far in the editor.
      </p>
      <button
        onClick={suggest}
        disabled={loading}
        className="w-full rounded-lg bg-accent py-2 text-sm font-medium hover:bg-accent-light transition disabled:opacity-50"
      >
        {loading ? "Thinking…" : "Suggest next words"}
      </button>
      {suggestion && (
        <p className="mt-4 text-sm text-neutral-300 italic bg-neutral-900 rounded-lg p-3">{suggestion}</p>
      )}
    </div>
  );
}
