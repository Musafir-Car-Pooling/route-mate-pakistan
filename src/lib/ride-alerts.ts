import { isExpired, type Interest, type Post, type Settings, type User } from "./store";

export type RideAlert = { id: string; kind: "offer" | "interest"; title: string; at: number; post: Post; person?: Interest };
export function nearbyOffers(user: User, posts: Post[], settings: Settings, now = Date.now()) {
  const kind = user.travelMode === "driver" ? "request" : "ride";
  const routes = [{ city: user.city, from: user.home, to: user.work }, ...posts.filter((p) => p.ownerId === user.id && p.kind !== kind && p.active && !p.cancelledAt && !isExpired(p, settings, now))];
  return posts.filter((p) => p.kind === kind && p.ownerId !== user.id && p.active && !p.cancelledAt && !isExpired(p, settings, now)
    && (p.genderPref === "any" || p.genderPref === user.gender)
    && routes.some((r) => Boolean(r.city && r.from && r.to) && r.city === p.city && r.from === p.from && r.to === p.to))
    .sort((a, b) => b.createdAt - a.createdAt);
}
export function memberAlerts(user: User, posts: Post[], settings: Settings, now = Date.now()): RideAlert[] {
  const offers: RideAlert[] = nearbyOffers(user, posts, settings, now).map((post) => ({ id: `offer:${post.id}`, kind: "offer", title: post.kind === "ride" ? "New driver is traveling on your route" : "New passenger needs a ride on your route", at: post.createdAt, post }));
  const interests: RideAlert[] = posts.filter((p) => p.ownerId === user.id && p.kind === (user.travelMode === "driver" ? "ride" : "request") && p.active && !p.cancelledAt && !isExpired(p, settings, now))
    .flatMap((post) => post.interests.filter((person) => person.id !== user.id).map((person) => ({ id: `interest:${post.id}:${person.id}:${person.at}`, kind: "interest" as const, title: post.kind === "ride" ? "A passenger is interested in your ride" : "A driver is interested in your request", at: person.at, post, person })));
  return [...offers, ...interests].sort((a, b) => b.at - a.at);
}

export function addMemberInterest(state: import("./store").State, postId: string, now = Date.now()) {
  const user = state.user;
  const post = state.posts.find((p) => p.id === postId);
  if (!user || !post || !nearbyOffers(user, state.posts, state.settings, now).some((p) => p.id === postId) || post.interests.some((i) => i.id === user.id)) return state;
  const person: Interest = { id: user.id, name: user.name, org: user.org, gender: user.gender, rating: user.rating, reviews: 0, verified: user.verified, car: user.car || undefined, at: now };
  return { ...state, posts: state.posts.map((p) => p.id === postId ? { ...p, interests: [...p.interests, person] } : p) };
}