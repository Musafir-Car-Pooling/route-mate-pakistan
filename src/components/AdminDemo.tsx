import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useStore, setState, uid, type Gender } from "@/lib/store";

const NO_FAKES: never[] = [];

export function AdminDemo() {
  const demo = useStore((s) => !!s.settings.demoMode);
  const fakes = useStore((s) => s.settings.fakeMembers ?? NO_FAKES);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [org, setOrg] = useState("");
  const [gender, setGender] = useState<Gender>("male");
  const [error, setError] = useState("");
  const setMode = (on: boolean) => setState((s) => ({ ...s, settings: { ...s.settings, demoMode: on } }));
  return (
    <section className="space-y-4">
      <h2 className="font-display text-3xl">Demo interests</h2>
      <div className="grid grid-cols-2 gap-2">
        <Button variant={demo ? "default" : "outline"} aria-pressed={demo} onClick={() => setMode(true)}>Demo mode</Button>
        <Button variant={!demo ? "default" : "outline"} aria-pressed={!demo} onClick={() => setMode(false)}>Real mode</Button>
      </div>
      <p className="text-sm text-muted-foreground">{demo ? "Every member's active ride or request shows the fake members below as interested." : "Members only see real interests."}</p>
      <form className="card-box space-y-2 p-4" onSubmit={(e) => {
        e.preventDefault();
        const n = name.trim(); const p = phone.replace(/[\s-]/g, "");
        if (!n) return setError("Enter a name.");
        if (!/^03\d{9}$/.test(p)) return setError("Enter a mobile number like 03001234567.");
        setState((s) => ({ ...s, settings: { ...s.settings, fakeMembers: [...(s.settings.fakeMembers ?? []), { id: uid(), name: n, phone: p, gender, org: org.trim() }] } }));
        setName(""); setPhone(""); setOrg(""); setError("");
      }}>
        <input className="field" aria-label="Fake member name" placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
        <input className="field" aria-label="Fake member mobile" inputMode="tel" placeholder="Mobile number (03xxxxxxxxx)" value={phone} onChange={(e) => setPhone(e.target.value)} />
        <input className="field" aria-label="Fake member company" placeholder="Company / university (optional)" value={org} onChange={(e) => setOrg(e.target.value)} />
        <select className="field" aria-label="Gender" value={gender} onChange={(e) => setGender(e.target.value as Gender)}><option value="male">Male</option><option value="female">Female</option></select>
        {error && <p className="text-sm font-semibold text-destructive">{error}</p>}
        <Button type="submit" className="w-full"><Plus />Add fake member</Button>
      </form>
      <ul className="divide-y divide-border">
        {fakes.map((f) => <li key={f.id} className="flex items-center gap-3 py-3">
          <div className="min-w-0 flex-1"><p className="font-semibold break-words">{f.name}</p><p className="text-sm text-muted-foreground">{f.phone}{f.org && ` · ${f.org}`} · {f.gender === "female" ? "Female" : "Male"}</p></div>
          <Button variant="ghost" size="icon" aria-label={`Remove ${f.name}`} onClick={() => setState((s) => ({ ...s, settings: { ...s.settings, fakeMembers: (s.settings.fakeMembers ?? []).filter((x) => x.id !== f.id) } }))}><Trash2 className="text-destructive" /></Button>
        </li>)}
      </ul>
      {!fakes.length && <p className="text-muted-foreground">No fake members added yet.</p>}
    </section>
  );
}
