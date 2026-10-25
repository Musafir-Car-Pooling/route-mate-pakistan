import { useEffect, useState } from "react";
import { ShieldCheck, Users, Route } from "lucide-react";
import men from "@/assets/carpool-men.jpg";
import women from "@/assets/carpool-women.jpg";
import { useStore } from "@/lib/store";

const features = [
  { title: "Your commute. Your circle.", text: "Connect with coworkers and students on your route.", icon: Users },
  { title: "Security comes first.", text: "Private contacts. A connection on your terms.", icon: ShieldCheck },
  { title: "Same route. Shared ride.", text: "Find company for your everyday journey.", icon: Route },
];

export function FeatureSlider() {
  const uploads = useStore((s) => s.settings.slides);
  const images = uploads.length ? uploads : [men, women];
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  useEffect(() => {
    if (paused || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = setInterval(() => setIndex((i) => (i + 1) % features.length), 5000);
    return () => clearInterval(timer);
  }, [paused]);
  const feature = features[index % features.length];
  if (!feature) return null;
  return (
    <section aria-label="Travel Sync features" aria-roledescription="carousel" className="relative -mx-4 h-40 overflow-hidden bg-secondary text-primary-foreground" onTouchStart={() => setPaused(true)} onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)} onFocusCapture={() => setPaused(true)} onBlurCapture={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setPaused(false); }}>
      {images.map((image, i) => <img key={image + i} src={image} alt={uploads.length ? "Professional carpooling" : i === 0 ? "Two male professionals carpooling outside their office" : "Two female professionals carpooling outside their office"} width={960} height={640} className={`absolute inset-0 h-full w-full object-cover object-center transition-opacity duration-700 ${index % images.length === i ? "opacity-100" : "opacity-0"}`} />)}
      <div className="absolute inset-0 bg-feature-shade" />
      <div key={index} className="feature-enter relative z-10 flex h-full flex-col justify-center px-4">
        <feature.icon className="mb-2 size-5" />
        <h2 className="max-w-44 font-display text-2xl leading-none">{feature.title}</h2>
        <p className="mt-2 max-w-40 text-xs font-medium leading-snug">{feature.text}</p>
      </div>
    </section>
  );
}