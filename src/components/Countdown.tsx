import { useEffect, useState } from "react";
import { useStore, expiresAt, type Post } from "@/lib/store";

export function Countdown({ post }: { post: Post }) {
  const settings = useStore((s) => s.settings);
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(t); }, []);
  if (!settings.autoCancel) return <span>No expiry</span>;
  const ms = Math.max(0, expiresAt(post, settings) - now);
  const h = Math.floor(ms / 3600_000), m = Math.floor((ms % 3600_000) / 60_000), s = Math.floor((ms % 60_000) / 1000);
  return <span className="tabular-nums">{String(h).padStart(2, "0")}:{String(m).padStart(2, "0")}:{String(s).padStart(2, "0")}</span>;
}
