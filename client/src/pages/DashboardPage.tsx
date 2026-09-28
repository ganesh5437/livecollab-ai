import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../services/api";
import { useAuthStore } from "../store/authStore";
import NotificationsBell from "../components/NotificationsBell";

interface DocSummary {
  id: string;
  title: string;
  updatedAt: string;
}

export default function DashboardPage() {
  const [docs, setDocs] = useState<DocSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  useEffect(() => {
    api
      .get("/documents")
      .then((res) => res.json())
      .then(setDocs)
      .finally(() => setLoading(false));
  }, []);

  async function createDocument() {
    const res = await api.post("/documents", { title: "Untitled Document" });
    const doc = await res.json();
    navigate(`/documents/${doc.id}`);
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 px-6 py-8">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="font-display text-2xl font-semibold">
            {user ? `${user.name}'s Documents` : "Documents"}
          </h1>
          <div className="flex items-center gap-3">
            <NotificationsBell />
            <button
              onClick={createDocument}
              className="rounded-lg bg-accent px-4 py-2 text-sm font-medium hover:bg-accent-light transition"
            >
              + New Document
            </button>
            <button
              onClick={logout}
              className="rounded-lg border border-neutral-800 px-4 py-2 text-sm text-neutral-400 hover:text-neutral-100 transition"
            >
              Sign out
            </button>
          </div>
        </div>

        {loading ? (
          <p className="text-neutral-500">Loading…</p>
        ) : docs.length === 0 ? (
          <p className="text-neutral-500">
            No documents yet — click "New Document" to create your first one.
          </p>
        ) : (
          <div className="grid gap-3">
            {docs.map((doc) => (
              <button
                key={doc.id}
                onClick={() => navigate(`/documents/${doc.id}`)}
                className="text-left rounded-xl border border-neutral-800 bg-neutral-900/40 px-5 py-4 hover:border-accent/50 hover:bg-neutral-900/70 transition"
              >
                <div className="font-medium">{doc.title}</div>
                <div className="text-xs text-neutral-500 mt-1">
                  Updated {new Date(doc.updatedAt).toLocaleString()}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
