import { useEffect, useState } from "react";
import { ShieldCheck, Users, Route, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import commute from "@/assets/commute.jpg";

const features = [
  { title: "Your commute. Your circle.", text: "Connect with coworkers and students on your route.", icon: Users },
  { title: "Security comes first.", text: "Private contacts. A connection on your terms.", icon: ShieldCheck },
  { title: "Same route. Shared ride.", text: "Find company for your everyday journey.", icon: Route },
];

export function FeatureSlider() {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  useEffect(() => {
    if (paused || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = setInterval(() => setIndex((i) => (i + 1) % features.length), 5000);
    return () => clearInterval(timer);
  }, [paused]);
  const feature = features[index];
  if (!feature) return null;
  return (
    <section aria-label="Travel Sync features" aria-roledescription="carousel" className="relative -mx-4 h-52 overflow-hidden bg-secondary text-primary-foreground" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)} onFocusCapture={() => setPaused(true)} onBlurCapture={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setPaused(false); }}>
      <img src={commute} alt="Professionals sharing a commute outside an office" width={1536} height={1024} className="absolute inset-0 h-full w-full object-cover object-center" />
      <div className="absolute inset-0 bg-feature-shade" />
      <div key={index} className="feature-enter relative z-10 flex h-full flex-col justify-center px-5 pb-8">
        <feature.icon className="mb-2 size-6" />
        <h2 className="max-w-56 font-display text-3xl leading-none">{feature.title}</h2>
        <p className="mt-2 max-w-52 text-sm font-medium leading-snug">{feature.text}</p>
      </div>
      <div className="absolute inset-x-5 bottom-3 z-20 flex items-center justify-between">
        <div className="flex gap-1">{features.map((item, i) => <Button key={item.title} variant="ghost" size="icon" aria-label={`Show feature ${i + 1}`} aria-pressed={index === i} className="size-6 hover:bg-background/20" onClick={() => setIndex(i)}><span className={`h-1 rounded-full ${index === i ? "w-5 bg-primary-foreground" : "w-2 bg-primary-foreground/50"}`} /></Button>)}</div>
        <div className="flex gap-1"><Button variant="ghost" size="icon" className="size-7 bg-background/30 hover:bg-background/50" aria-label="Previous feature" onClick={() => setIndex((i) => (i + features.length - 1) % features.length)}><ChevronLeft /></Button><Button variant="ghost" size="icon" className="size-7 bg-background/30 hover:bg-background/50" aria-label="Next feature" onClick={() => setIndex((i) => (i + 1) % features.length)}><ChevronRight /></Button></div>
      </div>
    </section>
  );
}