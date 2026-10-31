import { createFileRoute } from "@tanstack/react-router";
import { NearbyOffersScreen } from "@/components/NearbyOffersScreen";

export const Route = createFileRoute("/nearby-rides")({
  head: () => ({ meta: [
    { title: "Ride shared near you — Travel Sync" },
    { name: "description", content: "Review drivers sharing rides on your route and send your interest." },
    { property: "og:title", content: "Ride shared near you — Travel Sync" },
    { property: "og:description", content: "Find shared rides from Travel Sync members on your route." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: () => <NearbyOffersScreen title="Ride shared near you" />,
});