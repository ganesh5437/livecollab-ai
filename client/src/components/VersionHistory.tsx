import { useEffect, useState } from "react";
import { api } from "../services/api";

interface Version {
  id: string;
  versionNumber: number;
  description: string | null;
  createdAt: string;
  createdBy: { name: string };
}

interface VersionHistoryProps {
  documentId: string;
  onClose: () => void;
  onRolledBack: () => void;
}

export default function VersionHistory({ documentId, onClose, onRolledBack }: VersionHistoryProps) {
  const [versions, setVersions] = useState<Version[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get(`/documents/${documentId}/versions`)
      .then((res) => res.json())
      .then(setVersions)
      .finally(() => setLoading(false));
  }, [documentId]);

  async function rollback(versionId: string) {
    const res = await api.post(`/documents/${documentId}/versions/${versionId}/rollback`);
    if (res.ok) {
      onRolledBack();
      onClose();
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-6">
      <div className="w-full max-w-md max-h-[70vh] overflow-y-auto rounded-xl border border-neutral-800 bg-neutral-900 p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-display text-lg font-semibold">Version history</h3>
          <button onClick={onClose} className="text-neutral-500 hover:text-neutral-200">
            ✕
          </button>
        </div>

        {loading ? (
          <p className="text-neutral-500 text-sm">Loading…</p>
        ) : versions.length === 0 ? (
          <p className="text-neutral-500 text-sm">No versions saved yet.</p>
        ) : (
          <div className="space-y-2">
            {versions.map((v) => (
              <div
                key={v.id}
                className="flex items-center justify-between rounded-lg border border-neutral-800 px-4 py-3"
              >
                <div>
                  <div className="text-sm font-medium">
                    v{v.versionNumber} — {v.description ?? "Autosave"}
                  </div>
                  <div className="text-xs text-neutral-500">
                    {v.createdBy.name} · {new Date(v.createdAt).toLocaleString()}
                  </div>
                </div>
                <button
                  onClick={() => rollback(v.id)}
                  className="text-xs rounded-md border border-neutral-700 px-3 py-1.5 hover:border-accent hover:text-accent-light transition"
                >
                  Restore
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
