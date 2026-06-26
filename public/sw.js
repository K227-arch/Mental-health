// MindCare AI Service Worker — Push Notifications

self.addEventListener("install", (e) => {
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(clients.claim());
});

self.addEventListener("push", (e) => {
  if (!e.data) return;

  let payload;
  try {
    payload = e.data.json();
  } catch {
    payload = { title: "MindCare AI", body: e.data.text() };
  }

  const { title, body, type, link } = payload;

  const isCritical = type === "critical";

  e.waitUntil(
    self.registration.showNotification(title || "MindCare AI", {
      body: body || "",
      icon: "/icon-192.png",
      badge: "/icon-192.png",
      tag: isCritical ? "crisis-alert" : "mindcare-notif",
      requireInteraction: isCritical,
      vibrate: isCritical ? [200, 100, 200, 100, 200] : [100],
      data: { link: link || "/" },
      actions: isCritical
        ? [
            { action: "open", title: "Open Dashboard" },
            { action: "dismiss", title: "Dismiss" },
          ]
        : [{ action: "open", title: "View" }],
    })
  );
});

self.addEventListener("notificationclick", (e) => {
  e.notification.close();

  if (e.action === "dismiss") return;

  const link = e.notification.data?.link || "/";

  e.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((cs) => {
      for (const c of cs) {
        if (c.url.includes(self.location.origin) && "focus" in c) {
          c.navigate(link);
          return c.focus();
        }
      }
      if (clients.openWindow) return clients.openWindow(link);
    })
  );
});
