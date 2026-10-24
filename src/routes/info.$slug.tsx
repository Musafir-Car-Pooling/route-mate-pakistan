import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { useStore } from "@/lib/store";

const titles: Record<string, string> = { about: "About Us", terms: "Terms & Conditions", "privacy-policy": "Privacy Policy", faqs: "Q&A / FAQs", contact: "Contact Us" };

export const Route = createFileRoute("/info/$slug")({
  head: ({ params }) => ({
    meta: [
      { title: `${titles[params.slug] ?? "Info"} — Travel Sync` },
      { name: "description", content: `${titles[params.slug] ?? "Information"} for Travel Sync verified carpooling.` },
      { property: "og:title", content: `${titles[params.slug] ?? "Info"} — Travel Sync` },
      { property: "og:description", content: "Travel Sync information page." },
    ],
  }),
  component: Info,
});

function Info() {
  const { slug } = Route.useParams();
  const text = useStore((s) => s.settings.pages[slug] ?? "Page not found.");
  return (
    <AppShell back title={titles[slug] ?? "Info"}>
      <div className="card-box whitespace-pre-line p-5 text-lg leading-relaxed">{text}</div>
    </AppShell>
  );
}
