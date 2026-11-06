import { useSyncExternalStore } from "react";

export type Role = "jobian" | "student";
export type Gender = "male" | "female";
export type TravelMode = "driver" | "passenger";
export type User = {
  id: string; name: string; email: string; password: string; phone: string;
  role: Role; org: string; dept: string; gender: Gender; city: string;
  home: string; work: string; prefs: string[]; verified: boolean; active: boolean;
  phonePublic: boolean; hidePhone?: boolean; travelMode?: TravelMode; profilePhoto?: string | undefined; car?: string | undefined; plate?: string | undefined; carPhoto?: string | undefined; rating: number;
};
export type MemberReview = { id: string; author: string; rating: number; text: string; at: number };
export type Interest = {
  id: string; name: string; org: string; gender: Gender; rating: number; reviews: number;
  verified: boolean; car?: string | undefined; phone?: string; at: number; reviewEntries?: MemberReview[]; demo?: boolean; hidePhone?: boolean | undefined;
};
export type Post = {
  id: string; kind: "request" | "ride"; ownerId: string; ownerName: string;
  ownerOrg?: string; ownerRating?: number; ownerVerified?: boolean; ownerCar?: string | undefined;
  city?: string;
  from: string; to: string; time?: string; notes: string; genderPref: "any" | "male" | "female";
  seats?: number; daily?: number; weekly?: number; monthly?: number;
  createdAt: number; active: boolean; cancelledAt?: number; interests: Interest[];
};
export type Unlock = {
  id: string; postId: string; interestId: string; userId: string; method: string;
  txn: string; screenshot?: string | undefined; amount: number; status: "pending" | "unlocked" | "rejected"; at: number;
  /** "chat" when the member hides their number: payment opens in-app chat instead. */
  kind?: "phone" | "chat"; payerName?: string; memberName?: string;
};
export type Company = { id: string; name: string; logo?: string; approved: boolean };
export type City = { id: string; name: string; locations: string[] };
/** Admin-made member shown as interested on new posts while demo mode is on. Phone lives in private/demo_{id}. */
export type DemoUser = { id: string; name: string; org: string; gender: Gender; rating: number; car?: string | undefined; reviews: MemberReview[] };
export type Settings = {
  demoMode?: boolean; demoUsers?: DemoUser[];
  cities: City[];
  departments: string[];
  fee: number; chatFee?: number; autoCancel: boolean; hours: number; instantUnlock: boolean;
  bankTitle: string; bankIban: string; easypaisa: string; jazzcash: string;
  socials: { whatsapp: string; facebook: string; linkedin: string; instagram: string };
  pages: Record<string, string>; slides: string[];
  paymentIcons?: Partial<Record<"easypaisa" | "jazzcash" | "bank", string>>;
};
export type State = {
  user: User | null; admin: boolean; seenIntro: boolean; users: User[]; posts: Post[];
  unlocks: Unlock[]; companies: Company[]; settings: Settings;
  phones: Record<string, string>; authReady: boolean;
  memberReviews: StoredReview[];
  /** Own posts the server has not confirmed yet (no internet), so other members cannot see them. */
  unsent?: string[];
};
/** Review written after a contact was unlocked. Id is "<reviewerId>_<targetId>". */
export type StoredReview = { id: string; reviewerId: string; reviewerName: string; targetId: string; rating: number; text: string; at: number };
export const reviewsFor = (targetId: string, list: StoredReview[]): MemberReview[] =>
  list.filter((r) => r.targetId === targetId).map((r) => ({ id: r.id, author: r.reviewerName, rating: r.rating, text: r.text, at: r.at }));

const defaults: State = {
  user: null, admin: false, seenIntro: false, users: [], posts: [], unlocks: [], phones: {}, authReady: false, memberReviews: [], unsent: [],
  companies: ["Systems Ltd", "Jazz", "Engro", "NetSol", "LUMS", "FAST NUCES", "HBL"].map((n, i) => ({ id: "c" + i, name: n, approved: true })),
  settings: {
    cities: [],
    departments: [],
    fee: 150, chatFee: 150, autoCancel: true, hours: 24, instantUnlock: false,
    bankTitle: "Travel Sync Pvt Ltd", bankIban: "PK36MEZN0001234567890123", easypaisa: "0300-1234567", jazzcash: "0301-7654321",
    socials: { whatsapp: "https://wa.me/923001234567", facebook: "https://facebook.com", linkedin: "https://linkedin.com", instagram: "https://instagram.com" },
    pages: {
      about: "Travel Sync is Pakistan's verified carpooling platform for Jobians and university students. Every member is verified through an official work or university email.",
      terms: "By using Travel Sync you agree that the platform only connects verified members. Any ride arrangement made after contact unlock is between the members themselves.",
      "privacy-policy": "Your phone number is never shown to anyone until a connection fee is paid. We do not sell your data.",
      faqs: "Q: Why do I pay to unlock a contact?\nA: The fee keeps the platform safe, verified and free of spam.\n\nQ: What happens after 24 hours?\nA: Offers that are not unlocked expire automatically.",
      contact: "Email: support@travelsync.pk\nWhatsApp: 0300-1234567\nLahore, Pakistan",
    },
    slides: [],
  },
};

const KEY = "travelsync-v1";
let state: State = defaults;
const listeners = new Set<() => void>();

type WriteHook = (prev: State, next: State) => void;
let writeHook: WriteHook | null = null;
export function setWriteHook(h: WriteHook | null) { writeHook = h; }
export function hydrateStore() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) { const p = JSON.parse(raw); if (p.seenIntro) { state = { ...state, seenIntro: true }; emit(); } }
  } catch { /* ignore */ }
}
function emit() { listeners.forEach((l) => l()); }
// Local change made by the user: synced to Firebase by the write hook.
export function setState(fn: (s: State) => State) {
  const prev = state;
  state = fn(state);
  try { localStorage.setItem(KEY, JSON.stringify({ seenIntro: state.seenIntro })); } catch { /* quota */ }
  if (writeHook && prev !== state) writeHook(prev, state);
  emit();
}
// Change that came from Firebase: never written back.
export function setRemote(fn: (s: State) => State) { state = fn(state); emit(); }
export function getState() { return state; }
export function switchTravelMode(s: State): State {
  if (!s.user) return s;
  const user: User = { ...s.user, travelMode: s.user.travelMode === "driver" ? "passenger" : "driver" };
  return { ...s, user, users: s.users.map((member) => member.id === user.id ? user : member) };
}
export function useStore<T>(sel: (s: State) => T): T {
  return useSyncExternalStore((l) => { listeners.add(l); return () => listeners.delete(l); }, () => sel(state), () => sel(defaults));
}

export const uid = () => Math.random().toString(36).slice(2, 10);
export const ADMIN_EMAIL = "pp@gmail.com";
export const ADMIN_PASS = "ppllmm";
export const isAdminCreds = (e: string, p: string) => e.trim().toLowerCase() === ADMIN_EMAIL && p.trim() === ADMIN_PASS;
export const validPassword = (p: string) => /^[a-zA-Z0-9]{6,}$/.test(p);
export const validOfficialEmail = (e: string, role: Role) => {
  const m = e.trim().toLowerCase().match(/^[^@\s]+@([^@\s]+\.[a-z]{2,})$/);
  if (!m) return false;
  const d = m[1] ?? "";
  if (role === "student") return d.endsWith(".edu.pk");
  return !/^(gmail|yahoo|hotmail|outlook|live)\./.test(d);
};
export const validPlate = (p: string) => /^[A-Z]{2,4}[- ]?\d{1,4}$/.test(p.trim().toUpperCase());
export const validOptionalVehicle = (vehicle: { car?: string | undefined; plate?: string | undefined; carPhoto?: string | undefined }) => !vehicle.plate?.trim() || validPlate(vehicle.plate);
export const formatPKR = (n: number) => "PKR " + Math.round(n).toLocaleString("en-US");
export const expiresAt = (p: Post, s: Settings) => p.createdAt + s.hours * 3600_000;
export const isExpired = (p: Post, s: Settings, now = Date.now()) => s.autoCancel && now > expiresAt(p, s);
export const canContactPost = (p: Post, s: Settings, userId: string | undefined, now = Date.now()) => p.active && !p.cancelledAt && p.ownerId === userId && !isExpired(p, s, now);
export function cancelOwnPost(s: State, postId: string, now = Date.now()): State {
  const post = s.posts.find((p) => p.id === postId);
  if (!post || !s.user || !canContactPost(post, s.settings, s.user.id, now)) return s;
  return { ...s, posts: s.posts.map((p) => p.id === postId ? { ...p, active: false, cancelledAt: now } : p) };
}
export function deleteOwnPost(s: State, postId: string): State {
  const post = s.posts.find((p) => p.id === postId);
  if (!post || !s.user || post.ownerId !== s.user.id || !post.cancelledAt) return s;
  return { ...s, posts: s.posts.filter((p) => p.id !== postId) };
}
export const locationsForCity = (cities: City[], cityId: string) => cities.find((c) => c.id === cityId)?.locations ?? [];
export const validRouteLocations = (cities: City[], cityId: string, from: string, to: string) => {
  const locations = locationsForCity(cities, cityId);
  return locations.includes(from) && locations.includes(to);
};
export const validRegistrationCatalog = (settings: Settings, companies: Company[], selection: { cityId: string; org: string; dept: string; role: Role; home: string; work: string }) =>
  validRouteLocations(settings.cities, selection.cityId, selection.home, selection.work)
  && companies.some((company) => company.approved && company.name === selection.org)
  && (selection.role === "student" || settings.departments.includes(selection.dept));

// Offers of the opposite kind on the same route that this post's owner can join.
export const matchingPosts = (post: Post, posts: Post[], s: Settings, now = Date.now()) => posts.filter((p) =>
  p.id !== post.id && p.ownerId !== post.ownerId && p.kind !== post.kind && p.active && !p.cancelledAt && !isExpired(p, s, now)
  && p.city === post.city && p.from === post.from && p.to === post.to);

export const DEMO_PREFIX = "demo_";
export const DEMO_PER_POST = 5;
/** Seconds each demo member waits after the previous one: 1st at 2s, 2nd 4s later, 3rd 3s later, then 3s each. */
export const DEMO_GAP_MS = [2000, 4000, 3000, 3000, 3000];
/** Up to 5 random demo members matching the post's gender rule, arriving one by one within ~14 seconds. */
/** Fee for a member: chat fee when their number is hidden, else the normal contact fee. */
export const feeFor = (person: Pick<Interest, "hidePhone">, settings: Settings) => person.hidePhone ? settings.chatFee ?? 150 : settings.fee;
export type ChatMessage = { id: string; from: string; text: string; at: number; deliveredAt?: number; readAt?: number };

export function pickDemoInterests(post: Post, settings: Settings, now = Date.now(), rand = Math.random): Interest[] {
  if (!settings.demoMode) return [];
  const pool = (settings.demoUsers ?? []).filter((d) => post.genderPref === "any" || d.gender === post.genderPref);
  for (let i = pool.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [pool[i], pool[j]] = [pool[j]!, pool[i]!]; }
  let wait = 0;
  return pool.slice(0, DEMO_PER_POST).map((d, i) => {
    wait += DEMO_GAP_MS[i] ?? 3000;
    return {
      id: DEMO_PREFIX + d.id, name: d.name, org: d.org, gender: d.gender, rating: d.rating, reviews: d.reviews.length,
      verified: true, car: post.kind === "request" ? d.car || undefined : undefined, reviewEntries: d.reviews,
      at: now + wait,
    };
  });
}
/** Interests whose arrival time has come (demo members arrive gradually). */
export const visibleInterests = (post: Post, now = Date.now()) => post.interests.filter((i) => i.at <= now);

export function unlockFor(postId: string, interestId: string, s: State = state) {
  // One payment unlocks a member for good (doc id is payer_member), so match any post of this pair.
  return s.unlocks.find((u) => u.interestId === interestId && (!s.user || u.userId === s.user.id) && u.status !== "rejected")
    ?? s.unlocks.find((u) => u.postId === postId && u.interestId === interestId && u.status !== "rejected");
}

const names = {
  male: ["Ahmed Raza", "Usman Tariq", "Bilal Khan", "Hamza Ali", "Saad Qureshi", "Faisal Iqbal"],
  female: ["Ayesha Malik", "Fatima Noor", "Hira Sheikh", "Zainab Hussain", "Maryam Javed", "Sana Butt"],
};
const orgs = ["Systems Ltd", "Jazz", "Engro", "NetSol", "LUMS", "FAST NUCES", "HBL", "Arbisoft"];
const cars = ["Suzuki Alto", "Honda City", "Toyota Corolla", "Suzuki Cultus", "Toyota Yaris", "Honda Civic"];
export function mockInterest(post: Post): Interest {
  const g: Gender = post.genderPref === "any" ? (Math.random() > 0.5 ? "male" : "female") : post.genderPref;
  const pool = names[g].filter((n) => !post.interests.some((i) => i.name === n));
  const name = pool[Math.floor(Math.random() * pool.length)] ?? names[g][0] ?? "Ali Khan";
  return {
    id: uid(), name, gender: g, org: orgs[Math.floor(Math.random() * orgs.length)] ?? "Systems Ltd",
    rating: 4.7, reviews: 3, demo: true,
    reviewEntries: [
      { id: uid(), author: "Sample member A", rating: 5, text: "Arrived on time and communicated clearly about the pickup point.", at: Date.now() - 3 * 86400_000 },
      { id: uid(), author: "Sample member B", rating: 5, text: "Polite, respectful and a comfortable daily commute.", at: Date.now() - 8 * 86400_000 },
      { id: uid(), author: "Sample member C", rating: 4, text: "A good experience overall. Pickup was a few minutes late.", at: Date.now() - 15 * 86400_000 },
    ],
    verified: true, car: post.kind === "request" ? cars[Math.floor(Math.random() * cars.length)] ?? "Honda City" : undefined,
    phone: "0300" + String(Math.floor(1000000 + Math.random() * 8999999)), at: Date.now(),
  };
}

export async function compressImage(file: File, max = 800, q = 0.7): Promise<string> {
  const url = URL.createObjectURL(file);
  const img = await new Promise<HTMLImageElement>((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = url; });
  const r = Math.min(1, max / Math.max(img.width, img.height));
  const c = document.createElement("canvas");
  c.width = img.width * r; c.height = img.height * r;
  const context = c.getContext("2d");
  if (!context) { URL.revokeObjectURL(url); throw new Error("Photo could not be processed"); }
  context.drawImage(img, 0, 0, c.width, c.height);
  URL.revokeObjectURL(url);
  return c.toDataURL("image/jpeg", q);
}

