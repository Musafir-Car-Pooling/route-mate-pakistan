import { useEffect } from "react";
import { useLocation, useNavigate } from "@tanstack/react-router";
import { useStore } from "@/lib/store";
import { nearbyOffers } from "@/lib/ride-alerts";

// Session-scoped delivery receipts prevent Back/Home from reopening the same offers.
const delivered = new Map<string, Set<string>>();
export function NearbyOffersNavigation() {
  const user = useStore((s) => s.user);
  const admin = useStore((s) => s.admin);
  const posts = useStore((s) => s.posts);
  const settings = useStore((s) => s.settings);
  const pathname = useLocation({ select: (location) => location.pathname });
  const navigate = useNavigate();
  useEffect(() => {
    if (!user || admin) return;
    const key = `${user.id}:${user.travelMode ?? "passenger"}`;
    let seen = delivered.get(key);
    if (!seen) {
      try { seen = new Set(JSON.parse(sessionStorage.getItem(`nearby:${key}`) ?? "[]") as string[]); }
      catch { seen = new Set(); }
      delivered.set(key, seen);
    }
    const offers = nearbyOffers(user, posts, settings);
    const target = user.travelMode === "driver" ? "/nearby-requests" : "/nearby-rides";
    const onNearby = pathname === target;
    // Do not interrupt profile editing, reviews or payment dialogs.
    if (!onNearby && pathname !== "/" && !pathname.startsWith("/post/")) return;
    if (!offers.some((offer) => !seen.has(offer.id))) return;
    offers.forEach((offer) => seen.add(offer.id));
    try { sessionStorage.setItem(`nearby:${key}`, JSON.stringify([...seen])); } catch { /* storage unavailable */ }
    if (!onNearby) void navigate({ to: target });
  }, [user, admin, posts, settings, pathname, navigate]);
  return null;
}