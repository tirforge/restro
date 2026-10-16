import { redirect } from "next/navigation";

import { CashierBilling } from "@/components/cashier/cashier-billing";
import { getStaffContextOrNull } from "@/lib/staff-auth";
import { resolveStationsFor } from "@/lib/staff-stations";
import { listOrders } from "@/services/order.service";
import { getStaffLoginRestaurant } from "@/services/staff-auth.service";
import { findRestaurantByUsername } from "@/repositories/restaurant.repository";

/**
 * Cashier billing station — settle open bills with cash or UPI (dynamic
 * GPay QR). Runs on the staff session; no manager/admin login required.
 * WAITER + CASHIER + MANAGEMENT roles may settle.
 */
export default async function CashierBillingPage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const ctx = await getStaffContextOrNull();
  if (!ctx) {
    redirect(`/u/${username}/login`);
  }

  const restaurant = await getStaffLoginRestaurant(username);
  if (!restaurant || restaurant.id !== ctx.restaurantId) {
    redirect(`/u/${username}/login`);
  }
  if (!resolveStationsFor(ctx.roles).includes("billing")) {
    redirect(`/u/${username}`);
  }

  const full = await findRestaurantByUsername(username);

  return (
    <main className="min-h-svh">
      <CashierBilling
        username={restaurant.username}
        restaurantName={restaurant.name}
        upiId={full?.upiId ?? null}
        staffName={ctx.name}
        staffRoles={ctx.roles}
        initialOrders={await listOrders(ctx.restaurantId, ["OPEN"])}
      />
    </main>
  );
}
