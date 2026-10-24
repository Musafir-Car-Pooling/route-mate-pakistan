import { useState } from "react";
import { Plus, Trash2, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useStore, setState, uid } from "@/lib/store";

export function AdminLocations() {
  const cities = useStore((s) => s.settings.cities);
  const [name, setName] = useState("");
  const [cityId, setCityId] = useState("");
  const [location, setLocation] = useState("");
  const [error, setError] = useState("");
  const selected = cities.find((c) => c.id === cityId);
  const addCity = (e: React.FormEvent) => {
    e.preventDefault();
    const value = name.trim();
    if (!value) return;
    if (cities.some((c) => c.name.toLowerCase() === value.toLowerCase())) return setError("City already exists.");
    const id = uid();
    setState((s) => ({ ...s, settings: { ...s.settings, cities: [...s.settings.cities, { id, name: value, locations: [] }] } }));
    setCityId(id); setName(""); setLocation(""); setError("");
  };
  const addLocation = (e: React.FormEvent) => {
    e.preventDefault();
    const value = location.trim();
    if (!selected || !value) return;
    if (selected.locations.some((l) => l.toLowerCase() === value.toLowerCase())) return setError("Location already exists in this city.");
    setState((s) => ({ ...s, settings: { ...s.settings, cities: s.settings.cities.map((c) => c.id === cityId ? { ...c, locations: [...c.locations, value] } : c) } }));
    setLocation(""); setError("");
  };
  return (
    <section className="space-y-5">
      <h2 className="font-display text-3xl">Cities & Locations</h2>
      <form onSubmit={addCity} className="flex gap-2">
        <input className="field min-w-0" aria-label="New city" placeholder="City name" value={name} onChange={(e) => setName(e.target.value)} />
        <Button type="submit" className="h-auto shrink-0" disabled={!name.trim()}><Plus />Add City</Button>
      </form>
      <label className="block font-semibold">City
        <select className="field mt-2" aria-label="Manage city" value={selected?.id ?? ""} onChange={(e) => { setCityId(e.target.value); setLocation(""); setError(""); }}>
          <option value="">Select city</option>
          {cities.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </label>
      {!cities.length && <p className="text-muted-foreground">No cities added yet.</p>}
      {selected && <>
        <div className="flex items-center justify-between gap-3">
          <h3 className="font-display text-2xl">{selected.name} · {selected.locations.length} locations</h3>
          <Button variant="ghost" size="icon" aria-label={`Delete city ${selected.name}`} title="Delete city" onClick={() => {
            if (!window.confirm(`Delete ${selected.name} and all its locations?`)) return;
            setState((s) => ({ ...s, settings: { ...s.settings, cities: s.settings.cities.filter((c) => c.id !== cityId) } }));
            setCityId(""); setError("");
          }}><Trash2 className="text-destructive" /></Button>
        </div>
        <form onSubmit={addLocation} className="flex gap-2">
          <input className="field min-w-0" aria-label="New location" placeholder="Area / workplace / campus" value={location} onChange={(e) => setLocation(e.target.value)} />
          <Button type="submit" className="h-auto shrink-0" aria-label="Add location" title="Add location" disabled={!location.trim()}><Plus /></Button>
        </form>
        <ul className="divide-y divide-border">
          {selected.locations.map((l) => <li key={l} className="flex items-center gap-3 py-3">
            <MapPin className="h-5 w-5 shrink-0 text-primary" /><span className="min-w-0 flex-1 break-words font-semibold">{l}</span>
            <Button variant="ghost" size="icon" aria-label={`Remove location ${l}`} title="Remove location" onClick={() => setState((s) => ({ ...s, settings: { ...s.settings, cities: s.settings.cities.map((c) => c.id === cityId ? { ...c, locations: c.locations.filter((x) => x !== l) } : c) } }))}><Trash2 className="text-destructive" /></Button>
          </li>)}
        </ul>
        {!selected.locations.length && <p className="text-muted-foreground">No locations added for this city.</p>}
      </>}
      {error && <p role="alert" className="font-semibold text-destructive">{error}</p>}
    </section>
  );
}