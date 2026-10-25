import { useEffect, useRef, useState } from "react";
import { useStore } from "@/lib/store";

export function PartnerMarquee() {
  const companies = useStore((s) => s.companies).filter((c) => c.approved);
  const track = useRef<HTMLDivElement>(null);
  const [paused, setPaused] = useState(false);
  useEffect(() => {
    if (paused || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let frame = 0; let previous = 0;
    const scroll = (time: number) => {
      const node = track.current;
      if (node && previous) {
        const half = node.scrollWidth / 2;
        let offset = node.scrollLeft + Math.min(time - previous, 100) * 0.045;
        if (half > 0 && offset >= half) offset -= half;
        node.scrollLeft = offset;
      }
      previous = time; frame = requestAnimationFrame(scroll);
    };
    frame = requestAnimationFrame(scroll);
    return () => cancelAnimationFrame(frame);
  }, [paused, companies.length]);
  return <section aria-label="Partner companies" className="mt-6">
    <h3 className="mb-3 font-display text-2xl text-muted-foreground">Partner Companies</h3>
    <div ref={track} className="partner-window -mx-4 overflow-x-auto" onPointerDown={() => setPaused(true)} onTouchStart={() => setPaused(true)} onWheel={() => setPaused(true)}>
      <div className="flex w-max">
        {[0, 1].map((copy) => <div key={copy} aria-hidden={copy === 1 ? true : undefined} className="flex shrink-0 gap-3 pr-3">
          {companies.map((company) => <div key={company.id} className="flex h-16 w-28 shrink-0 items-center justify-center rounded-lg bg-secondary px-3 text-center text-sm font-bold">
            {company.logo ? <img src={company.logo} alt={company.name} loading="lazy" width={100} height={48} className="max-h-12 max-w-full object-contain" /> : company.name}
          </div>)}
        </div>)}
      </div>
    </div>
  </section>;
}
