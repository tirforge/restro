import { redirect } from "next/navigation";

import { KitchenDisplay } from "@/components/kitchen/kitchen-display";
import { getStaffContextOrNull } from "@/lib/staff-auth";
import { resolveStationsFor } from "@/lib/staff-stations";
import { listKitchenTickets } from "@/services/kitchen.service";
import { getStaffLoginRestaurant } from "@/services/staff-auth.service";

export default async function KitchenStationPage({
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
  if (!resolveStationsFor(ctx.roles).includes("kitchen")) {
    redirect(`/u/${username}`);
  }

  return (
    <main className="min-h-svh">
      <KitchenDisplay
        username={restaurant.username}
        restaurantName={restaurant.name}
        staffName={ctx.name}
        tickets={await listKitchenTickets(ctx.restaurantId)}
      />
    </main>
  );
}
