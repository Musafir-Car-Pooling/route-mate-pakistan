import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { MessageCircle } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { useStore, type Unlock } from "@/lib/store";

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
  const mine = useStore((s) => s.unlocks.filter((u) => u.kind === "chat" && u.status === "unlocked"));
  const [incoming, setIncoming] = useState<Unlock[]>([]);
  useEffect(() => {
    if (!user) return;
    let stop = () => {};
    void import("@/lib/cloud").then((c) => { stop = c.watchIncomingChats(user.id, setIncoming); });
    return () => stop();
  }, [user]);
  const list = [...mine, ...incoming].sort((a, b) => b.at - a.at);
  return (
    <AppShell back title="Messages">
      {!list.length && <p className="py-8 text-center text-muted-foreground">No chats yet. Chats open after a contact payment with a member who hides their number.</p>}
      <div className="space-y-2">
        {list.map((u) => (
          <Link key={u.id} to="/chat/$id" params={{ id: u.id }} className="card-box flex items-center gap-3 p-4">
            <MessageCircle className="text-primary" />
            <span className="text-lg font-bold">{u.userId === user?.id ? u.memberName ?? "Member" : u.payerName ?? "Member"}</span>
          </Link>
        ))}
      </div>
    </AppShell>
  );
}
