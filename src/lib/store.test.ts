import { describe, it, expect } from "vitest";
import { isAdminCreds, validPassword, formatPKR, isExpired, validOfficialEmail, type Post, getState } from "./store";

describe("travel sync rules", () => {
  it("admin creds", () => { expect(isAdminCreds("pp@gmail.com", "ppllmm")).toBe(true); expect(isAdminCreds("pp@gmail.com", "x")).toBe(false); });
  it("password min 6 alphanumeric", () => { expect(validPassword("abc12")).toBe(false); expect(validPassword("abc123")).toBe(true); });
  it("PKR format", () => expect(formatPKR(8500)).toBe("PKR 8,500"));
  it("student needs edu.pk", () => { expect(validOfficialEmail("a@lums.edu.pk", "student")).toBe(true); expect(validOfficialEmail("a@gmail.com", "jobian")).toBe(false); });
  it("expires after 24h", () => {
    const s = getState().settings;
    const p = { createdAt: 0 } as Post;
    expect(isExpired(p, s, 23 * 3600_000)).toBe(false);
    expect(isExpired(p, s, 25 * 3600_000)).toBe(true);
  });
});
