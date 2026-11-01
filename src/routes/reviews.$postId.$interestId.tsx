import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Star, BadgeCheck, Car, MessageSquare, ArrowLeft } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { ContactButton } from "@/components/ContactFlow";
import { useStore, canContactPost, reviewsFor } from "@/lib/store";

export const Route = createFileRoute("/reviews/$postId/$interestId")({
  head: () => ({ meta: [
    { title: "Member Ratings & Reviews — Travel Sync" },
    { name: "description", content: "View member ratings and commute reviews before unlocking a Travel Sync contact." },
    { property: "og:title", content: "Member Ratings & Reviews — Travel Sync" },
    { property: "og:description", content: "Review a member's carpooling reputation before connecting." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: MemberReviews,
});

function MemberReviews() {
  const { postId, interestId } = Route.useParams();
  const post = useStore((s) => s.posts.find((p) => p.id === postId));
  const user = useStore((s) => s.user);
  const settings = useStore((s) => s.settings);
  const stored = useStore((s) => s.memberReviews);
  const [sort, setSort] = useState<"recent" | "highest" | "lowest">("recent");
  const person = post?.interests.find((p) => p.id === interestId);
  if (!user) return <AppShell back title="Member reviews"><Link to="/login" className="btn-big mt-8">Login</Link></AppShell>;
  if (!post || !person || post.ownerId !== user.id) return <AppShell back title="Member reviews"><p className="py-8 text-muted-foreground">Member unavailable.</p></AppShell>;
  // Demo members: use the admin's current review list so reviews added later still show.
  const demo = person.id.startsWith("demo_") ? settings.demoUsers?.find((d) => "demo_" + d.id === person.id) : undefined;
  const entries = [...reviewsFor(person.id, stored), ...(demo ? demo.reviews : person.reviewEntries ?? [])];
  const average = entries.length ? entries.reduce((sum, review) => sum + review.rating, 0) / entries.length : null;
  const sorted = [...entries].sort((a, b) => sort === "recent" ? b.at - a.at : sort === "highest" ? b.rating - a.rating : a.rating - b.rating);
  const contactable = canContactPost(post, settings, user.id);
  return (
    <AppShell back title="Ratings & reviews">
      <section className="flex items-center gap-4 py-5">
        <div className="grid size-20 shrink-0 place-items-center rounded-full bg-primary/15 font-display text-3xl text-primary">{person.name.split(" ").map((n) => n[0]).join("")}</div>
        <div className="min-w-0"><h2 className="text-2xl font-bold break-words">{person.name}</h2><p className="text-muted-foreground">{person.org}</p><p className="mt-1 flex items-center gap-1 text-sm text-success">{person.verified && <><BadgeCheck className="size-4" />Verified member</>}</p>{person.car && <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground"><Car className="size-4" />{person.car}</p>}</div>
      </section>
      {person.demo && <p className="mb-4 rounded-lg border border-warning/30 bg-warning/10 px-3 py-2 text-sm text-warning">Demo member · sample ratings and reviews</p>}
      <section className="grid grid-cols-[100px_1fr] gap-5 border-y py-5">
        <div><p className="font-display text-6xl leading-none">{average === null ? "—" : average.toFixed(1)}</p><div className="mt-2 flex gap-0.5" aria-label={average === null ? "Not rated" : `${average.toFixed(1)} out of 5 stars`}>{[1, 2, 3, 4, 5].map((n) => <Star key={n} className={`size-4 ${average !== null && n <= Math.round(average) ? "fill-warning text-warning" : "text-muted-foreground"}`} />)}</div><p className="mt-2 text-sm text-muted-foreground">{entries.length} {entries.length === 1 ? "review" : "reviews"}</p></div>
        <div className="space-y-2">{[5, 4, 3, 2, 1].map((rating) => { const count = entries.filter((r) => r.rating === rating).length; return <div key={rating} className="flex items-center gap-2 text-xs"><span className="w-2">{rating}</span><Star className="size-3 text-warning" /><meter min={0} max={Math.max(1, entries.length)} value={count} aria-label={`${rating} stars: ${count} reviews`} className="rating-meter h-2 flex-1" /><span className="w-3 text-right text-muted-foreground">{count}</span></div>; })}</div>
      </section>
      <div className="flex items-center justify-between gap-3 py-5"><h3 className="font-display text-2xl">Member feedback</h3><select aria-label="Sort reviews" className="rounded-lg border bg-secondary px-2 py-2 text-sm" value={sort} onChange={(e) => { const value = e.target.value; if (value === "recent" || value === "highest" || value === "lowest") setSort(value); }}><option value="recent">Most recent</option><option value="highest">Highest rated</option><option value="lowest">Lowest rated</option></select></div>
      {!entries.length && <div className="py-8 text-center text-muted-foreground"><MessageSquare className="mx-auto mb-3 size-8" /><p>No written reviews yet.</p></div>}
      <div className="space-y-3">{sorted.map((review) => <article key={review.id} className="rounded-lg border bg-card p-4"><div className="flex items-center gap-3"><div className="grid size-9 shrink-0 place-items-center rounded-full bg-secondary font-bold">{review.author[0]}</div><div className="min-w-0 flex-1"><p className="font-semibold">{review.author}</p><time className="text-xs text-muted-foreground" dateTime={new Date(review.at).toISOString()}>{new Date(review.at).toLocaleDateString("en-PK", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" })}</time></div><span className="flex items-center gap-1 font-semibold"><Star className="size-4 fill-warning text-warning" />{review.rating}</span></div><p className="mt-3 text-sm leading-relaxed">{review.text}</p></article>)}</div>
      <div className="sticky bottom-0 mt-5 border-t bg-background py-3">{contactable ? <ContactButton post={post} person={person} /> : <p className="py-2 text-center font-semibold text-muted-foreground">{post.cancelledAt ? "Offer cancelled" : "Offer unavailable"}</p>}<Button asChild variant="ghost" className="mt-2 w-full"><Link to="/post/$id" params={{ id: post.id }}><ArrowLeft className="size-4" />Back to {post.kind === "ride" ? "ride" : "request"}</Link></Button></div>
    </AppShell>
  );
}