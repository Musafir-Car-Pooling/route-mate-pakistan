import { createFileRoute, useNavigate, useRouter } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
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
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Info,
});

function Info() {
  const { slug } = Route.useParams();
  const router = useRouter();
  const navigate = useNavigate();
  const text = useStore((s) => s.settings.pages[slug] ?? "Page not found.");
  return (
    <AppShell back title={titles[slug] ?? "Info"}>
      <div className="card-box whitespace-pre-line p-5 text-lg leading-relaxed">{text}</div>
      <div className="h-20" />
      <button
        type="button"
        aria-label="Go back"
        onClick={() => (window.history.length > 1 ? router.history.back() : navigate({ to: "/" }))}
        className="fixed bottom-[calc(1.25rem+env(safe-area-inset-bottom))] left-5 z-40 grid h-14 w-14 place-items-center rounded-full bg-primary text-primary-foreground shadow-lg active:scale-95"
      >
        <ArrowLeft className="h-7 w-7" />
      </button>
    </AppShell>
  );
}
