import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Home as HomeIcon, Building2, ShieldCheck, Users, Route as RouteIcon, Clock, ChevronRight, Trash2 } from "lucide-react";
import { AppShell, AuthLogo } from "@/components/AppShell";
import { useStore, setState, uid, isExpired, deleteOwnPost, type Post } from "@/lib/store";
import { Countdown } from "@/components/Countdown";
import { Button } from "@/components/ui/button";
import { locationsForCity, validRouteLocations } from "@/lib/store";
import { LocationPicker } from "@/components/LocationPicker";
import { FeatureSlider } from "@/components/FeatureSlider";
import { PartnerMarquee } from "@/components/PartnerMarquee";
import { IncomingOffers } from "@/components/IncomingOffers";
import logoAsset from "@/assets/travelsync-logo.png.asset.json";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Travel Sync — Your security is our concern" },
      { name: "description", content: "Post a ride or a ride request and connect with verified coworkers and students on your route." },
      { property: "og:title", content: "Travel Sync — Verified Carpooling" },
      { property: "og:description", content: "Verified carpooling for Jobians and university students in Pakistan." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
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
          <img src={logoAsset.url} alt="Travel Sync logo" width={112} height={112} className="handshake mx-auto h-28 w-28 rounded-full" />
          <p className="mt-5 font-display text-5xl">TRAVEL SYNC</p>
          <p className="mt-1 font-semibold opacity-90">Your security is our concern</p>
        </div>
      </div>
    );
  const S = slides[i] ?? slides[0]!;
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
      <div className="mx-auto flex min-h-screen max-w-md flex-col bg-hero px-6 pb-10 text-primary-foreground">
        <div className="grid flex-1 place-items-center px-6"><AuthLogo imgSize="h-28 w-28" textSize="text-6xl" /></div>
        <p className="mb-10 mt-2 text-lg font-semibold">Verified carpooling for Jobians & students.</p>
        <Link to="/register" className="btn-big bg-background text-foreground">Create Account</Link>
        <Link to="/login" className="mt-3 py-3 text-center text-lg font-bold">I already have an account</Link>
      </div>
    );
  return <Home />;
}

function Home() {
  const user = useStore((s) => s.user);
  const posts = useStore((s) => s.posts);
  const settings = useStore((s) => s.settings);
  const nav = useNavigate();
  const mode = user?.travelMode ?? "passenger";
  const [cityId, setCityId] = useState(() => settings.cities.find((c) => c.name === user?.city)?.id ?? "");
  const [from, setFrom] = useState(user?.home ?? "");
  const [to, setTo] = useState(user?.work ?? "");
  const [notes, setNotes] = useState("");
  const [gender, setGender] = useState<Post["genderPref"]>("any");
  const [seats, setSeats] = useState(3);
  const [fares, setFares] = useState({ daily: 450, weekly: 2500, monthly: 8500 });

  const city = settings.cities.find((c) => c.id === cityId);
  const locations = locationsForCity(settings.cities, cityId);
  const selectedFrom = locations.includes(from) ? from : "";
  const selectedTo = locations.includes(to) ? to : "";
  const canSubmit = validRouteLocations(settings.cities, cityId, selectedFrom, selectedTo);
  if (!user) return null;
  const mine = posts.filter((p) => p.ownerId === user.id).sort((a, b) => b.createdAt - a.createdAt);
  const submit = () => {
    if (!canSubmit || !city) return;
    const p: Post = {
      id: uid(), kind: mode === "driver" ? "ride" : "request", ownerId: user.id, ownerName: user.name, city: city.name, from: selectedFrom, to: selectedTo, notes, genderPref: gender,
      ...(mode === "driver" ? { seats, ...fares } : {}), createdAt: Date.now(), active: true, interests: [],
    };
    setState((s) => ({ ...s, posts: [...s.posts, p] }));
    nav({ to: "/post/$id", params: { id: p.id } });
  };

  return (
    <AppShell>
      <FeatureSlider />

      <div className="mt-4 space-y-3">
        <h2 className="font-display text-3xl">Select your daily traveling route</h2>
        <select className="field min-h-14" aria-label="City" value={city?.id ?? ""} onChange={(e) => { setCityId(e.target.value); setFrom(""); setTo(""); }}>
          <option value="">Select city</option>
          {settings.cities.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <LocationPicker label="From — Home address" value={selectedFrom} locations={locations} city={city?.name} icon={<HomeIcon className="h-5 w-5" />} onChange={setFrom} />
        <LocationPicker label="To — Workplace / University" value={selectedTo} locations={locations} city={city?.name} icon={<Building2 className="h-5 w-5" />} onChange={setTo} />
        {!settings.cities.length && <p className="text-sm text-muted-foreground">No cities or locations available yet.</p>}
        {city && !locations.length && <p className="text-sm text-muted-foreground">No locations available in this city yet.</p>}
        <div>
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
        <Button onClick={submit} disabled={!canSubmit} className="btn-big h-auto text-3xl">{mode === "driver" ? "Share Ride" : "Send Request"}</Button>
      </div>

      <IncomingOffers />

      <PartnerMarquee />

      {mine.length > 0 && (
        <>
          <h3 className="mb-2 mt-6 font-display text-2xl text-muted-foreground">My Posts</h3>
          <div className="space-y-3">
            {mine.map((p) => {
              const exp = isExpired(p, settings);
              return (
                <div key={p.id} className="flex items-center gap-2 card-box p-4">
                  <Link to="/post/$id" params={{ id: p.id }} className="flex flex-1 items-center gap-3">
                    <div className="flex-1">
                      <p className="text-xs font-bold uppercase text-primary">{p.kind === "ride" ? "Shared Ride" : "Ride Request"}</p>
                      <p className="font-bold">{p.from} → {p.to}</p>
                      <p className="flex items-center gap-1 text-sm text-muted-foreground"><Clock className="h-4 w-4" />{p.cancelledAt ? "Cancelled" : !p.active ? "Inactive" : exp ? "Expired" : <Countdown post={p} />} · {p.interests.length} interested</p>
                    </div>
                    <ChevronRight />
                  </Link>
                  {p.cancelledAt && (
                    <Button variant="ghost" size="icon" aria-label={`Delete cancelled ${p.kind}`} onClick={() => setState((s) => deleteOwnPost(s, p.id))}>
                      <Trash2 className="text-destructive" />
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}
    </AppShell>
  );
}
