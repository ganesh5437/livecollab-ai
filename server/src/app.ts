import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import pinoHttp from "pino-http";
import { randomUUID } from "crypto";
import { env } from "./config/env";
import { errorHandler } from "./middleware/errorHandler";
import authRoutes from "./routes/auth.routes";
import healthRoutes from "./routes/health.routes";
import documentRoutes from "./routes/document.routes";
import folderRoutes from "./routes/folder.routes";
import notificationRoutes from "./routes/notification.routes";

export function createApp() {
  const app = express();

  // Render/Vercel sit behind a proxy; trust it so client IPs (rate limiting) and HTTPS are read correctly.
  app.set("trust proxy", 1);

  app.use(
    pinoHttp({
      genReqId: (req) => (req.headers["x-request-id"] as string) ?? randomUUID(),
    })
  );
  app.use(
    cors({
      origin: env.CORS_ORIGIN,
      credentials: true,
    })
  );
  app.use(express.json());
  app.use(cookieParser());

  app.use("/", healthRoutes);
  app.use("/auth", authRoutes);
  app.use("/documents", documentRoutes);
  app.use("/folders", folderRoutes);
  app.use("/notifications", notificationRoutes);

  app.use((req, res) => {
    res.status(404).json({ error: "Not found" });
  });

  app.use(errorHandler);

  return app;
}
