// Firebase web config is publishable (safe in client code).
export const firebaseConfig = {
  apiKey: "AIzaSyACNSJPAPBNygx-adQP7KfEiUdO8tZJliA",
  authDomain: "travelsync-8912f.firebaseapp.com",
  projectId: "travelsync-8912f",
  storageBucket: "travelsync-8912f.firebasestorage.app",
  messagingSenderId: "567480505063",
  appId: "1:567480505063:web:c39fcc763340bd6387c842",
  measurementId: "G-X85S6XE581",
};

// Browser-only: call from useEffect.
export async function initFirebase() {
  if (typeof window === "undefined") return;
  const { initializeApp, getApps } = await import("firebase/app");
  const app = getApps()[0] ?? initializeApp(firebaseConfig);
  const { getAnalytics, isSupported } = await import("firebase/analytics");
  if (await isSupported()) getAnalytics(app);
  return app;
}
