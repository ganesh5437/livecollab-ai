import { useEffect, useState } from "react";
import { api } from "../services/api";

interface Notification {
  id: string;
  type: string;
  message: string;
  read: boolean;
  createdAt: string;
  documentId: string | null;
}

const TYPE_ICON: Record<string, string> = {
  DOCUMENT_SHARED: "🔗",
  COMMENT_ADDED: "💬",
  COMMENT_REPLY: "↩️",
  MENTION: "📣",
  DOCUMENT_EDITED: "✏️",
  PERMISSION_CHANGED: "🔐",
  AI_TASK_COMPLETED: "✨",
};

export default function NotificationsBell() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unread, setUnread] = useState(0);

  async function refresh() {
    const res = await api.get("/notifications");
    if (!res.ok) return;
    const data = await res.json();
    setNotifications(data.notifications);
    setUnread(data.unread);
  }

  useEffect(() => {
    refresh();
    // Polling stand-in for real-time push — cheap and reliable for a Phase 5 baseline.
    const interval = setInterval(refresh, 15000);
    return () => clearInterval(interval);
  }, []);

  async function openPanel() {
    setOpen((prev) => !prev);
    if (!open && unread > 0) {
      await api.post("/notifications/read-all");
      setUnread(0);
      refresh();
    }
  }

  return (
    <div className="relative">
      <button onClick={openPanel} className="relative text-xl">
        🔔
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-accent text-[10px] flex items-center justify-center font-medium">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 max-h-96 overflow-y-auto rounded-xl border border-neutral-800 bg-neutral-900 shadow-xl z-50">
          <div className="px-4 py-3 border-b border-neutral-800 font-medium text-sm">Notifications</div>
          {notifications.length === 0 ? (
            <p className="p-4 text-sm text-neutral-500">No notifications yet.</p>
          ) : (
            notifications.map((n) => (
              <div key={n.id} className="px-4 py-3 border-b border-neutral-800 last:border-0 text-sm">
                <span className="mr-2">{TYPE_ICON[n.type] ?? "🔔"}</span>
                {n.message}
                <div className="text-xs text-neutral-500 mt-1">
                  {new Date(n.createdAt).toLocaleString()}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
