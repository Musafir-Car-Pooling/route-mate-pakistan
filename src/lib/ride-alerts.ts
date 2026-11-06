import { isExpired, type Interest, type Post, type Settings, type User } from "./store";

export type RideAlert = { id: string; kind: "offer" | "interest"; title: string; at: number; post: Post; person?: Interest };
/** How closely a post follows one of the member's routes: 3 exact, 2 reverse trip, 1 shares a stop, 0 same city only. */
function routeScore(p: Post, routes: { city?: string; from: string; to: string }[]) {
  let best = -1;
  for (const r of routes) {
    if (!r.city || r.city !== p.city) continue;
    const score = r.from === p.from && r.to === p.to ? 3 : r.from === p.to && r.to === p.from ? 2
      : [p.from, p.to].some((stop) => stop && (stop === r.from || stop === r.to)) ? 1 : 0;
    best = Math.max(best, score);
  }
  return best;
}
// Offers anywhere in the member's city are shown, closest routes first, so members on
// slightly different stops still see each other.
export function nearbyOffers(user: User, posts: Post[], settings: Settings, now = Date.now()) {
  const kind = user.travelMode === "driver" ? "request" : "ride";
  const routes = [{ city: user.city, from: user.home, to: user.work }, ...posts.filter((p) => p.ownerId === user.id && p.active && !p.cancelledAt && !isExpired(p, settings, now))];
  return posts
    .filter((p) => p.kind === kind && p.ownerId !== user.id && p.active && !p.cancelledAt && !isExpired(p, settings, now)
      && (p.genderPref === "any" || p.genderPref === user.gender))
    .map((p) => ({ p, score: routeScore(p, routes) }))
    .filter((x) => x.score >= 0)
    .sort((a, b) => b.score - a.score || b.p.createdAt - a.p.createdAt)
    .map((x) => x.p);
}
export function memberAlerts(user: User, posts: Post[], settings: Settings, now = Date.now()): RideAlert[] {
  const offers: RideAlert[] = nearbyOffers(user, posts, settings, now).map((post) => ({ id: `offer:${post.id}`, kind: "offer", title: post.kind === "ride" ? "New driver is traveling on your route" : "New passenger needs a ride on your route", at: post.createdAt, post }));
  const interests: RideAlert[] = posts.filter((p) => p.ownerId === user.id && p.kind === (user.travelMode === "driver" ? "ride" : "request") && p.active && !p.cancelledAt && !isExpired(p, settings, now))
    .flatMap((post) => post.interests.filter((person) => person.id !== user.id && person.at <= now).map((person) => ({ id: `interest:${post.id}:${person.id}:${person.at}`, kind: "interest" as const, title: post.kind === "ride" ? "A passenger is interested in your ride" : "A driver is interested in your request", at: person.at, post, person })));
  return [...offers, ...interests].sort((a, b) => b.at - a.at);
}

export function addMemberInterest(state: import("./store").State, postId: string, now = Date.now()) {
  const user = state.user;
  const post = state.posts.find((p) => p.id === postId);
  if (!user || !post || !nearbyOffers(user, state.posts, state.settings, now).some((p) => p.id === postId) || post.interests.some((i) => i.id === user.id)) return state;
  const person: Interest = { id: user.id, name: user.name, org: user.org, gender: user.gender, rating: user.rating, reviews: 0, verified: user.verified, car: user.car || undefined, hidePhone: user.hidePhone || undefined, at: now };
  return { ...state, posts: state.posts.map((p) => p.id === postId ? { ...p, interests: [...p.interests, person] } : p) };
}

/** The interested member withdraws their own interest; other members' entries stay untouched. */
export function removeMemberInterest(state: import("./store").State, postId: string) {
  const user = state.user;
  const post = state.posts.find((p) => p.id === postId);
  if (!user || !post || !post.interests.some((i) => i.id === user.id)) return state;
  return { ...state, posts: state.posts.map((p) => p.id === postId ? { ...p, interests: p.interests.filter((i) => i.id !== user.id) } : p) };
}

// Delivery receipts: offers the member has already opened on the nearby screen.
// Session-scoped so a fresh login counts everything again, and shared between the
// bell badge, the auto-navigation and the nearby screen so they never disagree.
const seenCache = new Map<string, Set<string>>();
const seenListeners = new Set<() => void>();
export const nearbySeenKey = (user: User) => `${user.id}:${user.travelMode ?? "passenger"}`;
export function getSeenNearby(user: User): Set<string> {
  const key = nearbySeenKey(user);
  let seen = seenCache.get(key);
  if (!seen) {
    seen = new Set<string>();
    if (typeof sessionStorage !== "undefined") {
      try { seen = new Set(JSON.parse(sessionStorage.getItem(`nearby:${key}`) ?? "[]") as string[]); } catch { /* storage unavailable */ }
    }
    seenCache.set(key, seen);
  }
  return seen;
}
export function markNearbySeen(user: User, ids: string[]) {
  if (!ids.length) return;
  const seen = getSeenNearby(user);
  ids.forEach((id) => seen.add(id));
  if (typeof sessionStorage !== "undefined") {
    try { sessionStorage.setItem(`nearby:${nearbySeenKey(user)}`, JSON.stringify([...seen])); } catch { /* storage unavailable */ }
  }
  seenListeners.forEach((l) => l());
}
export function onNearbySeenChange(listener: () => void) {
  seenListeners.add(listener);
  return () => { seenListeners.delete(listener); };
}
/** Bell badge: only offers the member has not opened yet and has not already joined. */
export function unseenNearbyCount(user: User, posts: Post[], settings: Settings, now = Date.now()) {
  const seen = getSeenNearby(user);
  return nearbyOffers(user, posts, settings, now).filter((p) => !seen.has(p.id) && !p.interests.some((i) => i.id === user.id)).length;
}