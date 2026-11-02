import { useEffect, useRef, useState } from "react";
import { Share, PlusSquare, LoaderCircle, X } from "lucide-react";

interface InstallEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function InstallAppPrompt() {
  const deferred = useRef<InstallEvent | null>(null);
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"native" | "ios" | "android" | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const display = window.matchMedia("(display-mode: standalone)");
    const installed = () => display.matches || (navigator as Navigator & { standalone?: boolean }).standalone === true;
    if (installed()) return;
    let dismissed = false;
    try { dismissed = sessionStorage.getItem("travelsync-install-dismissed") === "yes"; } catch { /* Storage may be unavailable. */ }
    let timer: ReturnType<typeof setTimeout> | undefined;
    const offer = (nextMode: "native" | "ios" | "android") => {
      setMode(nextMode);
      if (dismissed) return;
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => { if (!installed()) setOpen(true); }, 4500);
    };
    const onPrompt = (event: Event) => {
      event.preventDefault();
      deferred.current = event as InstallEvent;
      offer("native");
    };
    const onInstalled = () => {
      deferred.current = null;
      if (timer) clearTimeout(timer);
      setOpen(false);
      setMode(null);
    };
    const onDisplayChange = () => { if (installed()) onInstalled(); };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    display.addEventListener("change", onDisplayChange);
    const ua = navigator.userAgent;
    const ios = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    if (ios) offer("ios");
    else if (/Android/.test(ua)) offer("android");
    return () => {
      if (timer) clearTimeout(timer);
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
      display.removeEventListener("change", onDisplayChange);
    };
  }, []);

  const dismiss = () => {
    setOpen(false);
    try { sessionStorage.setItem("travelsync-install-dismissed", "yes"); } catch { /* Storage may be unavailable. */ }
  };
  const install = async () => {
    const event = deferred.current;
    if (!event || busy) return;
    setBusy(true); setError("");
    try {
      await event.prompt();
      const choice = await event.userChoice;
      deferred.current = null;
      if (choice.outcome === "accepted") setOpen(false);
      else dismiss();
    } catch {
      deferred.current = null;
      setError("Open your browser menu and choose Install app or Add to Home Screen.");
      setMode(/Android/.test(navigator.userAgent) ? "android" : null);
    } finally { setBusy(false); }
  };

  if (!open) return null;
  return (
    <div role="dialog" aria-label="Install Travel Sync" className="fixed inset-x-3 top-3 z-[60] mx-auto max-w-md rounded-2xl bg-popover p-4 shadow-2xl animate-in slide-in-from-top fade-in">
      <div className="flex items-center gap-3">
        <img src="/icon-192.png" width={56} height={56} alt="Travel Sync app icon" className="h-14 w-14 shrink-0 rounded-xl" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-lg font-semibold">Install Travel Sync</p>
          <p className="truncate text-sm text-muted-foreground">travelsync1.netlify.app</p>
        </div>
        {mode === "native" && <button aria-label="Install app" disabled={busy} onClick={() => void install()} className="px-2 text-lg font-semibold text-primary">{busy ? <LoaderCircle className="animate-spin" /> : "Install"}</button>}
        <button aria-label="Not now" onClick={dismiss} className="text-muted-foreground"><X className="h-5 w-5" /></button>
      </div>
      {mode === "ios" && <p className="mt-2 text-sm text-muted-foreground">Tap <Share className="inline h-4 w-4 text-primary" /> Share, then <PlusSquare className="inline h-4 w-4 text-primary" /> Add to Home Screen.</p>}
      {mode === "android" && <p className="mt-2 text-sm text-muted-foreground">Open browser menu ⋮ → Install app / Add to Home Screen.</p>}
      {error && <p role="alert" className="mt-2 text-sm text-destructive">{error}</p>}
    </div>
  );
}