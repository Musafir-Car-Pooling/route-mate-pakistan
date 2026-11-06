import { useEffect, useState } from "react";
import { Check, X, Star, BadgeCheck, Car, ChevronDown, MessageSquare, Share2 } from "lucide-react";
import { shareText, appUrl } from "@/lib/share";
import { Button } from "@/components/ui/button";
import { useStore, setState, type Post } from "@/lib/store";
import { addMemberInterest, nearbyOffers, removeMemberInterest } from "@/lib/ride-alerts";

const KEY = "travelsync-responses";

/** Shows rides to passengers and requests to drivers, with Interested / Not interested. */
export function IncomingOffers() {
  const user = useStore((s) => s.user);
  const posts = useStore((s) => s.posts);
  const settings = useStore((s) => s.settings);
  const [open, setOpen] = useState<string | null>(null);
  const [resp, setResp] = useState<Record<string, "yes" | "no">>({});
  useEffect(() => { setResp({}); try { setResp(JSON.parse(localStorage.getItem(`${KEY}:${user?.id}`) || "{}")); } catch { /* ignore */ } }, [user?.id]);
  if (!user) return null;
  const wantKind: Post["kind"] = user.travelMode === "driver" ? "request" : "ride";
  const list = nearbyOffers(user, posts, settings).filter((p) => resp[p.id] !== "no");
  const save = (id: string, v: "yes" | "no") => {
    const next = { ...resp, [id]: v };
    setResp(next);
    try { localStorage.setItem(`${KEY}:${user.id}`, JSON.stringify(next)); } catch { /* quota */ }
  };
  const forget = (id: string) => {
    const next = { ...resp };
    delete next[id];
    setResp(next);
    try { localStorage.setItem(`${KEY}:${user.id}`, JSON.stringify(next)); } catch { /* quota */ }
  };
  const interested = (p: Post) => {
    setState((s) => addMemberInterest(s, p.id));
    save(p.id, "yes");
  };
  const cancelInterest = (p: Post) => {
    setState((s) => removeMemberInterest(s, p.id));
    forget(p.id);
  };

  return (
    <section className="mt-2">
      {list.length === 0 ? (
        <p className="text-sm text-muted-foreground">No new {wantKind === "ride" ? "rides" : "requests"} right now.</p>
      ) : (
        <div className="space-y-3">
          {list.map((p) => {
            const done = resp[p.id] === "yes" || p.interests.some((i) => i.id === user.id);
            return (
              <div key={p.id} className="card-box p-4">
                <div className="flex items-start justify-between gap-2"><p className="text-xs font-bold uppercase text-primary">{p.kind === "ride" ? "Shared Ride" : "Ride Request"} · {p.ownerName}</p>
                  <Button type="button" variant="ghost" size="icon" className="-mr-2 -mt-2 shrink-0" aria-label={`Share this ${p.kind === "ride" ? "ride" : "request"}`} onClick={() => void shareText("Travel Sync", `${p.kind === "ride" ? "Shared ride" : "Ride request"} on Travel Sync: ${p.from} → ${p.to}${p.city ? ` (${p.city})` : ""}. Join Travel Sync to connect.`, appUrl())}><Share2 className="size-5 text-primary" /></Button></div>
                <p className="font-bold">{p.from} → {p.to}</p>
                <p className="text-sm text-muted-foreground">
                  {p.genderPref === "female" ? "Females Only" : p.genderPref === "male" ? "Male Only" : "Anyone"}
                  {p.kind === "ride" && p.seats ? ` · ${p.seats} seats` : ""}
                </p>
                {p.notes && <p className="mt-2 rounded-xl bg-secondary p-2 text-sm">{p.notes}</p>}
                <Button type="button" variant="outline" size="connection" onClick={() => setOpen(open === p.id ? null : p.id)} aria-expanded={open === p.id}
                  className="mt-3 flex w-full items-center justify-between">
                  <span className="flex items-center gap-1"><Star className="size-4 fill-warning text-warning" />{p.ownerRating?.toFixed(1) ?? "Unrated"} · View ratings & reviews</span>
                  <ChevronDown className={`size-4 transition-transform ${open === p.id ? "rotate-180" : ""}`} />
                </Button>
                {open === p.id && (
                  <div className="mt-2 rounded-xl bg-secondary p-3 text-sm">
                    <p className="text-lg font-bold">{p.ownerName}</p>
                    {p.ownerOrg && <p className="text-muted-foreground">{p.ownerOrg}</p>}
                    {p.ownerVerified && <p className="mt-1 flex items-center gap-1 text-success"><BadgeCheck className="size-4" />Verified member</p>}
                    {p.ownerCar && <p className="mt-1 flex items-center gap-1 text-muted-foreground"><Car className="size-4" />{p.ownerCar}</p>}
                    <div className="mt-2 flex items-center gap-1">{[1, 2, 3, 4, 5].map((n) => <Star key={n} className={`size-4 ${n <= Math.round(p.ownerRating ?? 0) ? "fill-warning text-warning" : "text-muted-foreground"}`} />)}<span className="ml-1 font-semibold">{p.ownerRating !== undefined ? `${p.ownerRating.toFixed(1)} / 5` : "Not rated yet"}</span></div>
                    <p className="mt-2 flex items-center gap-1 text-muted-foreground"><MessageSquare className="size-4" />No written reviews yet.</p>
                  </div>
                )}
                {done ? (
                  <div className="mt-3 flex items-center justify-between gap-2">
                    <p className="flex items-center gap-1 font-semibold text-success"><Check className="size-4" />Interest sent</p>
                    <Button type="button" variant="outline" size="connection" onClick={() => cancelInterest(p)}><X className="size-4" />Cancel interest</Button>
                  </div>
                ) : (
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <Button onClick={() => interested(p)}><Check className="size-4" />Interested</Button>
                    <Button variant="outline" onClick={() => { if (p.interests.some((i) => i.id === user.id)) setState((s) => removeMemberInterest(s, p.id)); save(p.id, "no"); }}><X className="size-4" />Not interested</Button>
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
