import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Logo } from "@/components/AppShell";
import { setState, getState, isAdminCreds } from "@/lib/store";

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
  const go = (e: React.FormEvent) => {
    e.preventDefault();
    if (isAdminCreds(email, pass)) { setState((s) => ({ ...s, admin: true })); nav({ to: "/admin" }); return; }
    const u = getState().users.find((x) => x.email === email.trim().toLowerCase() && x.password === pass);
    if (!u) return setErr("Wrong email or password");
    if (!u.active) return setErr("Account deactivated by admin");
    setState((s) => ({ ...s, user: u, seenIntro: true }));
    nav({ to: "/" });
  };
  return (
    <form onSubmit={go} className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-4 px-6">
      <Logo size="text-6xl" />
      <p className="mb-4 text-lg text-muted-foreground">Your security is our concern</p>
      <input className="field" type="email" placeholder="Official email" value={email} onChange={(e) => setEmail(e.target.value)} />
      <input className="field" type="password" placeholder="Password" value={pass} onChange={(e) => setPass(e.target.value)} />
      {err && <p className="font-semibold text-destructive">{err}</p>}
      <button className="btn-big">Login</button>
      <Link to="/register" className="py-2 text-center font-bold text-primary">Create new account</Link>
    </form>
  );
}
