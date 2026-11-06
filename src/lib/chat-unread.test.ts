import { describe, it, expect } from "vitest";
import { unreadCount } from "./chat-unread";

const msgs = [
  { id: "1", from: "a", text: "hi", at: 100 },
  { id: "2", from: "b", text: "hello", at: 200 },
  { id: "3", from: "a", text: "where?", at: 300 },
];

describe("chat unread", () => {
  it("counts only the other person's messages", () => expect(unreadCount("b", msgs)).toBe(2));
  it("drops to 0 after reading the latest message", () => expect(unreadCount("b", msgs, 300)).toBe(0));
});
