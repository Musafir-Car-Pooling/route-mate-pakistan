import { Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { Menu, X, User, Shield, Lock, HelpCircle, FileText, Info, Phone, LogOut, MessageCircle, Facebook, Linkedin, Instagram, ArrowLeft, Car, ArrowLeftRight, Users, Bell } from "lucide-react";
import { useStore, setState, switchTravelMode, validPlate } from "@/lib/store";
import { nearbyOffers } from "@/lib/ride-alerts";
import { Button } from "@/components/ui/button";
import logoAsset from "@/assets/travelsync-logo.png.asset.json";

export const SLOGAN = "Find your route mates";

export function Slogan({ className = "", style, ref }: { className?: string; style?: React.CSSProperties; ref?: React.Ref<HTMLParagraphElement> }) {
  return <p ref={ref} style={style} className={`font-slogan font-bold uppercase text-muted-foreground ${className}`}>{SLOGAN}</p>;
}

export function Logo({ size = "text-3xl", className = "" }: { size?: string; className?: string }) {
  const wm = useRef<HTMLSpanElement>(null);
  const sl = useRef<HTMLElement>(null);
  const [wmWidth, setWmWidth] = useState(0);
  const [fontsReady, setFontsReady] = useState(false);
  useEffect(() => {
    let on = true;
    document.fonts?.ready.then(() => { if (on) setFontsReady(true); });
    return () => { on = false; };
  }, []);
  useEffect(() => {
    const el = wm.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const measure = () => setWmWidth(el.getBoundingClientRect().width);
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    measure();
    return () => ro.disconnect();
  }, []);
  useLayoutEffect(() => {
    const el = sl.current;
    if (!el || !wmWidth) return;
    el.style.fontSize = "";
    el.style.letterSpacing = "0px";
    const natural = el.getBoundingClientRect().width;
    const count = (el.textContent ?? "").replace(/\s/g, "").length - 1;
    const extra = (wmWidth - natural) / Math.max(count, 1);
    if (extra >= 0) {
      el.style.letterSpacing = `${extra.toFixed(2)}px`;
    } else {
      el.style.fontSize = `${(10 * wmWidth / natural).toFixed(2)}px`;
      el.style.letterSpacing = "0px";
    }
  }, [wmWidth, fontsReady, size]);
  return (
    <span className={`flex min-w-0 items-center gap-4 ${className}`}>
      <img src={logoAsset.url} alt="Travel Sync logo" width={36} height={36} className="h-9 w-9 shrink-0 rounded-full" />
      <span className="min-w-0 overflow-hidden" style={wmWidth ? { width: wmWidth } : undefined}>
        <span ref={wm} className={`block whitespace-nowrap font-display ${size} leading-none`}>
          TRAVEL <span className="text-primary">SYNC</span>
        </span>
        <Slogan
          ref={sl}
          className="mt-0.5 block whitespace-nowrap text-[10px] leading-none tracking-[0.06em]"
          style={{ width: wmWidth || undefined }}
        />
      </span>
    </span>
  );
}

export function AuthLogo({ imgSize = "h-28 w-28", textSize = "text-7xl" }: { imgSize?: string; textSize?: string }) {
  return (
    <div className="flex flex-col items-center gap-3 text-center">
      <img src={logoAsset.url} alt="Travel Sync logo" className={`${imgSize} rounded-full`} />
      <span className={`whitespace-nowrap font-display ${textSize} leading-none`}>
        TRAVEL <span className="text-brand-orange">SYNC</span>
      </span>
      <Slogan className="text-sm" />
    </div>
  );
}

export function AppShell({ children, title, back }: { children: ReactNode; title?: string; back?: boolean }) {
  const [open, setOpen] = useState(false);
  const menu = useRef<HTMLElement>(null);
  const [scrollPaused, setScrollPaused] = useState(false);
  useEffect(() => {
    if (!open || scrollPaused || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let frame = 0; let previous = 0; let offset = 0; let restartAt = 0;
    const scroll = (time: number) => {
      const node = menu.current;
      if (node && previous && time >= restartAt) {
        const maximum = node.scrollHeight - node.clientHeight;
        offset += Math.min(time - previous, 100) * 0.009;
        if (offset >= maximum && maximum > 0) { offset = 0; restartAt = time + 1800; }
        node.scrollTop = offset;
      }
      previous = time; frame = requestAnimationFrame(scroll);
    };
    frame = requestAnimationFrame(scroll);
    return () => cancelAnimationFrame(frame);
  }, [open, scrollPaused]);
  const user = useStore((s) => s.user);
  const socials = useStore((s) => s.settings.socials);
  const posts = useStore((s) => s.posts);
  const settings = useStore((s) => s.settings);
  const alertCount = user ? nearbyOffers(user, posts, settings).filter((p) => !p.interests.some((i) => i.id === user.id)).length : 0;
  const nav = useNavigate();
  const lastCount = useRef(alertCount);
  useEffect(() => {
    if (alertCount > lastCount.current && "vibrate" in navigator) { try { navigator.vibrate([200, 100, 200]); } catch { /* unsupported */ } }
    lastCount.current = alertCount;
  }, [alertCount]);
  const [driverForm, setDriverForm] = useState(false);
  const [car, setCar] = useState("");
  const [plate, setPlate] = useState("");
  const [driverError, setDriverError] = useState("");
  const switchMode = () => {
    if (user && user.travelMode !== "driver" && (!user.car?.trim() || !user.plate?.trim())) {
      setCar(user.car ?? ""); setPlate(user.plate ?? ""); setDriverError(""); setOpen(false); setDriverForm(true); return;
    }
    setState(switchTravelMode); setOpen(false); nav({ to: "/" });
  };
  const saveDriver = () => {
    if (!car.trim()) return setDriverError("Enter your vehicle model.");
    if (!validPlate(plate)) return setDriverError("Enter a valid number plate, e.g. LEA-1234.");
    const vehicle = { car: car.trim(), plate: plate.trim().toUpperCase() };
    setState((s) => {
      if (!s.user) return s;
      const u = { ...s.user, ...vehicle, travelMode: "driver" as const };
      return { ...s, user: u, users: s.users.map((m) => m.id === u.id ? u : m) };
    });
    setDriverForm(false); nav({ to: "/" });
  };
  const items = [
    { to: user?.travelMode === "driver" ? "/nearby-requests" : "/nearby-rides", label: user?.travelMode === "driver" ? "Ride requests near you" : "Ride shared near you", icon: Car },
    { to: "/account", label: "Profile", icon: User },
    { to: "/account", label: "Security", icon: Shield },
    { to: "/account", label: "Privacy", icon: Lock },
    { to: "/info/faqs", label: "Q&A / FAQs", icon: HelpCircle },
    { to: "/info/terms", label: "Terms & Conditions", icon: FileText },
    { to: "/info/privacy-policy", label: "Privacy Policy", icon: FileText },
    { to: "/info/about", label: "About Us", icon: Info },
    { to: "/info/contact", label: "Contact Us", icon: Phone },
  ] as const;
  return (
    <div className="mx-auto min-h-screen max-w-md pb-10">
      <header className="sticky top-0 z-30 flex items-center gap-2 bg-background/90 px-3 py-3 backdrop-blur">
        {back ? (
          <button aria-label="Back" onClick={() => history.back()} className="grid h-11 w-11 place-items-center rounded-full bg-secondary"><ArrowLeft /></button>
        ) : (
          <Button variant="secondary" size="icon" aria-label="Menu" onClick={() => { setScrollPaused(false); setOpen(true); }} className="h-11 w-11 rounded-full"><Menu /></Button>
        )}
        <div className="min-w-0 flex-1">{title ? <h1 className="whitespace-nowrap font-display text-[clamp(1.25rem,6.5vw,1.875rem)] leading-none">{title}</h1> : <Logo className="ml-1" />}</div>
        {user && (
          <Link to={user.travelMode === "driver" ? "/nearby-requests" : "/nearby-rides"} aria-label={`${alertCount} ${user.travelMode === "driver" ? "ride requests" : "shared rides"} near you`} className="relative grid h-11 w-11 shrink-0 place-items-center rounded-full bg-secondary">
            <Bell className={`h-5 w-5 ${alertCount ? "bell-shake text-primary" : ""}`} />
            {alertCount > 0 && <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-destructive px-1 text-xs font-bold text-destructive-foreground">{alertCount > 99 ? "99+" : alertCount}</span>}
          </Link>
        )}
      </header>
      <main className="px-4">{children}</main>

      {driverForm && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-background/80 p-4" role="dialog" aria-modal="true" aria-label="Driver information">
          <div className="w-full max-w-sm card-box space-y-3 p-5 animate-in zoom-in-95 fade-in">
            <h2 className="font-display text-3xl">Become a driver</h2>
            <p className="text-sm text-muted-foreground">Add your vehicle details to share rides with passengers.</p>
            <label className="block text-sm font-semibold text-muted-foreground">Vehicle model
              <input className="field mt-1" placeholder="e.g. Honda City 2020" value={car} onChange={(e) => setCar(e.target.value)} /></label>
            <label className="block text-sm font-semibold text-muted-foreground">Number plate
              <input className="field mt-1 uppercase" placeholder="e.g. LEA-1234" value={plate} onChange={(e) => setPlate(e.target.value)} /></label>
            {driverError && <p className="text-sm text-destructive">{driverError}</p>}
            <Button className="btn-big h-auto" onClick={saveDriver}>Save & switch to driver</Button>
            <Button variant="ghost" className="w-full" onClick={() => setDriverForm(false)}>Cancel</Button>
          </div>
        </div>
      )}

      {open && (
        <div className="fixed inset-0 z-50 flex">
          <div className="flex h-dvh w-80 max-w-[85%] flex-col overflow-hidden bg-popover p-5 animate-in slide-in-from-left" onPointerDown={() => setScrollPaused(true)} onWheel={() => setScrollPaused(true)} onFocusCapture={() => setScrollPaused(true)}>
            <div className="mb-6 flex items-center justify-between"><Logo /><button aria-label="Close" onClick={() => setOpen(false)}><X /></button></div>
            {user && (
              <div className="mb-4 card-box p-4">
                <p className="text-lg font-bold">{user.name}</p>
                <p className="text-sm text-muted-foreground">{user.org}</p>
              </div>
            )}
            <nav ref={menu} aria-label="Member menu" className="min-h-0 flex-1 space-y-1 overflow-y-auto">
              {items.map((i) => (
                <Link key={i.label} to={i.to as "/account"} onClick={() => setOpen(false)} className="flex items-center gap-3 rounded-xl px-3 py-3 text-lg font-semibold hover:bg-secondary">
                  <i.icon className="h-5 w-5 text-primary" /> {i.label}
                </Link>
              ))}
              {user && (
                <button onClick={() => { setState((s) => ({ ...s, user: null })); setOpen(false); nav({ to: "/login" }); }} className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-lg font-semibold text-destructive">
                  <LogOut className="h-5 w-5" /> Logout
                </button>
              )}
            </nav>
            {user && <Button variant="secondary" className="my-4 min-h-14 w-full shrink-0 gap-2 whitespace-normal border border-primary/30 text-base font-bold" onClick={switchMode}>{user.travelMode === "driver" ? <Users /> : <Car />}Switch to {user.travelMode === "driver" ? "passenger" : "driver"}<ArrowLeftRight className="ml-auto" /></Button>}
            <div className="flex justify-center gap-4 border-t pt-4">
              {[[socials.whatsapp, MessageCircle], [socials.facebook, Facebook], [socials.linkedin, Linkedin], [socials.instagram, Instagram]].map(([href, Icon], i) => {
                const I = Icon as typeof MessageCircle;
                return <a key={i} href={href as string} target="_blank" rel="noreferrer" className="grid h-11 w-11 place-items-center rounded-full bg-secondary text-primary"><I className="h-5 w-5" /></a>;
              })}
            </div>
          </div>
          <div className="flex-1 bg-background/70" onClick={() => setOpen(false)} />
        </div>
      )}
    </div>
  );
}
