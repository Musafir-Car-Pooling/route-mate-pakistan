import { Link } from "@tanstack/react-router";
import { Home } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { IncomingOffers } from "@/components/IncomingOffers";
import { Button } from "@/components/ui/button";
import { useStore } from "@/lib/store";

export function NearbyOffersScreen({ title }: { title: string }) {
  const user = useStore((s) => s.user);
  return <AppShell title={title}>
    <Button asChild variant="outline" className="my-3"><Link to="/"><Home />Home</Link></Button>
    {user ? <IncomingOffers /> : <Button asChild className="w-full"><Link to="/login">Sign in</Link></Button>}
  </AppShell>;
}