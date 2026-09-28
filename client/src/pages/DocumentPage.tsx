import { useState } from "react";
import { useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuthStore } from "../store/authStore";
import { useCollab } from "../hooks/useCollab";
import Editor from "../editor/Editor";
import PresenceAvatars from "../collaboration/PresenceAvatars";
import ShareModal from "../components/ShareModal";
import VersionHistory from "../components/VersionHistory";
import AiPanel from "../ai/AiPanel";
import CommentsPanel from "../comments/CommentsPanel";
import NotificationsBell from "../components/NotificationsBell";

export default function DocumentPage() {
  const { id } = useParams<{ id: string }>();
  const user = useAuthStore((s) => s.user);
  const accessToken = useAuthStore((s) => s.accessToken);
  const [showShare, setShowShare] = useState(false);
  const [showVersions, setShowVersions] = useState(false);
  const [showAi, setShowAi] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [editorText, setEditorText] = useState("");
  const [selection, setSelection] = useState({ from: 0, to: 0 });

  const ready = Boolean(id && user && accessToken);

  const { ydoc, provider, connected, synced, peers } = useCollab(
    id ?? "pending",
    accessToken ?? "",
    { id: user?.id ?? "pending", name: user?.name ?? "" }
  );

  if (!ready) return null;

  const panelOpen = showAi || showComments;

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 px-6 py-8">
      <div className={`mx-auto max-w-4xl transition-all ${panelOpen ? "mr-96" : ""}`}>
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span
              className={`h-2 w-2 rounded-full ${connected ? "bg-emerald-400" : "bg-neutral-600"}`}
            />
            <span className="text-sm text-neutral-400">
              {connected ? (synced ? "Synced" : "Syncing…") : "Connecting…"}
            </span>
            {synced && (
              <motion.span
                key={Date.now()}
                initial={{ opacity: 0.6, scale: 0.9 }}
                animate={{ opacity: 0, scale: 1.4 }}
                transition={{ duration: 0.6 }}
                className="h-2 w-2 rounded-full bg-emerald-400"
              />
            )}
          </div>
          <div className="flex items-center gap-3">
            <NotificationsBell />
            <button
              onClick={() => {
                setShowComments(true);
                setShowAi(false);
              }}
              className="text-sm rounded-lg bg-neutral-800 px-3 py-1.5 hover:bg-neutral-700 transition"
            >
              💬 Comments
            </button>
            <button
              onClick={() => {
                setShowAi(true);
                setShowComments(false);
              }}
              className="text-sm rounded-lg bg-accent/20 text-accent-light px-3 py-1.5 hover:bg-accent/30 transition"
            >
              ✨ AI
            </button>
            <button
              onClick={() => setShowVersions(true)}
              className="text-sm text-neutral-400 hover:text-neutral-100 transition"
            >
              History
            </button>
            <button
              onClick={() => setShowShare(true)}
              className="text-sm rounded-lg border border-neutral-700 px-3 py-1.5 hover:border-accent hover:text-accent-light transition"
            >
              Share
            </button>
            <PresenceAvatars peers={peers} />
          </div>
        </div>

        {provider && (
          <Editor
            ydoc={ydoc}
            provider={provider}
            onTextChange={setEditorText}
            onSelectionChange={setSelection}
          />
        )}
      </div>

      {showShare && id && <ShareModal documentId={id} onClose={() => setShowShare(false)} />}
      {showVersions && id && (
        <VersionHistory
          documentId={id}
          onClose={() => setShowVersions(false)}
          onRolledBack={() => window.location.reload()}
        />
      )}
      {showAi && id && (
        <AiPanel documentId={id} editorText={editorText} onClose={() => setShowAi(false)} />
      )}
      {showComments && id && (
        <CommentsPanel documentId={id} selection={selection} onClose={() => setShowComments(false)} />
      )}
    </div>
  );
}
