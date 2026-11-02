import { useEffect, useState } from "react";
import { MessageCircle, Facebook, Instagram, Send, Copy } from "lucide-react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { onShareSheet } from "@/lib/share";

export function ShareSheet() {
  const [data, setData] = useState<{ text: string; url: string } | null>(null);
  const [copied, setCopied] = useState(false);
  useEffect(() => onShareSheet((d) => { setCopied(false); setData(d); }), []);
  if (!data) return null;
  const msg = encodeURIComponent(`${data.text}\n${data.url}`);
  const u = encodeURIComponent(data.url);
  const options = [
    { label: "WhatsApp", icon: MessageCircle, href: `https://wa.me/?text=${msg}` },
    { label: "Facebook", icon: Facebook, href: `https://www.facebook.com/sharer/sharer.php?u=${u}` },
    { label: "Messenger", icon: Send, href: `fb-messenger://share/?link=${u}` },
    { label: "Instagram", icon: Instagram, href: "https://www.instagram.com/direct/inbox/" },
  ];
  const copy = async () => { try { await navigator.clipboard.writeText(`${data.text}\n${data.url}`); setCopied(true); } catch { /* ignore */ } };
  return (
    <Dialog open onOpenChange={(o) => { if (!o) setData(null); }}>
      <DialogContent className="max-w-[calc(100%-2rem)] rounded-lg sm:max-w-sm">
        <img src="/icon-192.png" alt="Travel Sync app icon" className="mx-auto h-16 w-16 rounded-lg" />
        <DialogTitle className="text-center font-display text-3xl">Share Travel Sync</DialogTitle>
        <DialogDescription className="text-center">travelsync1.netlify.app</DialogDescription>
        <div className="grid grid-cols-4 gap-2">
          {options.map((o) => (
            <a key={o.label} href={o.href} target="_blank" rel="noreferrer" onClick={() => { if (o.label === "Instagram") void copy(); }} className="flex flex-col items-center gap-1 rounded-lg bg-secondary p-2 text-xs font-semibold">
              <o.icon className="h-6 w-6 text-primary" />{o.label}
            </a>
          ))}
        </div>
        <button onClick={() => void copy()} className="flex items-center justify-center gap-2 text-sm text-muted-foreground"><Copy className="h-4 w-4" />{copied ? "Copied" : "Copy link"}</button>
      </DialogContent>
    </Dialog>
  );
}
