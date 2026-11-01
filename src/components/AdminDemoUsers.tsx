import { useEffect, useState } from "react";
import { Star, Trash2, Plus, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useStore, setState, uid, type DemoUser, type Gender } from "@/lib/store";

const NONE: DemoUser[] = [];
const save = (fn: (list: DemoUser[]) => DemoUser[]) =>
  setState((s) => ({ ...s, settings: { ...s.settings, demoUsers: fn(s.settings.demoUsers ?? []) } }));

export function AdminDemoUsers() {
  const list = useStore((s) => s.settings.demoUsers ?? NONE);
  const [name, setName] = useState(""); const [phone, setPhone] = useState(""); const [org, setOrg] = useState("");
  const [gender, setGender] = useState<Gender>("male"); const [rating, setRating] = useState(5); const [car, setCar] = useState("");
  const [err, setErr] = useState("");
  const add = async () => {
    if (!name.trim() || !/^03\d{9}$/.test(phone.replace(/\D/g, "")) || !org.trim()) return setErr("Enter name, company and a valid mobile number (03XXXXXXXXX).");
    setErr("");
    const id = uid();
    try {
      const { saveDemoPhone } = await import("@/lib/cloud");
      await saveDemoPhone(id, phone.replace(/\D/g, ""));
    } catch { return setErr("Couldn't save the mobile number. Try again."); }
    save((l) => [...l, { id, name: name.trim(), org: org.trim(), gender, rating, car: car.trim() || undefined, reviews: [] }]);
    setName(""); setPhone(""); setOrg(""); setCar("");
  };
  return (
    <section className="card-box space-y-3 p-4">
      <h2 className="font-display text-2xl">Demo users ({list.length})</h2>
      <input className="field" placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
      <input className="field" inputMode="tel" placeholder="Mobile number 03XXXXXXXXX" value={phone} onChange={(e) => setPhone(e.target.value)} />
      <input className="field" placeholder="Company / institute" value={org} onChange={(e) => setOrg(e.target.value)} />
      <input className="field" placeholder="Car (optional, shown to passengers)" value={car} onChange={(e) => setCar(e.target.value)} />
      <div className="grid grid-cols-2 gap-2">
        {(["male", "female"] as const).map((g) => <Button key={g} type="button" variant="secondary" aria-pressed={gender === g} className={gender === g ? "border-2 border-primary" : ""} onClick={() => setGender(g)}>{g === "male" ? "Male" : "Female"}</Button>)}
      </div>
      <Stars value={rating} onChange={setRating} />
      {err && <p className="text-sm font-semibold text-destructive">{err}</p>}
      <Button type="button" className="w-full" onClick={add}><Plus className="size-4" />Add demo user</Button>
      <div className="space-y-2">{list.map((d) => <DemoRow key={d.id} d={d} />)}</div>
    </section>
  );
}

function Stars({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  return <div className="flex gap-1" role="radiogroup" aria-label="Rating">{[1, 2, 3, 4, 5].map((n) => <button key={n} type="button" role="radio" aria-checked={value === n} aria-label={`${n} stars`} onClick={() => onChange(n)}><Star className={`size-7 ${n <= value ? "fill-warning text-warning" : "text-muted-foreground"}`} /></button>)}</div>;
}

function DemoRow({ d }: { d: DemoUser }) {
  const [open, setOpen] = useState(false);
  const [phone, setPhone] = useState(""); const [saved, setSaved] = useState("");
  const [author, setAuthor] = useState(""); const [stars, setStars] = useState(5); const [text, setText] = useState("");
  useEffect(() => { if (!open) return; import("@/lib/cloud").then((c) => c.loadDemoPhone(d.id)).then(setPhone).catch(() => {}); }, [open, d.id]);
  const update = (patch: Partial<DemoUser>) => save((l) => l.map((x) => x.id === d.id ? { ...x, ...patch } : x));
  const remove = async () => {
    save((l) => l.filter((x) => x.id !== d.id));
    try { (await import("@/lib/cloud")).deleteDemoPhone(d.id); } catch { /* ignore */ }
  };
  return (
    <div className="rounded-lg border p-3">
      <div className="flex items-center gap-2">
        <button type="button" className="min-w-0 flex-1 text-left" onClick={() => setOpen(!open)}>
          <p className="font-bold">{d.name}</p>
          <p className="text-xs text-muted-foreground">{d.org} · {d.gender === "female" ? "Female" : "Male"} · ★ {d.rating} · {d.reviews.length} reviews</p>
          {!open && <p className="text-xs font-semibold text-primary">Tap to edit and add reviews</p>}
        </button>
        {open ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
        <Button type="button" variant="ghost" size="icon" aria-label={`Delete ${d.name}`} onClick={remove}><Trash2 className="text-destructive" /></Button>
      </div>
      {open && (
        <div className="mt-3 space-y-2">
          <input className="field" value={d.name} onChange={(e) => update({ name: e.target.value })} aria-label="Name" />
          <input className="field" value={d.org} onChange={(e) => update({ org: e.target.value })} aria-label="Company" />
          <div className="flex gap-2"><input className="field" inputMode="tel" value={phone} onChange={(e) => { setPhone(e.target.value); setSaved(""); }} aria-label="Mobile number" />
            <Button type="button" variant="secondary" onClick={async () => { try { await (await import("@/lib/cloud")).saveDemoPhone(d.id, phone.replace(/\D/g, "")); setSaved("Saved"); } catch { setSaved("Failed"); } }}>Save</Button></div>
          {saved && <p className="text-xs text-muted-foreground">{saved}</p>}
          <Stars value={d.rating} onChange={(n) => update({ rating: n })} />
          <p className="pt-2 font-semibold">Reviews</p>
          {d.reviews.map((r) => <div key={r.id} className="flex items-start gap-2 rounded bg-secondary p-2 text-sm"><p className="flex-1"><b>{r.author}</b> ★{r.rating} — {r.text}</p><Button type="button" variant="ghost" size="icon" aria-label="Remove review" onClick={() => update({ reviews: d.reviews.filter((x) => x.id !== r.id) })}><Trash2 className="size-4" /></Button></div>)}
          <input className="field" placeholder="Reviewer name" value={author} onChange={(e) => setAuthor(e.target.value)} />
          <Stars value={stars} onChange={setStars} />
          <textarea className="field min-h-20" maxLength={500} placeholder="Review text" value={text} onChange={(e) => setText(e.target.value)} />
          <Button type="button" variant="outline" className="w-full" disabled={!author.trim() || !text.trim()} onClick={() => { update({ reviews: [...d.reviews, { id: uid(), author: author.trim(), rating: stars, text: text.trim(), at: Date.now() - Math.floor(Math.random() * 20) * 86400_000 }] }); setAuthor(""); setText(""); setStars(5); }}><Plus className="size-4" />Add review</Button>
        </div>
      )}
    </div>
  );
}
