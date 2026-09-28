import { useState, FormEvent } from "react";
import { api } from "../services/api";

interface ShareModalProps {
  documentId: string;
  onClose: () => void;
}

export default function ShareModal({ documentId, onClose }: ShareModalProps) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"EDITOR" | "VIEWER">("EDITOR");
  const [status, setStatus] = useState<string | null>(null);

  async function handleShare(e: FormEvent) {
    e.preventDefault();
    setStatus(null);
    const res = await api.post(`/documents/${documentId}/share`, { email, role });
    if (res.ok) {
      setStatus(`Shared with ${email} as ${role.toLowerCase()}`);
      setEmail("");
    } else {
      const body = await res.json();
      setStatus(body.error ?? "Could not share document");
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-6">
      <div className="w-full max-w-sm rounded-xl border border-neutral-800 bg-neutral-900 p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-display text-lg font-semibold">Share document</h3>
          <button onClick={onClose} className="text-neutral-500 hover:text-neutral-200">
            ✕
          </button>
        </div>

        <form onSubmit={handleShare}>
          <input
            type="email"
            required
            placeholder="Person's email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full mb-3 rounded-lg bg-neutral-800 px-4 py-2 outline-none focus-visible:ring-2 focus-visible:ring-accent"
          />
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as "EDITOR" | "VIEWER")}
            className="w-full mb-4 rounded-lg bg-neutral-800 px-4 py-2 outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            <option value="EDITOR">Can edit</option>
            <option value="VIEWER">Can view</option>
          </select>

          {status && <p className="mb-3 text-sm text-neutral-400">{status}</p>}

          <button
            type="submit"
            className="w-full rounded-lg bg-accent py-2 font-medium hover:bg-accent-light transition"
          >
            Share
          </button>
        </form>
      </div>
    </div>
  );
}
