"use client";

import { useEffect } from "react";
import * as Ably from "ably";

/**
 * Subscribe to the caller's restaurant order channel. The channel name comes
 * from `/api/ably/token` (derived server-side from the staff/guest session),
 * so the client never handles IDs or keys. `onEvent` fires for every order
 * event — callers refresh their own data.
 *
 * No-ops silently when realtime is unconfigured (callers keep polling).
 */
export function useOrderEvents(onEvent: () => void): void {
  useEffect(() => {
    let client: Ably.Realtime | null = null;
    let channel: Ably.RealtimeChannel | null = null;
    let cancelled = false;

    (async () => {
      try {
        const res = await fetch("/api/ably/token");
        if (!res.ok || cancelled) return;
        const { channel: channelName } = await res.json();
        if (!channelName || cancelled) return;
        client = new Ably.Realtime({ authUrl: "/api/ably/token" });
        channel = client.channels.get(channelName);
        const handler = () => onEvent();
        await channel.attach();
        if (cancelled) {
          channel.unsubscribe(handler);
          return;
        }
        channel.subscribe(handler);
      } catch {
        // Realtime unavailable — polling fallback covers updates.
      }
    })();

    return () => {
      cancelled = true;
      try {
        channel?.unsubscribe();
      } catch {
        // Already detached.
      }
      void client?.close();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
