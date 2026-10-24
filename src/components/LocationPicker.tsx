import { useState, type ReactNode } from "react";
import { Check, ChevronDown, MapPin, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

type Props = { label: string; value: string; locations: string[]; city?: string | undefined; icon?: ReactNode; onChange: (value: string) => void };

export function LocationPicker({ label, value, locations, city, icon, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const matches = locations.filter((location) => location.toLocaleLowerCase().includes(search.trim().toLocaleLowerCase()));
  return (
    <Dialog open={open} onOpenChange={(next) => { setOpen(next); setSearch(""); }}>
      <DialogTrigger asChild>
        <Button type="button" variant="secondary" aria-label={label} disabled={!locations.length} className="field h-auto min-w-0 justify-between whitespace-normal text-left">
          <span className="flex min-w-0 flex-1 items-center gap-2">
            <span className="grid h-5 w-5 shrink-0 place-items-center text-muted-foreground">{icon}</span>
            <span className="min-w-0 break-words">{value || label}</span>
          </span>
          <ChevronDown />
        </Button>
      </DialogTrigger>
      <DialogContent onOpenAutoFocus={(e) => e.preventDefault()} className="top-14 translate-y-0 w-[calc(100%-2rem)] max-w-md gap-3 rounded-lg p-4" aria-describedby={undefined}>
        <DialogTitle className="pr-6 font-display text-3xl tracking-normal">{label}</DialogTitle>
        <DialogDescription>{city}</DialogDescription>
        <div className="relative">
          <Search className="absolute left-3 top-4 h-5 w-5 text-muted-foreground" />
          <input className="field pl-10" aria-label="Search locations" placeholder="Search locations" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className="h-64 overflow-y-auto">
          {matches.map((location) => (
            <Button key={location} type="button" variant="ghost" className="h-auto min-h-12 w-full justify-start whitespace-normal border-b py-3 text-left text-base" onClick={() => { onChange(location); setOpen(false); }}>
              <MapPin className="text-primary" /><span className="min-w-0 flex-1 break-words">{location}</span>{value === location && <Check className="text-success" />}
            </Button>
          ))}
          {!matches.length && <p className="py-8 text-center text-muted-foreground">No locations found.</p>}
        </div>
      </DialogContent>
    </Dialog>
  );
}