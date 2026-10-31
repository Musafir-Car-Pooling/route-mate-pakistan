import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Home as HomeIcon, Building2, ArrowRight, Clock, ChevronRight, Trash2 } from "lucide-react";
import { AppShell, AuthLogo } from "@/components/AppShell";
import { useStore, setState, uid, isExpired, deleteOwnPost, type Post } from "@/lib/store";
import { Countdown } from "@/components/Countdown";
import { Button } from "@/components/ui/button";
import { locationsForCity, validRouteLocations } from "@/lib/store";
import { LocationPicker } from "@/components/LocationPicker";
import { FeatureSlider } from "@/components/FeatureSlider";
import { NearbySearchIndicator } from "@/components/NearbySearchIndicator";
import { PartnerMarquee } from "@/components/PartnerMarquee";
import logoAsset from "@/assets/travelsync-logo.png.asset.json";
import securityIllustration from "@/assets/onboarding-security.jpg";
import communityIllustration from "@/assets/onboarding-community.jpg";
import routeIllustration from "@/assets/onboarding-route.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Travel Sync — Find your route mates" },
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
  { image: securityIllustration, alt: "Professionals beside a car with a privacy shield", title: "Security First", text: "Contacts stay hidden until a connection is unlocked. Find your route mates safely." },
  { image: communityIllustration, alt: "Pakistani professionals and a university student in a verified community", title: "Verified Coworkers", text: "Every member verifies an official company or @edu.pk university email." },
  { image: routeIllustration, alt: "Two route mates sharing a car between home and work", title: "Share Your Route", text: "Get matched with people travelling on the same home-to-work route." },
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
          <p className="mt-2 font-slogan text-sm font-bold uppercase tracking-[0.22em] opacity-90">Find your route mates</p>
        </div>
      </div>
    );
  const S = slides[i] ?? slides[0];
  if (!S) return null;
  const done = () => setState((s) => ({ ...s, seenIntro: true }));
  return (
    <div className="onboarding-shell mx-auto max-w-md px-6">
      <header className="flex shrink-0 items-center justify-between gap-3 pt-5">
        <div>
          <p className="font-display text-2xl">TRAVEL SYNC</p>
          <p className="font-slogan text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">Find your route mates</p>
        </div>
        <Button variant="ghost" onClick={done} className="text-muted-foreground">Skip</Button>
      </header>
      <div key={i} className="flex flex-1 flex-col items-center justify-center gap-5 py-5 text-center feature-enter" aria-live="polite">
        <img src={S.image} alt={S.alt} width={992} height={672} className="onboarding-illustration w-full object-contain" />
        <div className="min-h-28">
          <h2 className="font-display text-4xl">{S.title}</h2>
          <p className="mx-auto mt-3 max-w-xs text-base leading-relaxed text-muted-foreground">{S.text}</p>
        </div>
      </div>
      <footer className="onboarding-actions shrink-0">
        <div className="mb-5 flex justify-center gap-2" aria-label={`Step ${i + 1} of ${slides.length}`}>{slides.map((_, k) => <span key={k} className={`h-1.5 rounded-full ${k === i ? "w-7 bg-primary" : "w-2 bg-muted"}`} />)}</div>
        <Button size="contact" className="text-2xl" onClick={() => (i < slides.length - 1 ? setI(i + 1) : done())}>{i < slides.length - 1 ? "Next" : "Get Started"}<ArrowRight aria-hidden="true" /></Button>
      </footer>
    </div>
  );
}

function Index() {
  const seen = useStore((s) => s.seenIntro);
  const user = useStore((s) => s.user);
  if (!seen) return <Intro />;
  if (!user)
    return (
      <div className="mx-auto flex min-h-[100dvh] max-w-md flex-col px-6 pb-6">
        <div className="grid flex-1 place-items-center px-6 animate-in zoom-in-90 fade-in duration-700"><AuthLogo imgSize="h-28 w-28" textSize="text-6xl" /></div>
        <div className="mb-[12vh] animate-in fade-in slide-in-from-bottom-6 duration-700">
          <p className="mb-6 mt-2 text-center text-lg font-semibold text-muted-foreground">Verified carpooling for Jobians & students.</p>
          <Link to="/register" className="btn-big">Create Account</Link>
          <Link to="/login" className="btn-big mt-3 border-2 border-primary/70 bg-transparent">I already have an account</Link>
        </div>
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
      id: uid(), kind: mode === "driver" ? "ride" : "request", ownerId: user.id, ownerName: user.name,
      ownerOrg: user.org, ownerRating: user.rating, ownerVerified: user.verified, ownerCar: user.car || undefined,
      city: city.name, from: selectedFrom, to: selectedTo, notes, genderPref: gender,
      ...(mode === "driver" ? { seats } : {}), createdAt: Date.now(), active: true, interests: [],
    };
    setState((s) => ({ ...s, posts: [...s.posts, p] }));
    nav({ to: "/post/$id", params: { id: p.id } });
  };

  return (
    <AppShell>
      <FeatureSlider />
      <NearbySearchIndicator />

      <div className="mt-4 space-y-3">
        <h2 className="whitespace-nowrap font-display text-[clamp(1.35rem,7vw,1.875rem)] animate-in fade-in slide-in-from-left-4 duration-500">Select your daily traveling route</h2>
        <p className="-mt-2 text-xs text-muted-foreground">Choose your city, then your home and workplace / university.</p>
        <select className="field min-h-14" aria-label="City" value={city?.id ?? ""} onChange={(e) => { setCityId(e.target.value); setFrom(""); setTo(""); }}>
          <option value="">Select city</option>
          {settings.cities.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <LocationPicker label="From — Home address" value={selectedFrom} locations={locations} city={city?.name} icon={<HomeIcon className="h-5 w-5" />} onChange={setFrom} />
        <LocationPicker label="To — Workplace / University" value={selectedTo} locations={locations} city={city?.name} icon={<Building2 className="h-5 w-5" />} onChange={setTo} />
        {!settings.cities.length && <p className="text-sm text-muted-foreground">No cities or locations available yet.</p>}
        {city && !locations.length && <p className="text-sm text-muted-foreground">No locations available in this city yet.</p>}
        <div>
          <p className="mb-1 text-xs text-muted-foreground">Select your preferred gender to travel with</p>
          <select className="field" value={gender} onChange={(e) => setGender(e.target.value as Post["genderPref"])} aria-label="Gender preference">
            <option value="any">Anyone</option><option value="female">Females Only</option><option value="male">Male Only</option>
          </select>
        </div>
        {mode === "driver" && (
          <>
            <label className="block text-sm font-semibold text-muted-foreground">Available seats
              <span className="block text-xs font-normal">How many passengers can you take (1–6)?</span><input type="number" min={1} max={6} className="field mt-1" value={seats} onChange={(e) => setSeats(+e.target.value)} /></label>
          </>
        )}
        <textarea className="field min-h-24" placeholder="Instructions (e.g. pick me from main gate, no smoking, AC preferred)" value={notes} onChange={(e) => setNotes(e.target.value)} />
        <Button onClick={submit} disabled={!canSubmit} className="btn-big h-auto text-3xl transition-transform hover:scale-[1.01] animate-in fade-in zoom-in-95 duration-500">{mode === "driver" ? "Share Ride" : "Send Request"}</Button>
      </div>

      <PartnerMarquee />

      {mine.length > 0 && (
        <>
          <h3 className="mb-2 mt-6 font-display text-2xl text-muted-foreground">My Posts</h3>
          <div className="space-y-3">
            {mine.map((p, idx) => {
              const exp = isExpired(p, settings);
              return (
                <div key={p.id} style={{ animationDelay: `${idx * 60}ms` }} className="flex items-center gap-2 card-box p-4 animate-in fade-in slide-in-from-bottom-2 fill-mode-both">
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
