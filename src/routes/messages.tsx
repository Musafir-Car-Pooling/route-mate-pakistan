import { createFileRoute, Link } from "@tanstack/react-router";
import { MessageCircle } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { useStore } from "@/lib/store";
import { useChatInbox } from "@/lib/chat-unread";

export const Route = createFileRoute("/messages")({
  head: () => ({
    meta: [
      { title: "Messages — Travel Sync" },
      { name: "description", content: "Your private in-app chats with route mates." },
      { property: "og:title", content: "Messages — Travel Sync" },
      { property: "og:description", content: "Private chats on Travel Sync." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Messages,
});

function Messages() {
  const user = useStore((s) => s.user);
  const { threads, unread, msgs } = useChatInbox();
  return (
    <AppShell back title="Messages">
      {!threads.length && <p className="py-8 text-center text-muted-foreground">No chats yet. Chats open after a contact payment with a member who hides their number.</p>}
      <div className="space-y-2">
        {threads.map((u) => {
          const last = msgs[u.id]?.at(-1);
          const n = unread[u.id] ?? 0;
          return (
            <Link key={u.id} to="/chat/$id" params={{ id: u.id }} className="card-box flex items-center gap-3 p-4">
              <MessageCircle className="shrink-0 text-primary" />
              <span className="min-w-0 flex-1">
                <span className="block text-lg font-bold">{u.userId === user?.id ? u.memberName ?? "Member" : u.payerName ?? "Member"}</span>
                {last && <span className={`block truncate text-sm ${n ? "font-semibold" : "text-muted-foreground"}`}>{last.text}</span>}
              </span>
              {n > 0 && <span className="grid h-6 min-w-6 place-items-center rounded-full bg-destructive px-1 text-xs font-bold text-destructive-foreground">{n}</span>}
            </Link>
          );
        })}
      </div>
    </AppShell>
  );
}
