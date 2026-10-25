import { useState } from "react";
import { Building2, Briefcase, Home, Save } from "lucide-react";
import { LocationPicker } from "@/components/LocationPicker";
import { Button } from "@/components/ui/button";
import { getState, setState, useStore, locationsForCity, validRegistrationCatalog, type User } from "@/lib/store";

export function ProfileSelections({ user }: { user: User }) {
  const settings = useStore((s) => s.settings);
  const companies = useStore((s) => s.companies);
  const [selection, setSelection] = useState({ cityId: settings.cities.find((c) => c.name === user.city)?.id ?? "", org: user.org, dept: user.dept, home: user.home, work: user.work });
  const [message, setMessage] = useState("");
  const city = settings.cities.find((c) => c.id === selection.cityId);
  const locations = locationsForCity(settings.cities, selection.cityId);
  const organizations = companies.filter((c) => c.approved).map((c) => c.name);
  const change = (key: keyof typeof selection, value: string) => { setSelection((s) => ({ ...s, [key]: value })); setMessage(""); };
  const save = () => {
    const current = getState();
    const selectedCity = current.settings.cities.find((c) => c.id === selection.cityId);
    if (!selectedCity || !validRegistrationCatalog(current.settings, current.companies, { ...selection, role: user.role })) return setMessage("Select your organization, department and addresses from the available lists.");
    setState((s) => {
      if (s.user?.id !== user.id) return s;
      const updated = { ...s.user, org: selection.org, dept: selection.dept, city: selectedCity.name, home: selection.home, work: selection.work };
      return { ...s, user: updated, users: s.users.map((u) => u.id === updated.id ? updated : u) };
    });
    setMessage("Profile updated");
  };
  return (
    <section className="mt-6 space-y-3 border-t pt-5">
      <h2 className="font-display text-2xl">Work & commute</h2>
      <label className="block text-sm font-semibold text-muted-foreground">City
        <select className="field mt-1" aria-label="Profile city" value={city?.id ?? ""} onChange={(e) => { setSelection((s) => ({ ...s, cityId: e.target.value, home: "", work: "" })); setMessage(""); }}>
          <option value="">Select city</option>{settings.cities.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </label>
      <LocationPicker label={user.role === "jobian" ? "Company name" : "Institute name"} value={organizations.includes(selection.org) ? selection.org : ""} locations={organizations} icon={<Building2 className="size-5" />} searchLabel="Search organizations" onChange={(v) => change("org", v)} />
      {user.role === "jobian" && <LocationPicker label="Department" value={settings.departments.includes(selection.dept) ? selection.dept : ""} locations={settings.departments} icon={<Briefcase className="size-5" />} searchLabel="Search departments" onChange={(v) => change("dept", v)} />}
      <LocationPicker label="Home address" value={locations.includes(selection.home) ? selection.home : ""} locations={locations} city={city?.name} icon={<Home className="size-5" />} onChange={(v) => change("home", v)} />
      <LocationPicker label={user.role === "jobian" ? "Workplace address" : "Campus address"} value={locations.includes(selection.work) ? selection.work : ""} locations={locations} city={city?.name} icon={<Building2 className="size-5" />} onChange={(v) => change("work", v)} />
      <Button className="btn-big h-auto text-xl" onClick={save}><Save className="size-5" />Save profile</Button>
      {message && <p role="status" className="text-sm font-semibold">{message}</p>}
    </section>
  );
}