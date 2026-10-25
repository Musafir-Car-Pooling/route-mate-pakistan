import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useStore, setState } from "@/lib/store";

export function AdminDepartments() {
  const departments = useStore((s) => s.settings.departments);
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  return (
    <section className="space-y-4">
      <h2 className="font-display text-3xl">Departments</h2>
      <form className="flex gap-2" onSubmit={(e) => {
        e.preventDefault();
        const value = name.trim();
        if (!value) return;
        if (departments.some((d) => d.toLowerCase() === value.toLowerCase())) return setError("Department already exists.");
        setState((s) => ({ ...s, settings: { ...s.settings, departments: [...s.settings.departments, value] } }));
        setName(""); setError("");
      }}>
        <input className="field min-w-0" aria-label="New department" placeholder="Department name" value={name} onChange={(e) => setName(e.target.value)} />
        <Button type="submit" className="h-auto shrink-0" disabled={!name.trim()} aria-label="Add department"><Plus /></Button>
      </form>
      <ul className="divide-y divide-border">
        {departments.map((department) => <li key={department} className="flex items-center gap-3 py-3">
          <span className="min-w-0 flex-1 break-words font-semibold">{department}</span>
          <Button variant="ghost" size="icon" title="Remove department" aria-label={`Remove department ${department}`} onClick={() => setState((s) => ({ ...s, settings: { ...s.settings, departments: s.settings.departments.filter((d) => d !== department) } }))}><Trash2 className="text-destructive" /></Button>
        </li>)}
      </ul>
      {!departments.length && <p className="text-muted-foreground">No departments added yet.</p>}
      {error && <p role="alert" className="text-destructive">{error}</p>}
    </section>
  );
}