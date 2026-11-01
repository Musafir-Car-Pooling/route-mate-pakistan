import { useEffect } from "react";
import { Link } from "@tanstack/react-router";
import { Home } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { IncomingOffers } from "@/components/IncomingOffers";
import { Button } from "@/components/ui/button";
import { useStore } from "@/lib/store";
import { markNearbySeen, nearbyOffers } from "@/lib/ride-alerts";

export function NearbyOffersScreen({ title }: { title: string }) {
  const user = useStore((s) => s.user);
  const posts = useStore((s) => s.posts);
  const settings = useStore((s) => s.settings);
  // Opening this screen acknowledges every current offer, so the bell count clears.
  useEffect(() => {
    if (user) markNearbySeen(user, nearbyOffers(user, posts, settings).map((p) => p.id));
  }, [user, posts, settings]);
  return <AppShell title={title}>
    <Button asChild variant="outline" className="my-3"><Link to="/"><Home />Home</Link></Button>
    {user ? <IncomingOffers /> : <Button asChild className="w-full"><Link to="/login">Sign in</Link></Button>}
  </AppShell>;
}