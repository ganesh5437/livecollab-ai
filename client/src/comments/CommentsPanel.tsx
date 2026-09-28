import { useEffect, useState } from "react";
import { api } from "../services/api";

interface Comment {
  id: string;
  content: string;
  fromPosition: number;
  toPosition: number;
  resolved: boolean;
  parentCommentId: string | null;
  createdAt: string;
  author: { id: string; name: string };
}

interface CommentsPanelProps {
  documentId: string;
  selection: { from: number; to: number };
  onClose: () => void;
}

export default function CommentsPanel({ documentId, selection, onClose }: CommentsPanelProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [draft, setDraft] = useState("");
  const [replyDraft, setReplyDraft] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  async function refresh() {
    const res = await api.get(`/documents/${documentId}/comments`);
    setComments(await res.json());
  }

  useEffect(() => {
    refresh().finally(() => setLoading(false));
    // Live-updating: poll for new comments from other collaborators every 5s.
    const interval = setInterval(refresh, 5000);
    return () => clearInterval(interval);
  }, [documentId]);

  async function addComment() {
    if (!draft.trim()) return;
    await api.post(`/documents/${documentId}/comments`, {
      content: draft,
      fromPosition: selection.from,
      toPosition: selection.to,
    });
    setDraft("");
    refresh();
  }

  async function addReply(parentId: string) {
    const content = replyDraft[parentId];
    if (!content?.trim()) return;
    await api.post(`/documents/${documentId}/comments`, {
      content,
      fromPosition: selection.from,
      toPosition: selection.to,
      parentCommentId: parentId,
    });
    setReplyDraft((prev) => ({ ...prev, [parentId]: "" }));
    refresh();
  }

  async function toggleResolve(commentId: string, resolved: boolean) {
    await api.patch(`/documents/${documentId}/comments/${commentId}/resolve`, { resolved: !resolved });
    refresh();
  }

  const topLevel = comments.filter((c) => !c.parentCommentId);
  const repliesFor = (id: string) => comments.filter((c) => c.parentCommentId === id);

  return (
    <div className="fixed right-0 top-0 h-full w-96 border-l border-neutral-800 bg-neutral-950/95 backdrop-blur-xl shadow-2xl z-40 flex flex-col">
      <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-800">
        <h3 className="font-display font-semibold">Comments</h3>
        <button onClick={onClose} className="text-neutral-500 hover:text-neutral-200">
          ✕
        </button>
      </div>

      <div className="border-b border-neutral-800 p-4">
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={
            selection.from === selection.to
              ? "Select text in the doc, then comment on it…"
              : `Comment on selected text (${selection.from}-${selection.to})…`
          }
          rows={2}
          className="w-full rounded-lg bg-neutral-800 px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-accent resize-none"
        />
        <button
          onClick={addComment}
          className="mt-2 w-full rounded-lg bg-accent py-2 text-sm font-medium hover:bg-accent-light transition"
        >
          Comment
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {loading ? (
          <p className="text-neutral-500 text-sm">Loading…</p>
        ) : topLevel.length === 0 ? (
          <p className="text-neutral-500 text-sm">No comments yet.</p>
        ) : (
          topLevel.map((c) => (
            <div key={c.id} className={`rounded-lg border p-3 ${c.resolved ? "border-neutral-800 opacity-50" : "border-neutral-700"}`}>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-medium text-accent-light">{c.author.name}</p>
                  <p className="text-sm text-neutral-200 mt-0.5">{c.content}</p>
                  <p className="text-xs text-neutral-500 mt-1">
                    on text [{c.fromPosition}-{c.toPosition}] · {new Date(c.createdAt).toLocaleTimeString()}
                  </p>
                </div>
                <button
                  onClick={() => toggleResolve(c.id, c.resolved)}
                  className="text-xs text-neutral-500 hover:text-accent-light shrink-0 ml-2"
                >
                  {c.resolved ? "Reopen" : "Resolve"}
                </button>
              </div>

              {repliesFor(c.id).map((r) => (
                <div key={r.id} className="mt-2 ml-3 pl-3 border-l border-neutral-800">
                  <p className="text-xs font-medium text-accent-light">{r.author.name}</p>
                  <p className="text-sm text-neutral-300">{r.content}</p>
                </div>
              ))}

              <div className="mt-2 flex gap-2">
                <input
                  value={replyDraft[c.id] ?? ""}
                  onChange={(e) => setReplyDraft((prev) => ({ ...prev, [c.id]: e.target.value }))}
                  placeholder="Reply…"
                  className="flex-1 rounded-md bg-neutral-800 px-2 py-1 text-xs outline-none focus-visible:ring-2 focus-visible:ring-accent"
                />
                <button
                  onClick={() => addReply(c.id)}
                  className="text-xs text-accent-light hover:text-accent shrink-0"
                >
                  Reply
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
