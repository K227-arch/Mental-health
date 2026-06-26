"use client";

import { useEffect } from "react";
import { registerServiceWorker, requestPushPermission, showLocalNotification } from "@/app/lib/push";
import { insforge } from "@/lib/insforge";

/**
 * Mounts once in the root layout.
 * - Registers the service worker
 * - Requests push permission from counsellors
 * - Subscribes to the InsForge realtime channel for crisis alerts
 * - Shows a browser push notification when a critical event arrives
 */
export default function PushProvider() {
  useEffect(() => {
    let cleanup = false;

    async function init() {
      // Register the service worker (no-op if already registered)
      await registerServiceWorker();

      // Get current user
      const { data } = await insforge.auth.getCurrentUser();
      if (!data?.user || cleanup) return;

      const { data: prof } = await insforge.database
        .from("student_profiles")
        .select("role")
        .eq("id", data.user.id)
        .maybeSingle();

      const isCounsellor = (prof as any)?.role === "counsellor";

      // Only request push permission for counsellors (crisis alerts)
      if (isCounsellor) {
        await requestPushPermission();

        // Subscribe to counsellor realtime channel for immediate push
        await insforge.realtime.connect();
        const sub = await insforge.realtime.subscribe("counsellor-updates");

        if (sub.ok && !cleanup) {
          insforge.realtime.on<{ title?: string; body?: string; type?: string; link?: string }>(
            "new_notification",
            async (msg) => {
              if (cleanup) return;
              // Only fire browser push for critical alerts
              if (msg.type === "critical" || (msg.title ?? "").includes("🚨") || (msg.title ?? "").includes("EMERGENCY")) {
                await showLocalNotification(
                  msg.title ?? "Crisis Alert",
                  msg.body ?? "A student needs immediate attention.",
                  { type: "critical", link: msg.link ?? "/counsellor" }
                );
              }
            }
          );
        }
      } else {
        // Students: subscribe to their own notification channel for push alerts
        const channel = `notifications:${data.user.id}`;
        await insforge.realtime.connect();
        const sub = await insforge.realtime.subscribe(channel);

        if (sub.ok && !cleanup) {
          insforge.realtime.on<{ title?: string; body?: string; type?: string; link?: string }>(
            "new_notification",
            async (msg) => {
              if (cleanup) return;
              if (msg.type === "critical") {
                await showLocalNotification(
                  msg.title ?? "Urgent Message",
                  msg.body ?? "Your counsellor has sent an urgent message.",
                  { type: "critical", link: msg.link ?? "/messages" }
                );
              }
            }
          );
        }
      }
    }

    init().catch(() => {}); // silent — push is enhancement only

    return () => {
      cleanup = true;
    };
  }, []);

  return null; // renders nothing
}
