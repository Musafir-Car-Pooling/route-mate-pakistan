import { useEffect } from "react";
import { useLocation, useNavigate } from "@tanstack/react-router";
import { useStore } from "@/lib/store";
import { getSeenNearby, markNearbySeen, nearbyOffers } from "@/lib/ride-alerts";

// Session-scoped delivery receipts (shared with the bell badge) prevent
// Back/Home from reopening the same offers.
export function NearbyOffersNavigation() {
  const user = useStore((s) => s.user);
  const admin = useStore((s) => s.admin);
  const posts = useStore((s) => s.posts);
  const settings = useStore((s) => s.settings);
  const pathname = useLocation({ select: (location) => location.pathname });
  const navigate = useNavigate();
  useEffect(() => {
    if (!user || admin) return;
    const seen = getSeenNearby(user);
    const offers = nearbyOffers(user, posts, settings);
    const target = user.travelMode === "driver" ? "/nearby-requests" : "/nearby-rides";
    const onNearby = pathname === target;
    // Do not interrupt profile editing, reviews or payment dialogs.
    if (!onNearby && pathname !== "/" && !pathname.startsWith("/post/")) return;
    if (!offers.some((offer) => !seen.has(offer.id))) return;
    markNearbySeen(user, offers.map((offer) => offer.id));
    if (!onNearby) void navigate({ to: target });
  }, [user, admin, posts, settings, pathname, navigate]);
  return null;
}