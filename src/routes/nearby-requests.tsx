import { createFileRoute } from "@tanstack/react-router";
import { NearbyOffersScreen } from "@/components/NearbyOffersScreen";

export const Route = createFileRoute("/nearby-requests")({
  head: () => ({ meta: [
    { title: "Ride requests near you — Travel Sync" },
    { name: "description", content: "Review passengers requesting rides on your route and acknowledge their requests." },
    { property: "og:title", content: "Ride requests near you — Travel Sync" },
    { property: "og:description", content: "Find passenger ride requests on your Travel Sync route." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: () => <NearbyOffersScreen title="Ride requests near you" />,
});