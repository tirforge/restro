import { NextResponse } from "next/server";
import Ably from "ably";

import { getGuestSession } from "@/lib/guest-session";
import { getStaffContextOrNull } from "@/lib/staff-auth";
import { orderChannel } from "@/lib/ably";

/**
 * Mint a short-lived Ably token scoped to the caller's restaurant channel.
 * Staff (kitchen/cashier) and verified guests (order tracking) only — the
 * root API key never reaches the browser.
 */
export async function GET(): Promise<NextResponse> {
  const key = process.env.ABLY_API_KEY;
  if (!key) {
    return NextResponse.json(
      { error: "Realtime is not configured." },
      { status: 503 },
    );
  }

  const staff = await getStaffContextOrNull();
  const guest = staff ? null : await getGuestSession();
  const restaurantId = staff?.restaurantId ?? guest?.restaurantId;
  const clientId = staff
    ? `staff:${staff.staffId}`
    : guest
      ? `guest:${guest.phone}`
      : null;

  if (!restaurantId || !clientId) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const rest = new Ably.Rest(key);
  const tokenRequest = await rest.auth.createTokenRequest({
    clientId,
    capability: JSON.stringify({
      [orderChannel(restaurantId)]: ["subscribe"],
    }),
  });
  return NextResponse.json({ ...tokenRequest, channel: orderChannel(restaurantId) });
}
