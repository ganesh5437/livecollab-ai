import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";

// In-memory fake of the Prisma calls auth.service.ts needs, so these tests
// run without a real Postgres connection (useful for CI).
const users = new Map<string, any>();
const refreshTokens = new Map<string, any>();

vi.mock("../config/prisma", () => ({
  prisma: {
    user: {
      findUnique: vi.fn(async ({ where }: any) => users.get(where.email ?? where.id) ?? null),
      create: vi.fn(async ({ data }: any) => {
        const user = { id: `user-${users.size + 1}`, ...data };
        users.set(user.email, user);
        users.set(user.id, user);
        return user;
      }),
    },
    refreshToken: {
      create: vi.fn(async ({ data }: any) => {
        refreshTokens.set(data.token, data);
        return data;
      }),
      findUnique: vi.fn(async ({ where }: any) => refreshTokens.get(where.token) ?? null),
      delete: vi.fn(async () => {}),
      deleteMany: vi.fn(async () => {}),
    },
  },
}));

import { createApp } from "../app";

describe("auth routes", () => {
  const app = createApp();

  beforeEach(() => {
    users.clear();
    refreshTokens.clear();
  });

  it("registers a new user and returns an access token", async () => {
    const res = await request(app)
      .post("/auth/register")
      .send({ email: "test@example.com", password: "password123", name: "Test User" });

    expect(res.status).toBe(201);
    expect(res.body.accessToken).toBeDefined();
    expect(res.headers["set-cookie"]).toBeDefined();
  });

  it("rejects registration with an invalid email", async () => {
    const res = await request(app)
      .post("/auth/register")
      .send({ email: "not-an-email", password: "password123", name: "Test User" });

    expect(res.status).toBe(422);
  });

  it("rejects login with wrong password", async () => {
    await request(app)
      .post("/auth/register")
      .send({ email: "test2@example.com", password: "correctpassword", name: "Test User 2" });

    const res = await request(app)
      .post("/auth/login")
      .send({ email: "test2@example.com", password: "wrongpassword" });

    expect(res.status).toBe(401);
  });

  it("rejects /auth/me without an access token", async () => {
    const res = await request(app).get("/auth/me");
    expect(res.status).toBe(401);
  });
});
