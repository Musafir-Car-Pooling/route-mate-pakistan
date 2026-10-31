import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { BadgeCheck } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { PasswordInput } from "@/components/PasswordInput";
import { ProfileSelections } from "@/components/ProfileSelections";
import { useStore, setState, validPassword } from "@/lib/store";

export const Route = createFileRoute("/account")({
  head: () => ({
    meta: [
      { title: "My Account — Travel Sync" },
      { name: "description", content: "Profile, security and privacy settings." },
      { property: "og:title", content: "My Account — Travel Sync" },
      { property: "og:description", content: "Manage your Travel Sync profile." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Account,
});

function Account() {
  const user = useStore((s) => s.user);
  const [cur, setCur] = useState(""); const [np, setNp] = useState(""); const [msg, setMsg] = useState("");
  if (!user) return <AppShell back title="Account"><Link to="/login" className="btn-big mt-10">Login</Link></AppShell>;
  const update = (patch: Partial<typeof user>) => setState((s) => {
    if (!s.user) return s;
    const u = { ...s.user, ...patch };
    return { ...s, user: u, users: s.users.map((x) => (x.id === u.id ? u : x)) };
  });
  return (
    <AppShell back title="Account">
      <section className="card-box p-5">
        <h2 className="font-display text-2xl text-primary">Profile</h2>
        {user.profilePhoto && <img src={user.profilePhoto} alt="Profile" className="my-3 h-20 w-20 rounded-full object-cover" />}
        <p className="flex items-center gap-1 text-xl font-bold">{user.name}{user.verified && <BadgeCheck className="text-success" />}</p>
        <p className="text-muted-foreground">{user.org} · {user.dept} · {user.city}</p>
        <p className="mt-2 text-sm">{user.email}</p>
        <p className="text-sm">{user.home} → {user.work}</p>
        {user.car && <p className="text-sm">{user.car} · {user.plate}</p>}
      </section>
      <ProfileSelections key={user.id} user={user} />
      <section className="mt-4 card-box space-y-3 p-5">
        <h2 className="font-display text-2xl text-primary">Security</h2>
        <PasswordInput placeholder="Current password" value={cur} onChange={(e) => setCur(e.target.value)} />
        <PasswordInput placeholder="New password (min 6)" value={np} onChange={(e) => setNp(e.target.value)} />
        <button className="btn-big text-xl" onClick={async () => {
          if (!validPassword(np)) return setMsg("Minimum 6 letters/numbers");
          try { const { changePassword } = await import("@/lib/cloud"); await changePassword(cur, np); setMsg("Password updated"); setCur(""); setNp(""); }
          catch { setMsg("Current password is wrong"); }
        }}>Change Password</button>
        {msg && <p className="font-semibold">{msg}</p>}
      </section>
      <section className="mt-4 card-box flex items-center justify-between p-5">
        <div><h2 className="font-display text-2xl text-primary">Privacy</h2><p className="text-sm text-muted-foreground">Phone number {user.phonePublic ? "public" : "private"}</p></div>
        <button aria-label="Toggle phone visibility" onClick={() => update({ phonePublic: !user.phonePublic })} className={`h-8 w-14 rounded-full p-1 ${user.phonePublic ? "bg-primary" : "bg-muted"}`}>
          <span className={`block h-6 w-6 rounded-full bg-foreground transition ${user.phonePublic ? "translate-x-6" : ""}`} />
        </button>
      </section>
    </AppShell>
  );
}
