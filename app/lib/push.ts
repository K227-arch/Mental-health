// Browser Push Notification utilities
// Uses the Web Push API with the service worker in /public/sw.js

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "";

function urlBase64ToUint8Array(base64String: string): ArrayBuffer {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const arr = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) arr[i] = rawData.charCodeAt(i);
  return arr.buffer as ArrayBuffer;
}

export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) return null;
  try {
    const reg = await navigator.serviceWorker.register("/sw.js");
    return reg;
  } catch {
    return null;
  }
}

export async function requestPushPermission(): Promise<NotificationPermission> {
  if (typeof window === "undefined" || !("Notification" in window)) return "denied";
  if (Notification.permission === "granted") return "granted";
  return Notification.requestPermission();
}

export async function subscribeToPush(): Promise<PushSubscription | null> {
  try {
    const reg = await registerServiceWorker();
    if (!reg) return null;

    const perm = await requestPushPermission();
    if (perm !== "granted") return null;

    // If VAPID key not configured, fall back to in-browser notifications only
    if (!VAPID_PUBLIC_KEY) return null;

    const sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
    });

    return sub;
  } catch {
    return null;
  }
}

/** Show a local browser notification without push (works without VAPID) */
export async function showLocalNotification(
  title: string,
  body: string,
  options?: { type?: string; link?: string }
) {
  if (typeof window === "undefined") return;

  const perm = await requestPushPermission();
  if (perm !== "granted") return;

  const reg = await registerServiceWorker();
  const isCritical = options?.type === "critical";

  if (reg) {
    await reg.showNotification(title, {
      body,
      icon: "/icon-192.png",
      tag: isCritical ? "crisis-alert" : "mindcare-notif",
      requireInteraction: isCritical,
      vibrate: isCritical ? [200, 100, 200, 100, 200] : [100],
      data: { link: options?.link || "/" },
    } as NotificationOptions);
  } else if ("Notification" in window && Notification.permission === "granted") {
    new Notification(title, { body, icon: "/icon-192.png" });
  }
}
