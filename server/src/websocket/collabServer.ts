import { WebSocketServer, WebSocket } from "ws";
import { IncomingMessage } from "http";
import { Server } from "http";
import { URL } from "url";
import * as Y from "yjs";
const { setupWSConnection, docs } = require("y-websocket/bin/utils");

import { verifyAccessToken } from "../utils/tokens";
import { prisma } from "../config/prisma";
import { scheduleSnapshot } from "./snapshotManager";

async function authenticateConnection(req: IncomingMessage): Promise<{ userId: string; documentId: string } | null> {
  const url = new URL(req.url ?? "", "http://localhost");
  const token = url.searchParams.get("token");
  const documentId = url.pathname.replace("/collaboration/", "");

  if (!token || !documentId) return null;

  try {
    const payload = verifyAccessToken(token);

    const doc = await prisma.document.findUnique({ where: { id: documentId } });
    if (!doc) return null;

    if (doc.ownerId !== payload.userId) {
      const perm = await prisma.permission.findUnique({
        where: { documentId_userId: { documentId, userId: payload.userId } },
      });
      if (!perm) return null;
    }

    return { userId: payload.userId, documentId };
  } catch {
    return null;
  }
}

export function attachCollaborationServer(httpServer: Server) {
  const wss = new WebSocketServer({ noServer: true });

  httpServer.on("upgrade", async (req, socket, head) => {
    const url = new URL(req.url ?? "", "http://localhost");
    if (!url.pathname.startsWith("/collaboration/")) return;

    const auth = await authenticateConnection(req);
    if (!auth) {
      socket.write("HTTP/1.1 401 Unauthorized\r\n\r\n");
      socket.destroy();
      return;
    }

    wss.handleUpgrade(req, socket, head, (ws) => {
      wss.emit("connection", ws, req, auth);
    });
  });

  wss.on("connection", (ws: WebSocket, req: IncomingMessage, auth: { userId: string; documentId: string }) => {
    setupWSConnection(ws, req, { docName: auth.documentId, gc: true });

    const ydoc: Y.Doc = docs.get(auth.documentId);
    if (ydoc) {
      scheduleSnapshot(auth.documentId, ydoc, auth.userId);
    }
  });

  return wss;
}
