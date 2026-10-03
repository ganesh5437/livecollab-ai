import { Request, Response, NextFunction } from "express";
import { registerSchema, loginSchema } from "../utils/validation";
import * as authService from "../services/auth.service";
import { prisma } from "../config/prisma";
import { AuthedRequest } from "../middleware/requireAuth";
import { env } from "../config/env";

const REFRESH_COOKIE_OPTS = {
  httpOnly: true,
  // In production the client (Vercel) and API (Render) are on different domains,
  // so the refresh cookie must be SameSite=None + Secure to be sent cross-site.
  secure: env.NODE_ENV === "production",
  sameSite: (env.NODE_ENV === "production" ? "none" : "lax") as "none" | "lax",
  path: "/auth",
  maxAge: 30 * 24 * 60 * 60 * 1000,
};

export async function register(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, password, name } = registerSchema.parse(req.body);
    const { accessToken, refreshToken } = await authService.registerUser(email, password, name);
    res.cookie("refreshToken", refreshToken, REFRESH_COOKIE_OPTS);
    res.status(201).json({ accessToken });
  } catch (err) {
    next(err);
  }
}

export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, password } = loginSchema.parse(req.body);
    const { accessToken, refreshToken } = await authService.loginUser(email, password);
    res.cookie("refreshToken", refreshToken, REFRESH_COOKIE_OPTS);
    res.json({ accessToken });
  } catch (err) {
    next(err);
  }
}

export async function refresh(req: Request, res: Response, next: NextFunction) {
  try {
    const oldToken = req.cookies?.refreshToken;
    if (!oldToken) return res.status(401).json({ error: "Missing refresh token" });

    const { accessToken, refreshToken } = await authService.rotateRefreshToken(oldToken);
    res.cookie("refreshToken", refreshToken, REFRESH_COOKIE_OPTS);
    res.json({ accessToken });
  } catch (err) {
    next(err);
  }
}

export async function logout(req: Request, res: Response, next: NextFunction) {
  try {
    const token = req.cookies?.refreshToken;
    if (token) await authService.revokeRefreshToken(token);
    res.clearCookie("refreshToken", { path: "/auth" });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

export async function me(req: AuthedRequest, res: Response, next: NextFunction) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      select: { id: true, email: true, name: true, avatarUrl: true, createdAt: true },
    });
    res.json(user);
  } catch (err) {
    next(err);
  }
}
