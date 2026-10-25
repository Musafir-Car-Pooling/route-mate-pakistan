import { Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { Menu, X, User, Shield, Lock, HelpCircle, FileText, Info, Phone, LogOut, MessageCircle, Facebook, Linkedin, Instagram, ArrowLeft, Car, ArrowLeftRight, Users } from "lucide-react";
import { useStore, setState, switchTravelMode } from "@/lib/store";
import { Button } from "@/components/ui/button";
import logoAsset from "@/assets/travelsync-logo.png.asset.json";

export function Logo({ size = "text-3xl" }: { size?: string }) {
  return (
    <span className="flex items-center gap-2">
      <img src={logoAsset.url} alt="Travel Sync logo" width={36} height={36} className="h-9 w-9 rounded-full" />
      <span className={`font-display ${size} leading-none`}>
        TRAVEL <span className="text-primary">SYNC</span>
      </span>
    </span>
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
  const nav = useNavigate();
  const items = [
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
      <header className="sticky top-0 z-30 flex items-center gap-3 bg-background/90 px-4 py-3 backdrop-blur">
        {back ? (
          <button aria-label="Back" onClick={() => history.back()} className="grid h-11 w-11 place-items-center rounded-full bg-secondary"><ArrowLeft /></button>
        ) : (
          <Button variant="secondary" size="icon" aria-label="Menu" onClick={() => { setScrollPaused(false); setOpen(true); }} className="h-11 w-11 rounded-full"><Menu /></Button>
        )}
        <div className="flex-1">{title ? <h1 className="font-display text-3xl">{title}</h1> : <Logo />}</div>
        <img src={logoAsset.url} alt="Travel Sync" width={40} height={40} className="h-10 w-10 rounded-full" />
      </header>
      <main className="px-4">{children}</main>

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
            {user && <Button variant="secondary" className="my-4 min-h-14 w-full shrink-0 gap-2 whitespace-normal border border-primary/30 text-base font-bold" onClick={() => { setState(switchTravelMode); setOpen(false); nav({ to: "/" }); }}>{user.travelMode === "driver" ? <Users /> : <Car />}Switch to {user.travelMode === "driver" ? "passenger" : "driver"}<ArrowLeftRight className="ml-auto" /></Button>}
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
