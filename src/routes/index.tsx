import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { MapPin, Building2, ShieldCheck, Users, Route as RouteIcon, Clock, ChevronRight } from "lucide-react";
import { AppShell, Logo } from "@/components/AppShell";
import { useStore, setState, uid, isExpired, type Post } from "@/lib/store";
import { Countdown } from "@/components/Countdown";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Travel Sync — Your security is our concern" },
      { name: "description", content: "Post a ride or a ride request and connect with verified coworkers and students on your route." },
      { property: "og:title", content: "Travel Sync — Verified Carpooling" },
      { property: "og:description", content: "Verified carpooling for Jobians and university students in Pakistan." },
    ],
  }),
  component: Index,
});

const slides = [
  { icon: ShieldCheck, title: "Security First", text: "Contacts stay hidden until a connection is unlocked. Your security is our concern." },
  { icon: Users, title: "Verified Coworkers", text: "Every member verifies an official company or @edu.pk university email." },
  { icon: RouteIcon, title: "Share Your Route", text: "Get matched with people travelling on the same home-to-work route." },
];

function Intro() {
  const [splash, setSplash] = useState(true);
  const [i, setI] = useState(0);
  useEffect(() => { const t = setTimeout(() => setSplash(false), 3000); return () => clearTimeout(t); }, []);
  if (splash)
    return (
      <div className="grid min-h-screen place-items-center bg-hero text-center text-primary-foreground">
        <div className="animate-in zoom-in duration-1000">
          <div className="mx-auto grid h-28 w-28 place-items-center rounded-3xl bg-background/20 font-display text-6xl">TS</div>
          <p className="mt-5 font-display text-5xl">TRAVEL SYNC</p>
          <p className="mt-1 font-semibold opacity-90">Your security is our concern</p>
        </div>
      </div>
    );
  const S = slides[i];
  const done = () => setState((s) => ({ ...s, seenIntro: true }));
  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col px-6 py-8">
      <button onClick={done} className="self-end font-semibold text-muted-foreground">Skip</button>
      <div key={i} className="flex flex-1 flex-col items-center justify-center text-center animate-in fade-in slide-in-from-right">
        <div className="grid h-48 w-48 place-items-center rounded-full bg-hero"><S.icon className="h-24 w-24 text-primary-foreground" /></div>
        <h2 className="mt-10 font-display text-5xl">{S.title}</h2>
        <p className="mt-3 text-lg text-muted-foreground">{S.text}</p>
      </div>
      <div className="mb-6 flex justify-center gap-2">{slides.map((_, k) => <span key={k} className={`h-2 rounded-full ${k === i ? "w-8 bg-primary" : "w-2 bg-muted"}`} />)}</div>
      <button className="btn-big" onClick={() => (i < 2 ? setI(i + 1) : done())}>{i < 2 ? "Next" : "Get Started"}</button>
    </div>
  );
}

function Index() {
  const seen = useStore((s) => s.seenIntro);
  const user = useStore((s) => s.user);
  if (!seen) return <Intro />;
  if (!user)
    return (
      <div className="mx-auto flex min-h-screen max-w-md flex-col justify-end bg-hero px-6 pb-10 text-primary-foreground">
        <Logo size="text-6xl" />
        <p className="mb-10 mt-2 text-lg font-semibold">Verified carpooling for Jobians & students.</p>
        <Link to="/register" className="btn-big bg-background text-foreground">Create Account</Link>
        <Link to="/login" className="mt-3 py-3 text-center text-lg font-bold">I already have an account</Link>
      </div>
    );
  return <Home />;
}

function Home() {
  const user = useStore((s) => s.user)!;
  const posts = useStore((s) => s.posts);
  const settings = useStore((s) => s.settings);
  const companies = useStore((s) => s.companies);
  const nav = useNavigate();
  const [mode, setMode] = useState<"passenger" | "driver">("passenger");
  const [from, setFrom] = useState(user.home);
  const [to, setTo] = useState(user.work);
  const [time, setTime] = useState("08:30");
  const [notes, setNotes] = useState("");
  const [gender, setGender] = useState<Post["genderPref"]>("any");
  const [seats, setSeats] = useState(3);
  const [fares, setFares] = useState({ daily: 450, weekly: 2500, monthly: 8500 });
  const [slide, setSlide] = useState(0);
  useEffect(() => { if (!settings.slides.length) return; const t = setInterval(() => setSlide((x) => (x + 1) % settings.slides.length), 4000); return () => clearInterval(t); }, [settings.slides.length]);

  const mine = posts.filter((p) => p.ownerId === user.id).sort((a, b) => b.createdAt - a.createdAt);
  const submit = () => {
    if (!from.trim() || !to.trim()) return;
    const p: Post = {
      id: uid(), kind: mode === "driver" ? "ride" : "request", ownerId: user.id, ownerName: user.name, from, to, time, notes, genderPref: gender,
      ...(mode === "driver" ? { seats, ...fares } : {}), createdAt: Date.now(), active: true, interests: [],
    };
    setState((s) => ({ ...s, posts: [...s.posts, p] }));
    nav({ to: "/post/$id", params: { id: p.id } });
  };

  return (
    <AppShell>
      {settings.slides.length > 0 && <img src={settings.slides[slide]} alt="Travel Sync promotion" className="mb-4 h-36 w-full rounded-2xl object-cover" />}
      <div className="grid grid-cols-2 gap-1 rounded-2xl bg-secondary p-1">
        {(["passenger", "driver"] as const).map((m) => (
          <button key={m} onClick={() => setMode(m)} className={`rounded-xl py-3 font-display text-2xl ${mode === m ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}>{m === "passenger" ? "Passenger" : "Driver"}</button>
        ))}
      </div>

      <div className="mt-4 card-box space-y-3 p-4">
        <label className="flex items-center gap-3"><MapPin className="h-6 w-6 shrink-0 text-success" /><input className="field" placeholder="From — Home address" value={from} onChange={(e) => setFrom(e.target.value)} /></label>
        <label className="flex items-center gap-3"><Building2 className="h-6 w-6 shrink-0 text-primary" /><input className="field" placeholder="To — Workplace / University" value={to} onChange={(e) => setTo(e.target.value)} /></label>
        <div className="grid grid-cols-2 gap-3">
          <input type="time" className="field" value={time} onChange={(e) => setTime(e.target.value)} aria-label="Departure time" />
          <select className="field" value={gender} onChange={(e) => setGender(e.target.value as Post["genderPref"])} aria-label="Gender preference">
            <option value="any">Anyone</option><option value="female">Females Only</option><option value="male">Male Only</option>
          </select>
        </div>
        {mode === "driver" && (
          <>
            <label className="block text-sm font-semibold text-muted-foreground">Available seats
              <input type="number" min={1} max={6} className="field mt-1" value={seats} onChange={(e) => setSeats(+e.target.value)} /></label>
            <div className="grid grid-cols-3 gap-2">
              {(["daily", "weekly", "monthly"] as const).map((k) => (
                <label key={k} className="text-xs font-semibold uppercase text-muted-foreground">{k} PKR
                  <input type="number" className="field mt-1 px-2" value={fares[k]} onChange={(e) => setFares({ ...fares, [k]: +e.target.value })} /></label>
              ))}
            </div>
          </>
        )}
        <textarea className="field min-h-24" placeholder="Instructions (e.g. pick me from main gate, no smoking, AC preferred)" value={notes} onChange={(e) => setNotes(e.target.value)} />
        <button onClick={submit} className="btn-big text-3xl">{mode === "driver" ? "Share Ride" : "Send Request"}</button>
      </div>

      <h3 className="mb-2 mt-6 font-display text-2xl text-muted-foreground">Partner Companies</h3>
      <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-2">
        {companies.filter((c) => c.approved).map((c) => (
          <div key={c.id} className="grid h-16 min-w-28 place-items-center card-box px-3 text-sm font-bold">
            {c.logo ? <img src={c.logo} alt={c.name} className="h-10 object-contain" /> : c.name}
          </div>
        ))}
      </div>

      {mine.length > 0 && (
        <>
          <h3 className="mb-2 mt-6 font-display text-2xl text-muted-foreground">My Posts</h3>
          <div className="space-y-3">
            {mine.map((p) => {
              const exp = isExpired(p, settings);
              return (
                <Link key={p.id} to="/post/$id" params={{ id: p.id }} className="flex items-center gap-3 card-box p-4">
                  <div className="flex-1">
                    <p className="text-xs font-bold uppercase text-primary">{p.kind === "ride" ? "Shared Ride" : "Ride Request"}</p>
                    <p className="font-bold">{p.from} → {p.to}</p>
                    <p className="flex items-center gap-1 text-sm text-muted-foreground"><Clock className="h-4 w-4" />{exp ? "Expired" : <Countdown post={p} />} · {p.interests.length} interested</p>
                  </div>
                  <ChevronRight />
                </Link>
              );
            })}
          </div>
        </>
      )}
    </AppShell>
  );
}
