import { useEffect, useState } from "react";
import { Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useStore, setState, isExpired, formatPKR, type Interest, type Post } from "@/lib/store";

const KEY = "travelsync-responses";

/** Shows rides to passengers and requests to drivers, with Interested / Not interested. */
export function IncomingOffers() {
  const user = useStore((s) => s.user);
  const posts = useStore((s) => s.posts);
  const settings = useStore((s) => s.settings);
  const [resp, setResp] = useState<Record<string, "yes" | "no">>({});
  useEffect(() => { try { setResp(JSON.parse(localStorage.getItem(KEY) || "{}")); } catch { /* ignore */ } }, []);
  if (!user) return null;
  const wantKind: Post["kind"] = user.travelMode === "driver" ? "request" : "ride";
  const list = posts
    .filter((p) => p.kind === wantKind && p.ownerId !== user.id && p.active && !p.cancelledAt && !isExpired(p, settings)
      && (!user.city || !p.city || p.city === user.city) && resp[p.id] !== "no")
    .sort((a, b) => b.createdAt - a.createdAt);
  const save = (id: string, v: "yes" | "no") => {
    const next = { ...resp, [id]: v };
    setResp(next);
    try { localStorage.setItem(KEY, JSON.stringify(next)); } catch { /* quota */ }
  };
  const interested = (p: Post) => {
    const me: Interest = { id: user.id, name: user.name, org: user.org, gender: user.gender, rating: user.rating, reviews: 0, verified: user.verified, car: user.car || undefined, at: Date.now() };
    setState((s) => ({ ...s, posts: s.posts.map((x) => x.id === p.id && !x.interests.some((i) => i.id === me.id) ? { ...x, interests: [...x.interests, me] } : x) }));
    save(p.id, "yes");
  };

  return (
    <section className="mt-6">
      <h3 className="mb-2 font-display text-2xl">{wantKind === "ride" ? "Rides shared near you" : "Ride requests near you"}</h3>
      {list.length === 0 ? (
        <p className="text-sm text-muted-foreground">No new {wantKind === "ride" ? "rides" : "requests"} right now.</p>
      ) : (
        <div className="space-y-3">
          {list.map((p) => {
            const done = resp[p.id] === "yes" || p.interests.some((i) => i.id === user.id);
            return (
              <div key={p.id} className="card-box p-4">
                <p className="text-xs font-bold uppercase text-primary">{p.kind === "ride" ? "Shared Ride" : "Ride Request"} · {p.ownerName}</p>
                <p className="font-bold">{p.from} → {p.to}</p>
                <p className="text-sm text-muted-foreground">
                  {p.genderPref === "female" ? "Females Only" : p.genderPref === "male" ? "Male Only" : "Anyone"}
                  {p.kind === "ride" && p.seats ? ` · ${p.seats} seats` : ""}
                  {p.kind === "ride" && p.daily ? ` · ${formatPKR(p.daily)}/day` : ""}
                </p>
                {p.notes && <p className="mt-2 rounded-xl bg-secondary p-2 text-sm">{p.notes}</p>}
                {done ? (
                  <p className="mt-3 flex items-center gap-1 font-semibold text-success"><Check className="size-4" />Interest sent</p>
                ) : (
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <Button onClick={() => interested(p)}><Check className="size-4" />Interested</Button>
                    <Button variant="outline" onClick={() => save(p.id, "no")}><X className="size-4" />Not interested</Button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
