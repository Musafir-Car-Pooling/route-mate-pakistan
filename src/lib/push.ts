export type PushResult = { status: "registered"; token: string } | { status: "not-configured" | "unsupported" | "open-in-new-tab" | "denied" };

export async function enablePush(): Promise<PushResult> {
  if (window.top !== window.self) return { status: "open-in-new-tab" };
  const appId = import.meta.env["VITE_LOVABLE_CONNECTOR_FIREBASE_MESSAGING_APP_ID"];
  const vapidKey = import.meta.env["VITE_LOVABLE_CONNECTOR_FIREBASE_MESSAGING_VAPID_KEY"];
  const config = {
    apiKey: import.meta.env["VITE_LOVABLE_CONNECTOR_FIREBASE_MESSAGING_WEB_API_KEY"],
    projectId: import.meta.env["VITE_LOVABLE_CONNECTOR_FIREBASE_MESSAGING_PROJECT_ID"],
    appId,
    messagingSenderId: appId?.split(":")[1] ?? "",
  };
  if (!config.apiKey || !config.projectId || !appId || !vapidKey || !config.messagingSenderId) return { status: "not-configured" };
  const { isSupported, getMessaging, getToken } = await import("firebase/messaging");
  if (!("Notification" in window) || !(await isSupported())) return { status: "unsupported" };
  const permission = Notification.permission === "granted" ? "granted" : await Notification.requestPermission();
  if (permission !== "granted") return { status: "denied" };
  const { getApps, initializeApp } = await import("firebase/app");
  const app = getApps().find((a) => a.name === "travel-sync-push") ?? initializeApp(config, "travel-sync-push");
  const registration = await navigator.serviceWorker.register(`/firebase-messaging-sw.js?${new URLSearchParams(config).toString()}`);
  const token = await getToken(getMessaging(app), { vapidKey, serviceWorkerRegistration: registration });
  if (!token) return { status: "denied" };
  const { cloud } = await import("./cloud");
  const { auth, db, fs } = await cloud();
  if (!auth.currentUser) throw new Error("Sign in before enabling notifications.");
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(token));
  const id = Array.from(new Uint8Array(digest)).map((n) => n.toString(16).padStart(2, "0")).join("");
  await fs.setDoc(fs.doc(db, "users", auth.currentUser.uid, "fcmTokens", id), { token, updatedAt: Date.now() });
  return { status: "registered", token };
}

export const pushMessages = {
  "open-in-new-tab": "Open Travel Sync in its own tab or use the installed app to enable phone notifications.",
  "not-configured": "Phone push setup is incomplete. Update Firebase Messaging and select Include web push; automatic delivery also needs server setup.",
  unsupported: "This browser does not support phone push notifications. On iPhone, use the installed Home Screen app.",
  denied: "Notifications are blocked. Allow them in your browser’s site settings, then try again.",
  registered: "This phone is registered. Automatic push delivery is awaiting server setup.",
};