import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { PasswordInput } from "@/components/PasswordInput";
import { AuthLogo } from "@/components/AppShell";
import { getState, isAdminCreds } from "@/lib/store";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Login — Travel Sync" },
      { name: "description", content: "Log in to your verified Travel Sync account." },
      { property: "og:title", content: "Login — Travel Sync" },
      { property: "og:description", content: "Log in to Travel Sync." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Login,
});

function Login() {
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [err, setErr] = useState("");
  const nav = useNavigate();
  const [busy, setBusy] = useState(false);
  const go = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(""); setBusy(true);
    try {
      const { signIn } = await import("@/lib/cloud");
      await signIn(email, pass);
      const s = getState();
      if (s.admin) { nav({ to: "/admin" }); return; }
      if (!s.user) { setErr("Account not found or deactivated by admin"); return; }
      nav({ to: "/" });
    } catch { setErr("Wrong email or password"); }
    finally { setBusy(false); }
  };
  return (
    <form onSubmit={go} className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-4 px-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="pb-4"><AuthLogo imgSize="h-24 w-24" textSize="text-6xl" animated /></div>
      <input className="field" type="email" placeholder="Official email" value={email} onChange={(e) => setEmail(e.target.value)} />
      <PasswordInput placeholder="Password" value={pass} onChange={(e) => setPass(e.target.value)} />
      {err && <p className="font-semibold text-destructive">{err}</p>}
      <button className="btn-big" disabled={busy}>{busy ? "Logging in…" : "Login"}</button>
      <Link to="/register" className="py-2 text-center font-bold text-primary">Create new account</Link>
    </form>
  );
}
