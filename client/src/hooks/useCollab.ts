import { useEffect, useMemo, useState } from "react";
import * as Y from "yjs";
import { WebsocketProvider } from "y-websocket";
import { colorForUser } from "../utils/color";

const WS_URL = import.meta.env.VITE_WS_URL;

export interface PresenceUser {
  userId: string;
  name: string;
  color: string;
}

export function useCollab(documentId: string, accessToken: string, user: { id: string; name: string }) {
  const ydoc = useMemo(() => new Y.Doc(), [documentId]);
  const [provider, setProvider] = useState<WebsocketProvider | null>(null);
  const [connected, setConnected] = useState(false);
  const [synced, setSynced] = useState(false);
  const [peers, setPeers] = useState<PresenceUser[]>([]);

  useEffect(() => {
    const wsProvider = new WebsocketProvider(WS_URL, `collaboration/${documentId}`, ydoc, {
      params: { token: accessToken },
    });

    wsProvider.awareness.setLocalStateField("user", {
      userId: user.id,
      name: user.name,
      color: colorForUser(user.id),
    });

    wsProvider.on("status", ({ status }: { status: string }) => setConnected(status === "connected"));
    wsProvider.on("sync", (isSynced: boolean) => setSynced(isSynced));

    const onAwarenessChange = () => {
      const states = Array.from(wsProvider.awareness.getStates().values());
// eslint-disable-next-line @typescript-eslint/no-explicit-any
      setPeers(states.map((s: any) => s.user).filter(Boolean));
    };
    wsProvider.awareness.on("change", onAwarenessChange);

    setProvider(wsProvider);

    return () => {
      wsProvider.awareness.off("change", onAwarenessChange);
      wsProvider.destroy();
      ydoc.destroy();
    };
  }, [documentId, accessToken, ydoc, user.id, user.name]);

  return { ydoc, provider, connected, synced, peers };
}
