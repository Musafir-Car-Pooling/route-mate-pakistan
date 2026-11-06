import { useEffect, useMemo, useState } from "react";
import { useStore, type ChatMessage, type Unlock } from "@/lib/store";

const KEY = "travelsync-chat-read";
const EVT = "travelsync-chat-read";

export function readMap(uid: string): Record<string, number> {
  try { return JSON.parse(localStorage.getItem(`${KEY}:${uid}`) || "{}"); } catch { return {}; }
}
export function markChatRead(uid: string, chatId: string, at = Date.now()) {
  const m = readMap(uid);
  if ((m[chatId] ?? 0) >= at) return;
  m[chatId] = at;
  try { localStorage.setItem(`${KEY}:${uid}`, JSON.stringify(m)); } catch { /* quota */ }
  window.dispatchEvent(new Event(EVT));
}

/** Messages from the other person newer than my last read time. */
export function unreadCount(me: string, msgs: ChatMessage[], lastRead = 0) {
  return msgs.filter((m) => m.from !== me && m.at > lastRead).length;
}

/** All my chat threads (paid by me, or opened with me) with live unread counts. */
export function useChatInbox() {
  const user = useStore((s) => s.user);
  const unlocks = useStore((s) => s.unlocks);
  const mine = useMemo(() => unlocks.filter((u) => u.kind === "chat" && u.status === "unlocked"), [unlocks]);
  const [incoming, setIncoming] = useState<Unlock[]>([]);
  const [msgs, setMsgs] = useState<Record<string, ChatMessage[]>>({});
  const [reads, setReads] = useState<Record<string, number>>({});
  const uid = user?.id;

  useEffect(() => {
    if (!uid) return;
    const sync = () => setReads(readMap(uid));
    sync();
    window.addEventListener(EVT, sync);
    window.addEventListener("storage", sync);
    return () => { window.removeEventListener(EVT, sync); window.removeEventListener("storage", sync); };
  }, [uid]);

  useEffect(() => {
    if (!uid) return;
    let stop = () => {};
    let dead = false;
    void import("@/lib/cloud").then((c) => { if (!dead) stop = c.watchIncomingChats(uid, setIncoming); });
    return () => { dead = true; stop(); };
  }, [uid]);

  const threads = useMemo(() => {
    const all = new Map<string, Unlock>();
    for (const u of [...mine, ...incoming]) all.set(u.id, u);
    return [...all.values()];
  }, [mine, incoming]);
  const ids = threads.map((t) => t.id).sort().join(",");

  useEffect(() => {
    if (!uid || !ids) return;
    const stops: (() => void)[] = [];
    let dead = false;
    const seen = new Map<string, number>();
    void import("@/lib/cloud").then((c) => {
      if (dead) return;
      for (const id of ids.split(",")) {
        stops.push(c.watchChat(id, (m) => {
          setMsgs((s) => ({ ...s, [id]: m }));
          void c.markChatSeen(id, m, "deliveredAt");
          const last = m[m.length - 1];
          const prev = seen.get(id);
          seen.set(id, m.length);
          // Alert on a newly arrived message from the other person while not looking at that chat.
          if (prev !== undefined && m.length > prev && last && last.from !== uid
            && !location.pathname.endsWith(`/chat/${id}`)
            && typeof Notification !== "undefined" && Notification.permission === "granted") {
            try { new Notification("New message — Travel Sync", { body: last.text.slice(0, 120), icon: "/icon-192.png", tag: id }); } catch { /* mobile needs SW */ }
          }
        }, () => {}));
      }
    });
    return () => { dead = true; stops.forEach((s) => s()); };
  }, [uid, ids]);

  const unread: Record<string, number> = {};
  let total = 0;
  if (uid) for (const t of threads) { const n = unreadCount(uid, msgs[t.id] ?? [], reads[t.id]); unread[t.id] = n; total += n; }
  return { threads: [...threads].sort((a, b) => b.at - a.at), unread, total, msgs };
}

export type Tick = "sent" | "delivered" | "read";
export function tickState(m: Pick<ChatMessage, "deliveredAt" | "readAt">): Tick {
  return m.readAt ? "read" : m.deliveredAt ? "delivered" : "sent";
}
