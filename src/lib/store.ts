import { useSyncExternalStore } from "react";

export type Role = "jobian" | "student";
export type Gender = "male" | "female";
export type User = {
  id: string; name: string; email: string; password: string; phone: string;
  role: Role; org: string; dept: string; gender: Gender; city: string;
  home: string; work: string; prefs: string[]; verified: boolean; active: boolean;
  phonePublic: boolean; car?: string | undefined; plate?: string | undefined; carPhoto?: string | undefined; rating: number;
};
export type Interest = {
  id: string; name: string; org: string; gender: Gender; rating: number; reviews: number;
  verified: boolean; car?: string | undefined; phone: string; at: number;
};
export type Post = {
  id: string; kind: "request" | "ride"; ownerId: string; ownerName: string;
  city?: string;
  from: string; to: string; time: string; notes: string; genderPref: "any" | "male" | "female";
  seats?: number; daily?: number; weekly?: number; monthly?: number;
  createdAt: number; active: boolean; interests: Interest[];
};
export type Unlock = {
  id: string; postId: string; interestId: string; userId: string; method: string;
  txn: string; screenshot?: string | undefined; amount: number; status: "pending" | "unlocked" | "rejected"; at: number;
};
export type Company = { id: string; name: string; logo?: string; approved: boolean };
export type City = { id: string; name: string; locations: string[] };
export type Settings = {
  cities: City[];
  fee: number; autoCancel: boolean; hours: number; instantUnlock: boolean;
  bankTitle: string; bankIban: string; easypaisa: string; jazzcash: string;
  socials: { whatsapp: string; facebook: string; linkedin: string; instagram: string };
  pages: Record<string, string>; slides: string[];
};
export type State = {
  user: User | null; admin: boolean; seenIntro: boolean; users: User[]; posts: Post[];
  unlocks: Unlock[]; companies: Company[]; settings: Settings;
};

const defaults: State = {
  user: null, admin: false, seenIntro: false, users: [], posts: [], unlocks: [],
  companies: ["Systems Ltd", "Jazz", "Engro", "NetSol", "LUMS", "FAST NUCES", "HBL"].map((n, i) => ({ id: "c" + i, name: n, approved: true })),
  settings: {
    cities: [],
    fee: 150, autoCancel: true, hours: 24, instantUnlock: false,
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

export function hydrateStore() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) { const p = JSON.parse(raw); state = { ...defaults, ...p, settings: { ...defaults.settings, ...p.settings } }; emit(); }
  } catch { /* ignore */ }
}
function emit() { listeners.forEach((l) => l()); }
export function setState(fn: (s: State) => State) {
  state = fn(state);
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* quota */ }
  emit();
}
export function getState() { return state; }
export function useStore<T>(sel: (s: State) => T): T {
  return useSyncExternalStore((l) => { listeners.add(l); return () => listeners.delete(l); }, () => sel(state), () => sel(defaults));
}

export const uid = () => Math.random().toString(36).slice(2, 10);
export const ADMIN_EMAIL = "pp@gmail.com";
export const ADMIN_PASS = "ppllmm";
export const isAdminCreds = (e: string, p: string) => e.trim().toLowerCase() === ADMIN_EMAIL && p === ADMIN_PASS;
export const validPassword = (p: string) => /^[a-zA-Z0-9]{6,}$/.test(p);
export const validOfficialEmail = (e: string, role: Role) => {
  const m = e.trim().toLowerCase().match(/^[^@\s]+@([^@\s]+\.[a-z]{2,})$/);
  if (!m) return false;
  const d = m[1] ?? "";
  if (role === "student") return d.endsWith(".edu.pk");
  return !/^(gmail|yahoo|hotmail|outlook|live)\./.test(d);
};
export const validPlate = (p: string) => /^[A-Z]{2,4}[- ]?\d{1,4}$/.test(p.trim().toUpperCase());
export const formatPKR = (n: number) => "PKR " + Math.round(n).toLocaleString("en-US");
export const expiresAt = (p: Post, s: Settings) => p.createdAt + s.hours * 3600_000;
export const isExpired = (p: Post, s: Settings, now = Date.now()) => s.autoCancel && now > expiresAt(p, s);
export const locationsForCity = (cities: City[], cityId: string) => cities.find((c) => c.id === cityId)?.locations ?? [];
export const validRouteLocations = (cities: City[], cityId: string, from: string, to: string) => {
  const locations = locationsForCity(cities, cityId);
  return locations.includes(from) && locations.includes(to);
};

export function unlockFor(postId: string, interestId: string, s: State = state) {
  return s.unlocks.find((u) => u.postId === postId && u.interestId === interestId && u.status !== "rejected");
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
    rating: Math.round((3.8 + Math.random() * 1.2) * 10) / 10, reviews: 5 + Math.floor(Math.random() * 80),
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
  c.getContext("2d")!.drawImage(img, 0, 0, c.width, c.height);
  URL.revokeObjectURL(url);
  return c.toDataURL("image/jpeg", q);
}
