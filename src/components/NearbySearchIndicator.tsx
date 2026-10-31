import { Radar } from "lucide-react";

export function NearbySearchIndicator() {
  return (
    <section className="pt-4 text-center" aria-label="Shared rides near to you">
      <h2 className="font-display text-2xl leading-none">Shared rides near to you</h2>
      <div className="nearby-search mt-1 flex h-10 items-center gap-3 text-primary" aria-hidden="true">
        <SearchLine side="left" />
        <Radar className="nearby-search-icon size-6 shrink-0" strokeWidth={1.8} />
        <SearchLine side="right" />
      </div>
    </section>
  );
}

function SearchLine({ side }: { side: "left" | "right" }) {
  return (
    <svg viewBox="0 0 160 32" preserveAspectRatio="none" className={`nearby-search-line nearby-search-${side} h-8 min-w-0 flex-1`}>
      <path d="M0 16H160" className="nearby-search-baseline" />
      <path d="M0 16H44L50 16L55 9L60 23L65 3L70 29L75 12L80 16H160" className="nearby-search-signal" />
    </svg>
  );
}