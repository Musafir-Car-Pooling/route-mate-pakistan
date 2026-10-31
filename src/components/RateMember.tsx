import { useState } from "react";
import { Star, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useStore } from "@/lib/store";

/** Shown only after a contact is unlocked: lets the payer rate the member they talked to. */
export function RateMember({ targetId, name }: { targetId: string; name: string }) {
  const myId = useStore((s) => s.user?.id);
  const existing = useStore((s) => s.memberReviews.find((r) => r.id === `${myId}_${targetId}`));
  const [rating, setRating] = useState(existing?.rating ?? 0);
  const [text, setText] = useState(existing?.text ?? "");
  const [editing, setEditing] = useState(!existing);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  if (existing && !editing)
    return (
      <div className="mt-3 flex items-center gap-2 rounded-xl bg-success/10 p-3 text-sm animate-in fade-in">
        <CheckCircle2 className="size-5 shrink-0 text-success" />
        <span className="flex-1">You rated {name} <b>{existing.rating}★</b></span>
        <Button variant="ghost" size="sm" onClick={() => setEditing(true)}>Edit</Button>
      </div>
    );

  const save = async () => {
    if (!rating) return setErr("Tap a star to rate");
    setBusy(true); setErr("");
    try { const { submitReview } = await import("@/lib/cloud"); await submitReview(targetId, rating, text); setEditing(false); }
    catch { setErr("Couldn't save your review. Try again."); }
    finally { setBusy(false); }
  };

  return (
    <div className="mt-3 card-box space-y-3 p-4 animate-in fade-in slide-in-from-bottom-2">
      <div>
        <p className="font-display text-xl">Rate {name}</p>
        <p className="text-xs text-muted-foreground">After you have talked or travelled together, share your honest experience to help other members.</p>
      </div>
      <div className="flex justify-center gap-2" role="radiogroup" aria-label="Rating">
        {[1, 2, 3, 4, 5].map((n) => (
          <button key={n} type="button" role="radio" aria-checked={rating === n} aria-label={`${n} star${n > 1 ? "s" : ""}`} onClick={() => setRating(n)}
            className="transition-transform active:scale-90 hover:scale-110">
            <Star className={`size-9 ${n <= rating ? "fill-warning text-warning" : "text-muted-foreground"}`} />
          </button>
        ))}
      </div>
      <textarea className="field min-h-20 text-base" maxLength={500} placeholder="Write a short review (optional) — e.g. punctual, polite, safe driving" value={text} onChange={(e) => setText(e.target.value)} />
      {err && <p className="text-sm font-semibold text-destructive">{err}</p>}
      <Button size="contact" disabled={busy} onClick={save}>{busy ? "Saving…" : existing ? "Update Review" : "Submit Review"}</Button>
    </div>
  );
}
