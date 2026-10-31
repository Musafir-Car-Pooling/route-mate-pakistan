import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Star, BadgeCheck, Car, Clock, AlertTriangle, Loader2, XCircle, Trash2 } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Countdown } from "@/components/Countdown";
import { ContactButton } from "@/components/ContactFlow";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useStore, setState, isExpired, formatPKR, matchingPosts, type Interest, type Post, cancelOwnPost, canContactPost, deleteOwnPost } from "@/lib/store";

export const Route = createFileRoute("/post/$id")({
  head: () => ({
    meta: [
      { title: "Interested Members — Travel Sync" },
      { name: "description", content: "See verified members interested in your ride or request." },
      { property: "og:title", content: "Interested Members — Travel Sync" },
      { property: "og:description", content: "Verified members on your route." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PostPage,
});

function PostPage() {
  const { id } = Route.useParams();
  const post = useStore((s) => s.posts.find((p) => p.id === id));
  const settings = useStore((s) => s.settings);
  const user = useStore((s) => s.user);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const nav = useNavigate();
  const expired = post ? isExpired(post, settings) : false;

  const allPosts = useStore((s) => s.posts);
  const [sent, setSent] = useState<string[]>([]);

  if (!post) return <AppShell back title="Not found"><Link to="/" className="btn-big mt-10">Go home</Link></AppShell>;
  if (!user || post.ownerId !== user.id) return <AppShell back title="Offer unavailable"><p className="py-8">This offer is not available.</p></AppShell>;
  const isRide = post.kind === "ride";
  const available = canContactPost(post, settings, user.id);

  return (
    <AppShell back title={isRide ? "My Ride" : "My Request"}>
      <div className="card-box p-4">
        <p className="text-lg font-bold">{post.from} → {post.to}</p>
        <p className="text-sm text-muted-foreground">{post.genderPref === "female" ? "Females Only" : post.genderPref === "male" ? "Male Only" : "Anyone"}{isRide && ` · ${post.seats} seats`}</p>
        {post.notes && <p className="mt-2 rounded-xl bg-secondary p-3 text-sm">{post.notes}</p>}
      </div>

      <div className={`mt-3 flex items-center gap-3 rounded-lg p-4 ${!available ? "bg-destructive/15 text-destructive" : "bg-warning/15 text-warning"}`}>
        {!available ? <AlertTriangle className="shrink-0" /> : <Clock className="shrink-0" />}
        <div>
          <p className="font-display text-3xl leading-none">{post.cancelledAt ? "Cancelled" : !post.active ? "Inactive" : expired ? "Expired" : <Countdown post={post} />}</p>
          <p className="text-xs font-semibold">{available ? `This offer will expire in ${settings.hours} hours if contact is not unlocked.` : "Matching and new contact payments are closed."}</p>
        </div>
      </div>
      {available && <Button variant="outline" className="mt-3 w-full text-destructive" onClick={() => setConfirmCancel(true)}><XCircle className="size-4" />Cancel {isRide ? "ride" : "request"}</Button>}
      {post.cancelledAt && <Button variant="outline" className="mt-3 w-full text-destructive" onClick={() => { setState((s) => deleteOwnPost(s, post.id)); nav({ to: "/" }); }}><Trash2 className="size-4" />Delete {isRide ? "ride" : "request"}</Button>}
      <Dialog open={confirmCancel} onOpenChange={setConfirmCancel}><DialogContent className="max-w-sm rounded-lg"><DialogTitle>Cancel this {isRide ? "ride" : "request"}?</DialogTitle><DialogDescription>Matching will stop and no new contact payments can be made for this offer.</DialogDescription><Button variant="destructive" onClick={() => { setState((s) => cancelOwnPost(s, post.id)); setConfirmCancel(false); }}>Yes, cancel {isRide ? "ride" : "request"}</Button><Button variant="outline" onClick={() => setConfirmCancel(false)}>Keep {isRide ? "ride" : "request"}</Button></DialogContent></Dialog>

      <div className="mt-6 flex items-end justify-between">
        <h2 className="font-display text-3xl">Interested {isRide ? "Passengers" : "Drivers"}</h2>
        <span className="rounded-full bg-primary px-4 py-1 font-display text-2xl text-primary-foreground">{post.interests.length}</span>
      </div>

      {post.interests.length === 0 && available && (
        <div className="mt-4 flex items-center gap-3 card-box p-5 text-muted-foreground">
          <Loader2 className="animate-spin text-primary" /> Broadcasting to verified members on your route…
        </div>
      )}

      {available && <MatchingOffers post={post} posts={allPosts} sent={sent} onInterest={(target) => {
        const me: Interest = { id: user.id, name: user.name, org: user.org, gender: user.gender, rating: user.rating, reviews: 0, verified: user.verified, car: user.car || undefined, at: Date.now() };
        setState((s) => ({ ...s, posts: s.posts.map((x) => x.id === target.id && !x.interests.some((i) => i.id === me.id) ? { ...x, interests: [...x.interests, me] } : x) }));
        setSent((v) => [...v, target.id]);
      }} />}

      <div className="mt-3 space-y-3">
        {post.interests.map((p) => (
          <div key={p.id} className="card-box p-4 animate-in fade-in slide-in-from-bottom-2">
            <div className="flex items-center gap-3">
              <div className={`grid h-14 w-14 place-items-center rounded-full font-display text-2xl ${p.gender === "female" ? "bg-female/20 text-female" : "bg-primary/20 text-primary"}`}>{p.name.split(" ").map((w) => w[0]).join("")}</div>
              <div className="flex-1">
                <p className="flex items-center gap-1 text-lg font-bold">{p.name}{p.verified && <BadgeCheck className="h-5 w-5 text-success" />}</p>
                <p className="text-sm text-muted-foreground">{p.org} · {p.gender === "female" ? "Female" : "Male"}</p>
                <p className="flex items-center gap-1 text-sm"><Star className="h-4 w-4 fill-warning text-warning" />{p.rating} ({p.reviews} reviews){p.car && <><Car className="ml-2 h-4 w-4" />{p.car}</>}</p>
              </div>
            </div>
            <Button asChild variant="outline" size="connection" className="mt-3"><Link to="/reviews/$postId/$interestId" params={{ postId: post.id, interestId: p.id }}><Star className="size-4 text-warning" />View ratings & reviews</Link></Button>
            {available && <ContactButton post={post} person={p} />}
          </div>
        ))}
      </div>
    </AppShell>
  );
}

function MatchingOffers({ post, posts, sent, onInterest }: { post: Post; posts: Post[]; sent: string[]; onInterest: (p: Post) => void }) {
  const settings = useStore((s) => s.settings);
  const list = matchingPosts(post, posts, settings);
  return (
    <section className="mt-6">
      <h2 className="font-display text-3xl">{post.kind === "ride" ? "Passengers on your route" : "Rides on your route"}</h2>
      {list.length === 0 ? <p className="mt-2 text-sm text-muted-foreground">No matching {post.kind === "ride" ? "requests" : "rides"} yet. Members who post the same route will appear here.</p> : (
        <div className="mt-3 space-y-3">
          {list.map((m) => {
            const done = sent.includes(m.id) || m.interests.some((i) => i.id === post.ownerId);
            return (
              <div key={m.id} className="card-box p-4">
                <p className="text-lg font-bold">{m.ownerName}</p>
                <p className="text-sm text-muted-foreground">{m.from} → {m.to}{m.kind === "ride" && m.daily ? ` · ${formatPKR(m.daily)}/day` : ""}</p>
                <Button className="mt-3 w-full" disabled={done} onClick={() => onInterest(m)}>{done ? "Interest sent" : "I'm interested"}</Button>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
