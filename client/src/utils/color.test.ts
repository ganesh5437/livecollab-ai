import { describe, it, expect } from "vitest";
import { colorForUser } from "./color";

describe("colorForUser", () => {
  it("returns the same color for the same user id every time", () => {
    const a = colorForUser("user-123");
    const b = colorForUser("user-123");
    expect(a).toBe(b);
  });

  it("returns a hex color string", () => {
    const color = colorForUser("user-abc");
    expect(color).toMatch(/^#[0-9a-f]{6}$/i);
  });

  it("distributes different ids across the palette", () => {
    const colors = new Set(
      ["user-1", "user-2", "user-3", "user-4", "user-5"].map(colorForUser)
    );
    // Not a strict uniqueness guarantee, but a hash worth its salt shouldn't
    // collapse 5 different ids onto a single color.
    expect(colors.size).toBeGreaterThan(1);
  });
});
