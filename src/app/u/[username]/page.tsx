import Link from "next/link";
import { redirect } from "next/navigation";

import { buttonVariants } from "@/components/ui/button";
import { getStaffContextOrNull } from "@/lib/staff-auth";
import {
  STATION_HREF,
  STATION_LABEL,
  resolveStationsFor,
} from "@/lib/staff-stations";
import { getStaffLoginRestaurant } from "@/services/staff-auth.service";

const STATION_ICON: Record<string, string> = {
  orders: "📝",
  kitchen: "👨‍🍳",
  billing: "🧾",
};

/**
 * Station hub — after PIN login, staff pick which job to work right now.
 * Understaffed shifts: one login covers every station their roles unlock.
 */
export default async function StaffHomePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const ctx = await getStaffContextOrNull();
  if (!ctx) {
    redirect(`/u/${username}/login`);
  }

  // The URL's restaurant must match the signed-in staff's restaurant.
  const restaurant = await getStaffLoginRestaurant(username);
  if (!restaurant || restaurant.id !== ctx.restaurantId) {
    redirect(`/u/${username}/login`);
  }

  const stations = resolveStationsFor(ctx.roles);
  const hrefs = STATION_HREF(restaurant.username);

  return (
    <main className="mx-auto flex min-h-svh w-full max-w-md flex-col justify-center gap-6 px-4 py-8">
      <div className="flex flex-col items-center gap-1 text-center">
        <p className="text-muted-foreground text-sm">{restaurant.name}</p>
        <h1 className="text-2xl font-bold">Hi, {ctx.name}</h1>
        <p className="text-muted-foreground text-sm">
          {ctx.role.charAt(0) + ctx.role.slice(1).toLowerCase()}
          {ctx.roles.length > 1 ? " · also on multiple stations" : ""} — pick
          your station
        </p>
      </div>
      <div className="flex flex-col gap-3">
        {stations.map((s) => (
          <Link
            key={s}
            href={hrefs[s]}
            className={buttonVariants({
              size: "lg",
              className:
                "h-16 w-full justify-between gap-3 rounded-2xl text-base font-semibold shadow-sm",
            })}
          >
            <span className="flex items-center gap-3">
              <span className="text-xl" aria-hidden>
                {STATION_ICON[s]}
              </span>
              {STATION_LABEL[s]}
            </span>
            <span aria-hidden className="text-muted-foreground text-base">
              ›
            </span>
          </Link>
        ))}
        {stations.length === 0 ? (
          <p className="text-muted-foreground rounded-xl border border-dashed p-6 text-center text-sm">
            No stations assigned — ask your manager.
          </p>
        ) : null}
      </div>
    </main>
  );
}
