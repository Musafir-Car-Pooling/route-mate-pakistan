import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Send, Lock, Check, CheckCheck, Clock } from "lucide-react";
import { tickState } from "@/lib/chat-unread";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { useStore, type ChatMessage, type Unlock } from "@/lib/store";

export const Route = createFileRoute("/chat/$id")({
  head: () => ({
    meta: [
      { title: "Chat — Travel Sync" },
      { name: "description", content: "Private in-app chat with your route mate." },
      { property: "og:title", content: "Chat — Travel Sync" },
      { property: "og:description", content: "Chat with a verified route mate without sharing numbers." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ChatPage,
});

function ChatPage() {
  const { id } = Route.useParams();
  const user = useStore((s) => s.user);
  const mine = useStore((s) => s.unlocks.find((u) => u.id === id));
  const [incoming, setIncoming] = useState<Unlock>();
  const [msgs, setMsgs] = useState<ChatMessage[]>([]);
  const [text, setText] = useState("");
  const [pending, setPending] = useState<string[]>([]);
  const [err, setErr] = useState("");
  const end = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user || mine) return;
    let stop = () => {};
    void import("@/lib/cloud").then((c) => { stop = c.watchIncomingChats(user.id, (l) => setIncoming(l.find((u) => u.id === id))); });
    return () => stop();
  }, [user, mine, id]);
  useEffect(() => {
    if (!user) return;
    let stop = () => {};
    void import("@/lib/cloud").then((c) => { stop = c.watchChat(id, (m) => { setMsgs(m); setErr(""); void c.markChatSeen(id, m, "readAt"); }, () => setErr("Chat is not available yet.")); });
    return () => stop();
  }, [user, id]);
  useEffect(() => {
    end.current?.scrollIntoView({ block: "end" });
    const last = msgs[msgs.length - 1];
    if (user && last) void import("@/lib/chat-unread").then((c) => c.markChatRead(user.id, id, last.at));
  }, [msgs.length, user, id]);

  const thread = mine ?? incoming;
  const other = !thread ? "Chat" : thread.userId === user?.id ? thread.memberName ?? "Member" : thread.payerName ?? "Member";
  const send = async () => {
    const t = text.trim();
    if (!t) return;
    setText("");
    setPending((p) => [...p, t]);
    try { const { sendChat } = await import("@/lib/cloud"); await sendChat(id, t); }
    catch { setErr("Message not sent. Try again."); setText(t); }
    finally { setPending((p) => { const i = p.indexOf(t); return i < 0 ? p : [...p.slice(0, i), ...p.slice(i + 1)]; }); }
  };

  return (
    <AppShell back title={other}>
      <p className="flex items-center gap-2 rounded-lg bg-secondary p-3 text-xs text-muted-foreground"><Lock className="size-4 shrink-0" />Numbers stay hidden. Only you and {other} can read this chat.</p>
      <div className="mt-3 min-h-[50vh] space-y-2 pb-28">
        {!msgs.length && !err && <p className="py-8 text-center text-sm text-muted-foreground">Say hello and agree pickup point and timing.</p>}
        {msgs.map((m) => (
          <div key={m.id} className={`flex ${m.from === user?.id ? "justify-end" : "justify-start"}`}>
            <p className={`max-w-[80%] whitespace-pre-wrap break-words rounded-2xl px-4 py-2 ${m.from === user?.id ? "bg-chat-out text-chat-out-foreground" : "bg-chat-in text-chat-out-foreground"}`}>
              {m.text}
              <span className="mt-1 flex items-center justify-end gap-1 text-[10px]"><span className="opacity-70">{new Date(m.at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>{m.from === user?.id && <Ticks t={tickState(m)} />}</span>
            </p>
          </div>
        ))}
        {pending.map((t, i) => (
          <div key={"p" + i} className="flex justify-end">
            <p className="max-w-[80%] whitespace-pre-wrap break-words rounded-2xl bg-chat-out px-4 py-2 text-chat-out-foreground opacity-80">{t}<span className="mt-1 flex justify-end"><Clock className="size-3" aria-label="Sending" /></span></p>
          </div>
        ))}
        <div ref={end} />
      </div>
      <form onSubmit={(e) => { e.preventDefault(); void send(); }} className="fixed inset-x-0 bottom-0 mx-auto flex max-w-md gap-2 border-t bg-background p-3">
        {err && <p role="alert" className="absolute -top-7 left-3 text-xs font-semibold text-destructive">{err}</p>}
        <input className="field" placeholder="Type a message" aria-label="Message" value={text} maxLength={1000} onChange={(e) => setText(e.target.value)} />
        <Button type="submit" size="icon" className="h-auto w-14 shrink-0" aria-label="Send" disabled={!text.trim()}><Send /></Button>
      </form>
    </AppShell>
  );
}

function Ticks({ t }: { t: "sent" | "delivered" | "read" }) {
  if (t === "sent") return <Check className="size-3.5 opacity-70" aria-label="Sent" />;
  return <CheckCheck className={`size-3.5 ${t === "read" ? "text-chat-tick-read" : "opacity-70"}`} aria-label={t === "read" ? "Read" : "Delivered"} />;
}
