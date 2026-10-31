/* Messaging only: no app-shell or offline caching. */
importScripts("https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js");
firebase.initializeApp(Object.fromEntries(new URL(self.location).searchParams));
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const path = event.notification.data?.path;
  const destination = new URL(typeof path === "string" && path.startsWith("/") && !path.startsWith("//") ? path : "/nearby", self.location.origin);
  event.waitUntil((async () => {
    const windows = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    for (const client of windows) {
      if (new URL(client.url).origin === self.location.origin) {
        await client.navigate(destination.href);
        return client.focus();
      }
    }
    return self.clients.openWindow(destination.href);
  })());
});
firebase.messaging().onBackgroundMessage((payload) => {
  // Data-only sends avoid a second automatically displayed notification.
  if (payload.notification) return;
  const data = payload.data || {};
  return self.registration.showNotification(data.title || "Travel Sync", {
    body: data.body || "A member on your route has an update.",
    icon: "/icon-192.png", badge: "/favicon.png", tag: data.eventId,
    vibrate: [180, 80, 180], data: { path: data.path || "/nearby" },
  });
});