import { describe, it, expect } from "vitest";
import { registerSchema, loginSchema, createCommentSchema, createDocumentSchema } from "./validation";

describe("validation schemas", () => {
  it("accepts a valid registration payload", () => {
    const result = registerSchema.safeParse({
      email: "user@example.com",
      password: "longenough",
      name: "User",
    });
    expect(result.success).toBe(true);
  });

  it("rejects a password shorter than 8 characters", () => {
    const result = registerSchema.safeParse({
      email: "user@example.com",
      password: "short",
      name: "User",
    });
    expect(result.success).toBe(false);
  });

  it("rejects login with a missing password", () => {
    const result = loginSchema.safeParse({ email: "user@example.com" });
    expect(result.success).toBe(false);
  });

  it("requires fromPosition/toPosition on a comment", () => {
    const result = createCommentSchema.safeParse({ content: "hi" });
    expect(result.success).toBe(false);
  });

  it("accepts a document title without a folderId", () => {
    const result = createDocumentSchema.safeParse({ title: "My Doc" });
    expect(result.success).toBe(true);
  });
});
