export const APP_LINK = "https://travelsync1.netlify.app";

export const APP_FEATURES =
  "🚗 Travel Sync — verified carpooling for Jobians & students in Pakistan.\n" +
  "✅ Verified members only\n✅ Share your ride or send a ride request\n" +
  "✅ Find route mates going your way\n✅ Save fuel & travel safely\n" +
  "Find your route mates!";

type Listener = (data: { text: string; url: string } | null) => void;
const listeners = new Set<Listener>();
export function onShareSheet(fn: Listener) { listeners.add(fn); return () => { listeners.delete(fn); }; }

let iconFile: File | null = null;
async function appIcon() {
  if (iconFile) return iconFile;
  try {
    const blob = await (await fetch("/icon-512.png")).blob();
    iconFile = new File([blob], "travel-sync.png", { type: "image/png" });
  } catch { /* icon optional */ }
  return iconFile;
}

/** Opens the phone's share sheet (WhatsApp, Facebook, Instagram…) with the app icon; falls back to our own share options. */
export async function shareText(title: string, text: string, url: string = APP_LINK) {
  const full = `${text}\n\n${APP_FEATURES}`;
  if (typeof navigator !== "undefined" && navigator.share) {
    try {
      const icon = await appIcon();
      const withFile = icon && navigator.canShare?.({ files: [icon] }) ? { files: [icon] } : {};
      await navigator.share({ title, text: `${full}\n${url}`, url, ...withFile });
      return;
    } catch (e) {
      if (e instanceof DOMException && e.name === "AbortError") return;
      try { await navigator.share({ title, text: full, url }); return; } catch (e2) {
        if (e2 instanceof DOMException && e2.name === "AbortError") return;
      }
    }
  }
  listeners.forEach((l) => l({ text: full, url }));
}

export const appUrl = () => APP_LINK;
