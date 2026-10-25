import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { LogOut, Check, X, Upload, Trash2 } from "lucide-react";
import { Logo } from "@/components/AppShell";
import { AdminLocations } from "@/components/AdminLocations";
import { AdminDepartments } from "@/components/AdminDepartments";
import { Button } from "@/components/ui/button";
import { useStore, setState, isAdminCreds, formatPKR, compressImage, uid, type Settings } from "@/lib/store";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin Panel — Travel Sync" },
      { name: "description", content: "Travel Sync administration." },
      { property: "og:title", content: "Admin Panel — Travel Sync" },
      { property: "og:description", content: "Manage fees, payments, users and content." },
      { name: "robots", content: "noindex" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Admin,
});

const TABS = ["Settings", "Locations", "Payments", "CMS", "Users", "Rides", "Companies", "Departments"] as const;

function Admin() {
  const admin = useStore((s) => s.admin);
  const [tab, setTab] = useState<(typeof TABS)[number]>("Settings");
  const nav = useNavigate();
  if (!admin) return <AdminLogin />;
  return (
    <div className="mx-auto max-w-3xl px-4 py-4">
      <div className="flex items-center justify-between"><div><Logo /><p className="font-display text-xl text-muted-foreground">Admin Panel</p></div>
        <button aria-label="Logout" onClick={() => { setState((s) => ({ ...s, admin: false })); nav({ to: "/login" }); }} className="grid h-11 w-11 place-items-center rounded-full bg-secondary"><LogOut /></button></div>
      <div className="-mx-4 mt-4 flex gap-2 overflow-x-auto px-4 pb-2">
        {TABS.map((t) => <button key={t} onClick={() => setTab(t)} className={`rounded-full px-5 py-2 font-display text-xl ${tab === t ? "bg-primary text-primary-foreground" : "bg-secondary"}`}>{t}</button>)}
      </div>
      <div className="mt-4">
        {tab === "Settings" && <SettingsTab />}
        {tab === "Locations" && <AdminLocations />}
        {tab === "Payments" && <Payments />}
        {tab === "CMS" && <Cms />}
        {tab === "Users" && <Users />}
        {tab === "Rides" && <Rides />}
        {tab === "Companies" && <Companies />}
        {tab === "Departments" && <AdminDepartments />}
      </div>
    </div>
  );
}

function AdminLogin() {
  const [e, setE] = useState(""); const [p, setP] = useState(""); const [err, setErr] = useState("");
  return (
    <form onSubmit={(ev) => { ev.preventDefault(); if (isAdminCreds(e, p)) setState((s) => ({ ...s, admin: true })); else setErr("Invalid admin credentials"); }} className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-4 px-6">
      <Logo size="text-5xl" /><p className="font-display text-2xl text-muted-foreground">Admin Login</p>
      <input className="field" placeholder="Email" value={e} onChange={(x) => setE(x.target.value)} />
      <input className="field" type="password" placeholder="Password" value={p} onChange={(x) => setP(x.target.value)} />
      {err && <p className="text-destructive">{err}</p>}
      <button className="btn-big">Login</button>
    </form>
  );
}

const setSettings = (patch: Partial<Settings>) => setState((s) => ({ ...s, settings: { ...s.settings, ...patch } }));

function Toggle({ on, onClick, label }: { on: boolean; onClick: () => void; label: string }) {
  return (
    <button onClick={onClick} className="flex w-full items-center justify-between card-box p-4 font-semibold">
      {label}<span className={`h-8 w-14 rounded-full p-1 ${on ? "bg-primary" : "bg-muted"}`}><span className={`block h-6 w-6 rounded-full bg-foreground transition ${on ? "translate-x-6" : ""}`} /></span>
    </button>
  );
}

function SettingsTab() {
  const s = useStore((x) => x.settings);
  return (
    <div className="space-y-3">
      <label className="block card-box p-4 font-semibold">Contact Unlock Fee (PKR)<input type="number" className="field mt-2 font-display text-3xl" value={s.fee} onChange={(e) => setSettings({ fee: Math.max(0, +e.target.value) })} /></label>
      <Toggle label="Auto-cancel leads" on={s.autoCancel} onClick={() => setSettings({ autoCancel: !s.autoCancel })} />
      <label className="block card-box p-4 font-semibold">Auto-cancel duration (hours)<input type="number" min={1} className="field mt-2" value={s.hours} onChange={(e) => setSettings({ hours: Math.max(1, +e.target.value) })} /></label>
      <Toggle label="Instant unlock on payment (skip manual verification)" on={s.instantUnlock} onClick={() => setSettings({ instantUnlock: !s.instantUnlock })} />
      <div className="card-box space-y-2 p-4 font-semibold">Payment accounts
        <input className="field" placeholder="Easypaisa number" value={s.easypaisa} onChange={(e) => setSettings({ easypaisa: e.target.value })} />
        <input className="field" placeholder="JazzCash number" value={s.jazzcash} onChange={(e) => setSettings({ jazzcash: e.target.value })} />
        <input className="field" placeholder="Bank account title" value={s.bankTitle} onChange={(e) => setSettings({ bankTitle: e.target.value })} />
        <input className="field" placeholder="IBAN / Account #" value={s.bankIban} onChange={(e) => setSettings({ bankIban: e.target.value })} />
      </div>
    </div>
  );
}

function Payments() {
  const unlocks = useStore((s) => s.unlocks);
  const set = (id: string, status: "unlocked" | "rejected") => setState((s) => ({ ...s, unlocks: s.unlocks.map((u) => (u.id === id ? { ...u, status } : u)) }));
  const approved = unlocks.filter((u) => u.status === "unlocked");
  const revenue = approved.reduce((a, u) => a + u.amount, 0);
  const by = (m: string) => approved.filter((u) => u.method === m).reduce((a, u) => a + u.amount, 0);
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        <Stat label="Revenue" value={formatPKR(revenue)} />
        <Stat label="Pending" value={String(unlocks.filter((u) => u.status === "pending").length)} />
        <Stat label="Easypaisa" value={formatPKR(by("easypaisa"))} />
        <Stat label="JazzCash" value={formatPKR(by("jazzcash"))} />
      </div>
      {unlocks.length === 0 && <p className="text-muted-foreground">No transactions yet.</p>}
      {[...unlocks].reverse().map((u) => (
        <div key={u.id} className="card-box p-4">
          <div className="flex justify-between"><p className="font-bold">{formatPKR(u.amount)} · {u.method}</p><span className={`font-bold ${u.status === "unlocked" ? "text-success" : u.status === "pending" ? "text-warning" : "text-destructive"}`}>{u.status}</span></div>
          <p className="text-sm text-muted-foreground">TXN: {u.txn} · {new Date(u.at).toLocaleString()}</p>
          {u.screenshot && <img src={u.screenshot} alt="Payment proof" className="mt-2 h-32 rounded-lg object-cover" />}
          {u.status === "pending" && (
            <div className="mt-3 grid grid-cols-2 gap-2">
              <button onClick={() => set(u.id, "unlocked")} className="btn-big bg-success text-xl text-accent-foreground"><Check />Approve</button>
              <button onClick={() => set(u.id, "rejected")} className="btn-big bg-destructive text-xl"><X />Reject</button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return <div className="card-box p-4"><p className="text-sm text-muted-foreground">{label}</p><p className="font-display text-3xl">{value}</p></div>;
}

function Cms() {
  const s = useStore((x) => x.settings);
  return (
    <div className="space-y-4">
      <div className="card-box p-4">
        <p className="mb-2 font-display text-2xl">Home Slider</p>
        <div className="grid grid-cols-3 gap-2">
          {s.slides.map((src, i) => (
            <div key={i} className="relative"><img src={src} alt={`Slide ${i + 1}`} className="h-20 w-full rounded-lg object-cover" />
              <button aria-label="Remove slide" onClick={() => setSettings({ slides: s.slides.filter((_, k) => k !== i) })} className="absolute right-1 top-1 rounded-full bg-destructive p-1"><Trash2 className="h-4 w-4" /></button></div>
          ))}
          <label className="grid h-20 cursor-pointer place-items-center rounded-lg border border-dashed"><Upload />
            <input type="file" accept="image/*" hidden onChange={async (e) => { const f = e.target.files?.[0]; if (f) { const d = await compressImage(f, 1200); setSettings({ slides: [...s.slides, d] }); } }} /></label>
        </div>
      </div>
      {Object.keys(s.pages).map((k) => (
        <label key={k} className="block card-box p-4"><span className="font-display text-2xl capitalize">{k.replace("-", " ")}</span>
          <textarea className="field mt-2 min-h-28 text-base font-normal" value={s.pages[k]} onChange={(e) => setSettings({ pages: { ...s.pages, [k]: e.target.value } })} /></label>
      ))}
      <div className="card-box space-y-2 p-4"><p className="font-display text-2xl">Social Links</p>
        {(Object.keys(s.socials) as (keyof Settings["socials"])[]).map((k) => (
          <input key={k} className="field" placeholder={k} value={s.socials[k]} onChange={(e) => setSettings({ socials: { ...s.socials, [k]: e.target.value } })} />
        ))}
      </div>
    </div>
  );
}

function Users() {
  const users = useStore((s) => s.users);
  const upd = (id: string, patch: { verified?: boolean; active?: boolean }) => setState((s) => ({ ...s, users: s.users.map((u) => (u.id === id ? { ...u, ...patch } : u)) }));
  if (!users.length) return <p className="text-muted-foreground">No registered users yet.</p>;
  return <div className="space-y-2">{users.map((u) => (
    <div key={u.id} className="card-box p-4">
      <p className="font-bold">{u.name} <span className="text-sm text-muted-foreground">({u.role}, {u.gender})</span></p>
      <p className="text-sm text-muted-foreground">{u.email} · {u.org} · {u.city}</p>
      {u.carPhoto && <img src={u.carPhoto} alt="Vehicle" className="mt-2 h-20 rounded-lg" />}
      {u.plate && <p className="text-sm">Plate: {u.plate}</p>}
      <div className="mt-2 flex gap-2">
        <button onClick={() => upd(u.id, { verified: !u.verified })} className={`rounded-full px-4 py-2 font-bold ${u.verified ? "bg-success text-accent-foreground" : "bg-secondary"}`}>{u.verified ? "Verified" : "Verify"}</button>
        <button onClick={() => upd(u.id, { active: !u.active })} className={`rounded-full px-4 py-2 font-bold ${u.active ? "bg-secondary" : "bg-destructive"}`}>{u.active ? "Deactivate" : "Activate"}</button>
      </div>
    </div>))}</div>;
}

function Rides() {
  const posts = useStore((s) => s.posts);
  if (!posts.length) return <p className="text-muted-foreground">No rides or requests yet.</p>;
  return <div className="space-y-2">{[...posts].reverse().map((p) => (
    <div key={p.id} className="flex items-center gap-3 card-box p-4">
      <div className="flex-1"><p className="text-xs font-bold uppercase text-primary">{p.kind}</p><p className="font-bold">{p.from} → {p.to}</p><p className="text-sm text-muted-foreground">{p.ownerName} · {p.interests.length} interested</p></div>
      <button onClick={() => setState((s) => ({ ...s, posts: s.posts.map((x) => (x.id === p.id ? { ...x, active: !x.active } : x)) }))} className={`rounded-full px-4 py-2 font-bold ${p.active ? "bg-success text-accent-foreground" : "bg-secondary"}`}>{p.active ? "Active" : "Inactive"}</button>
    </div>))}</div>;
}

function Companies() {
  const companies = useStore((s) => s.companies);
  const [name, setName] = useState("");
  return (
    <div className="space-y-2">
      <h2 className="font-display text-3xl">Companies & Institutes</h2>
      <div className="flex gap-2"><input className="field min-w-0" aria-label="New company or institute" placeholder="Company / institute name" value={name} onChange={(e) => setName(e.target.value)} />
        <Button onClick={() => { const value = name.trim(); if (value && !companies.some((c) => c.name.toLowerCase() === value.toLowerCase())) { setState((s) => ({ ...s, companies: [...s.companies, { id: uid(), name: value, approved: false }] })); setName(""); } }} className="h-auto shrink-0">Add</Button></div>
      {companies.map((c) => (
        <div key={c.id} className="flex items-center gap-3 card-box p-3">
          <label className="grid h-12 w-16 cursor-pointer place-items-center rounded-lg bg-secondary">
            {c.logo ? <img src={c.logo} alt={c.name} className="h-10 object-contain" /> : <Upload className="h-5 w-5" />}
            <input type="file" accept="image/*" hidden onChange={async (e) => { const f = e.target.files?.[0]; if (f) { const logo = await compressImage(f, 200); setState((s) => ({ ...s, companies: s.companies.map((x) => (x.id === c.id ? { ...x, logo } : x)) })); } }} />
          </label>
          <p className="flex-1 font-bold">{c.name}</p>
          <button onClick={() => setState((s) => ({ ...s, companies: s.companies.map((x) => (x.id === c.id ? { ...x, approved: !x.approved } : x)) }))} className={`rounded-full px-4 py-2 font-bold ${c.approved ? "bg-success text-accent-foreground" : "bg-secondary"}`}>{c.approved ? "Approved" : "Approve"}</button>
        </div>
      ))}
    </div>
  );
}
