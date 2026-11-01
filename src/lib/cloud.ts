// Firebase sync layer: Firestore is the source of truth, store.ts is the in-memory view.
// Browser-only: every export is called from effects or event handlers.
import type { FirebaseApp } from "firebase/app";
import type { Firestore, Unsubscribe } from "firebase/firestore";
import type { Auth } from "firebase/auth";
import { ADMIN_EMAIL, getState, setRemote, setWriteHook, type Company, type Interest, type Post, type Settings, type State, type StoredReview, type Unlock, type User } from "./store";
import { initFirebase } from "./firebase";

type FS = typeof import("firebase/firestore");
type FA = typeof import("firebase/auth");
let ready: Promise<{ db: Firestore; auth: Auth; fs: FS; fa: FA }> | null = null;

export function cloud() {
  if (!ready) ready = (async () => {
    const app = (await initFirebase()) as FirebaseApp;
    const fs = await import("firebase/firestore");
    const fa = await import("firebase/auth");
    let db: Firestore;
    try { db = fs.initializeFirestore(app, { ignoreUndefinedProperties: true }); } catch { db = fs.getFirestore(app); }
    return { db, auth: fa.getAuth(app), fs, fa };
  })();
  return ready;
}

export const unlockId = (payerId: string, interestId: string) => `${payerId}_${interestId}`;
const log = (e: unknown) => console.warn("[firebase]", e);

// ---------- Auth ----------
export async function registerAccount(user: Omit<User, "id">): Promise<User> {
  const { auth, fa, db, fs } = await cloud();
  const cred = await fa.createUserWithEmailAndPassword(auth, user.email, user.password);
  const full: User = { ...user, id: cred.user.uid, password: "" };
  await fs.setDoc(fs.doc(db, "users", full.id), profileDoc(full));
  await fs.setDoc(fs.doc(db, "private", full.id), { phone: user.phone });
  setRemote((s) => ({ ...s, user: full, users: [...s.users.filter((u) => u.id !== full.id), full], seenIntro: true }));
  return full;
}

export async function signIn(email: string, password: string) {
  const { auth, fa } = await cloud();
  const e = email.trim().toLowerCase();
  try {
    await fa.signInWithEmailAndPassword(auth, e, password);
  } catch (err) {
    // First admin login creates the admin account.
    const code = (err as { code?: string }).code;
    if (e === ADMIN_EMAIL && (code === "auth/user-not-found" || code === "auth/invalid-credential")) {
      await fa.createUserWithEmailAndPassword(auth, e, password);
    } else throw err;
  }
  await waitForProfile();
}

function waitForProfile() {
  return new Promise<void>((res) => {
    const t0 = Date.now();
    const tick = () => { const s = getState(); if (s.admin || s.user || Date.now() - t0 > 8000) res(); else setTimeout(tick, 100); };
    tick();
  });
}

export async function changePassword(current: string, next: string) {
  const { auth, fa } = await cloud();
  const u = auth.currentUser;
  if (!u?.email) throw new Error("Not signed in");
  await fa.reauthenticateWithCredential(u, fa.EmailAuthProvider.credential(u.email, current));
  await fa.updatePassword(u, next);
}

// ---------- Live sync ----------
let started = false;
export async function startSync() {
  if (started || typeof window === "undefined") return;
  started = true;
  const { db, auth, fs, fa } = await cloud();
  setWriteHook((prev, next) => { void writeDiff(prev, next).catch(log); });

  // Public catalogs (needed before sign-up).
  fs.onSnapshot(fs.doc(db, "settings", "app"), (snap) => {
    if (snap.exists()) setRemote((s) => ({ ...s, settings: { ...s.settings, ...(snap.data() as Partial<Settings>) } }));
  }, log);
  fs.onSnapshot(fs.collection(db, "companies"), (snap) => {
    if (snap.empty) return; // keep built-in defaults until admin saves companies
    setRemote((s) => ({ ...s, companies: snap.docs.map((d) => ({ ...(d.data() as Company), id: d.id })) }));
  }, log);

  let subs: Unsubscribe[] = [];
  const interestSubs = new Map<string, Unsubscribe>();
  const interests: Record<string, Interest[]> = {};
  rebuildPosts = () => setRemote((s) => ({ ...s, posts: postDocs.map((p) => ({ ...p, interests: interests[p.id] ?? [] })) }));

  let session = 0;
  // Live listener that never dies: Firestore permanently closes a listener after an error
  // (e.g. a permission check racing a fresh sign-in), so re-open it while the session lasts.
  const keep = (label: string, open: (onError: (e: unknown) => void) => Unsubscribe) => {
    const mine = session;
    let current: Unsubscribe | null = null; let stopped = false; let delay = 1000;
    const start = () => {
      if (stopped || mine !== session) return;
      current = open((e) => {
        console.warn(`[firebase] ${label}`, e);
        current?.(); current = null;
        // Rules that deny a listener (e.g. unpublished rules) retry slowly so they don't churn the shared connection.
        const denied = (e as { code?: string }).code === "permission-denied";
        setTimeout(start, denied ? Math.max(delay, 60000) : delay); delay = Math.min(delay * 2, 15000);
      });
    };
    start();
    subs.push(() => { stopped = true; current?.(); });
  };

  // Server snapshot of all posts; keeps own posts still waiting for the server.
  const applyPosts = (docs: { id: string; data: Post; pending: boolean }[], uid: string, admin: boolean) => {
    const ids = new Set(docs.map((d) => d.id));
    postDocs = [...docs.map((d) => ({ ...d.data, id: d.id, interests: interests[d.id] ?? [] })), ...postDocs.filter((p) => unsentPosts.has(p.id) && !ids.has(p.id))];
    for (const d of docs) if ((admin || d.data.ownerId === uid) && !d.pending && !interestSubs.has(d.id)) watchInterests(d.id);
    rebuildPosts();
  };
  let watchInterests: (pid: string) => void = () => {};

  // Backup delivery: mobile networks can silently stall the live stream, so re-read posts
  // from the server when the app is reopened, regains internet, and every 20 seconds.
  let lastRefresh = 0;
  const refresh = (force = false) => {
    const fu = auth.currentUser;
    if (!fu || document.visibilityState === "hidden") return;
    if (!force && Date.now() - lastRefresh < 5000) return;
    lastRefresh = Date.now();
    const mine = session;
    const admin = fu.email?.toLowerCase() === ADMIN_EMAIL;
    fs.getDocsFromServer(fs.collection(db, "posts")).then((snap) => {
      if (mine !== session) return;
      applyPosts(snap.docs.map((d) => ({ id: d.id, data: d.data() as Post, pending: false })), fu.uid, admin);
    }).catch(log);
  };
  document.addEventListener("visibilitychange", () => { if (document.visibilityState === "visible") refresh(true); });
  window.addEventListener("online", () => refresh(true));
  window.addEventListener("focus", () => refresh());
  setInterval(() => refresh(true), 20000);

  fa.onAuthStateChanged(auth, async (fu) => {
    session++;
    subs.forEach((u) => u()); subs = [];
    interestSubs.forEach((u) => u()); interestSubs.clear();
    postDocs = [];
    if (!fu) { setRemote((s) => ({ ...s, user: null, admin: false, users: [], posts: [], unlocks: [], phones: {}, memberReviews: [], authReady: true })); return; }
    const admin = fu.email?.toLowerCase() === ADMIN_EMAIL;
    const uid = fu.uid;
    if (admin) {
      setRemote((s) => ({ ...s, admin: true, user: null, authReady: true }));
      keep("users", (err) => fs.onSnapshot(fs.collection(db, "users"), (snap) => setRemote((s) => ({ ...s, users: snap.docs.map((d) => ({ ...(d.data() as User), id: d.id, password: "" })) })), err));
      keep("unlocks", (err) => fs.onSnapshot(fs.collection(db, "unlocks"), (snap) => setRemote((s) => ({ ...s, unlocks: snap.docs.map((d) => ({ ...(d.data() as Unlock), id: d.id })) })), err));
    } else {
      keep("profile", (err) => fs.onSnapshot(fs.doc(db, "users", uid), async (snap) => {
        if (!snap.exists()) return;
        const priv = await fs.getDoc(fs.doc(db, "private", uid)).catch(() => null);
        const u: User = { ...(snap.data() as User), id: uid, password: "", phone: (priv?.data()?.["phone"] as string) ?? "" };
        if (!u.active) { await fa.signOut(auth); return; }
        setRemote((s) => ({ ...s, user: u, users: [u], seenIntro: true, authReady: true }));
      }, err));
      keep("my unlocks", (err) => fs.onSnapshot(fs.query(fs.collection(db, "unlocks"), fs.where("userId", "==", uid)), (snap) => {
        const unlocks = snap.docs.map((d) => ({ ...(d.data() as Unlock), id: d.id }));
        setRemote((s) => ({ ...s, unlocks }));
        unlocks.filter((u) => u.status === "unlocked" && !getState().phones[u.interestId]).forEach((u) => {
          fs.getDoc(fs.doc(db, "private", u.interestId)).then((d) => {
            const phone = d.data()?.["phone"] as string | undefined;
            if (phone) setRemote((s) => ({ ...s, phones: { ...s.phones, [u.interestId]: phone } }));
          }).catch(log);
        });
      }, err));
    }
    keep("reviews", (err) => fs.onSnapshot(fs.collection(db, "reviews"), (snap) => setRemote((s) => ({ ...s, memberReviews: snap.docs.map((d) => ({ ...(d.data() as StoredReview), id: d.id })) })), err));
    // Live interest listeners for own posts. Wait until the post exists on the server
    // (rules read the post), and re-subscribe after any error so updates never stall.
    const watchInterests = (pid: string) => {
      interestSubs.set(pid, fs.onSnapshot(fs.collection(db, "posts", pid, "interests"), (is) => {
        interests[pid] = is.docs.map((d) => ({ ...(d.data() as Interest), id: d.id })).sort((a, b) => a.at - b.at);
        rebuildPosts();
      }, (e) => {
        console.warn(`[firebase] interests ${pid}`, e);
        interestSubs.get(pid)?.(); interestSubs.delete(pid);
        setTimeout(() => { if (!interestSubs.has(pid) && postDocs.some((p) => p.id === pid)) watchInterests(pid); }, 1500);
      }));
    };
    keep("posts", (err) => fs.onSnapshot(fs.collection(db, "posts"), { includeMetadataChanges: true }, (snap) => {
      postDocs = snap.docs.map((d) => ({ ...(d.data() as Post), id: d.id, interests: interests[d.id] ?? [] }));
      for (const d of snap.docs) {
        const p = d.data() as Post;
        if ((admin || p.ownerId === uid) && !d.metadata.hasPendingWrites && !interestSubs.has(d.id)) watchInterests(d.id);
      }
      rebuildPosts();
    }, err));
  });
}

// ---------- Writes: mirror local changes into Firestore ----------
function profileDoc(u: User) {
  const { password: _p, phone: _ph, id: _id, ...rest } = u;
  return rest;
}
function postDoc(p: Post) {
  const { interests: _i, id: _id, ...rest } = p;
  return rest;
}
function byId<T extends { id: string }>(list: T[]) { return new Map(list.map((x) => [x.id, x])); }

async function writeDiff(prev: State, next: State) {
  const { db, fs, auth, fa } = await cloud();
  const me = auth.currentUser?.uid;
  const ops: Promise<unknown>[] = [];
  const run = (p: Promise<unknown>) => ops.push(p.catch(log));

  // Sign-out from the app UI.
  if ((prev.user && !next.user) || (prev.admin && !next.admin)) { await fa.signOut(auth); return; }

  if (next.admin && prev.settings !== next.settings) run(fs.setDoc(fs.doc(db, "settings", "app"), next.settings));

  if (next.admin && prev.companies !== next.companies) {
    const after = byId(next.companies);
    // Small list: write all so built-in defaults are saved on the first edit.
    for (const c of next.companies) { const { id, ...rest } = c; run(fs.setDoc(fs.doc(db, "companies", id), rest)); }
    for (const c of prev.companies) if (!after.has(c.id)) run(fs.deleteDoc(fs.doc(db, "companies", c.id)));
  }

  if (prev.posts !== next.posts) {
    const before = byId(prev.posts);
    const after = byId(next.posts);
    for (const p of next.posts) {
      const old = before.get(p.id);
      if (old === p) continue;
      if ((p.ownerId === me || next.admin) && (!old || JSON.stringify(postDoc(old)) !== JSON.stringify(postDoc(p)))) run(fs.setDoc(fs.doc(db, "posts", p.id), postDoc(p)));
      for (const i of p.interests) {
        if (i.id === me && !old?.interests.some((x) => x.id === me)) { const { id, phone: _ph, ...rest } = i; run(fs.setDoc(fs.doc(db, "posts", p.id, "interests", id), rest)); }
      }
    }
    for (const p of prev.posts) if (!after.has(p.id) && (p.ownerId === me || next.admin)) run(fs.deleteDoc(fs.doc(db, "posts", p.id)));
  }

  if (prev.unlocks !== next.unlocks) {
    const before = byId(prev.unlocks);
    for (const u of next.unlocks) {
      if (before.get(u.id) === u) continue;
      if (next.admin) run(fs.updateDoc(fs.doc(db, "unlocks", u.id), { status: u.status }));
      else if (u.userId === me) { const { id, ...rest } = u; run(fs.setDoc(fs.doc(db, "unlocks", id), rest)); }
    }
  }

  if (prev.users !== next.users || prev.user !== next.user) {
    const before = byId(prev.users);
    const changed = next.users.filter((u) => before.get(u.id) !== u);
    if (next.user && prev.user !== next.user && !changed.some((u) => u.id === next.user?.id)) changed.push(next.user);
    for (const u of changed) {
      if (u.id === me || next.admin) run(fs.setDoc(fs.doc(db, "users", u.id), profileDoc(u), { merge: true }));
      const oldPhone = before.get(u.id)?.phone ?? prev.user?.phone;
      if (u.id === me && u.phone && u.phone !== oldPhone) run(fs.setDoc(fs.doc(db, "private", u.id), { phone: u.phone }));
    }
  }
  await Promise.all(ops);
}


export async function submitReview(targetId: string, rating: number, text: string) {
  const { db, auth, fs } = await cloud();
  const me = getState().user;
  if (!auth.currentUser || !me) throw new Error("Not signed in");
  const r = { reviewerId: auth.currentUser.uid, reviewerName: me.name, targetId, rating, text: text.trim().slice(0, 500), at: Date.now() };
  await fs.setDoc(fs.doc(db, "reviews", `${r.reviewerId}_${targetId}`), r);
}
