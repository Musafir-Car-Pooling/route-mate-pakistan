import { useEffect, useRef, useState } from "react";
import { Download, Share, PlusSquare, LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";

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

  return (
    <Dialog open={open} onOpenChange={(next) => { if (!next) dismiss(); }}>
      <DialogContent className="max-w-[calc(100%-2rem)] rounded-lg sm:max-w-sm">
        <img src="/icon-192.png" width={80} height={80} alt="Travel Sync app icon" className="mx-auto h-20 w-20 rounded-lg" />
        <DialogTitle className="text-center font-display text-3xl">Install Travel Sync</DialogTitle>
        <DialogDescription className="text-center">Find your route mates</DialogDescription>
        {mode === "ios" && <p className="text-center text-sm leading-relaxed text-muted-foreground">In Safari, tap <Share className="inline h-4 w-4 text-primary" /> Share, then <PlusSquare className="inline h-4 w-4 text-primary" /> Add to Home Screen and Add. In other browsers, open this page in Safari first.</p>}
        {mode === "android" && <p className="text-center text-sm leading-relaxed text-muted-foreground">Open your browser menu ⋮ and choose Install app or Add to Home Screen, then confirm.</p>}
        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
        {mode === "native" && <Button size="contact" disabled={busy} onClick={() => void install()}>{busy ? <LoaderCircle className="animate-spin" /> : <Download />} {busy ? "Opening…" : "Install app"}</Button>}
        <Button variant="ghost" onClick={dismiss}>Not now</Button>
      </DialogContent>
    </Dialog>
  );
}