import type { StaffRole } from "@/types/staff";

/** Work stations a signed-in staff member can operate. */
export type Station = "orders" | "kitchen" | "billing";

const ROLE_STATIONS: Record<StaffRole, readonly Station[]> = {
  WAITER: ["orders", "billing"],
  KITCHEN: ["kitchen"],
  CASHIER: ["billing"],
  MANAGEMENT: ["orders", "kitchen", "billing"],
};

export const STATION_LABEL: Record<Station, string> = {
  orders: "Take orders",
  kitchen: "Kitchen display",
  billing: "Cashier billing",
};

export const STATION_HREF = (username: string): Record<Station, string> => ({
  orders: `/u/${username}/order/new`,
  kitchen: `/u/${username}/kitchen`,
  billing: `/u/${username}/billing`,
});

/**
 * Effective stations for a staffer: union over their primary role plus any
 * extra roles (dual-job shifts), de-duplicated in station order.
 */
export const resolveStations = (
  role: StaffRole,
  extraRoles: readonly StaffRole[] = [],
): Station[] => resolveStationsFor([role, ...extraRoles]);

/** Union of stations across a role list. */
export const resolveStationsFor = (
  roles: readonly StaffRole[],
): Station[] => {
  const seen = new Set<Station>();
  const out: Station[] = [];
  for (const r of roles) {
    for (const s of ROLE_STATIONS[r] ?? []) {
      if (!seen.has(s)) {
        seen.add(s);
        out.push(s);
      }
    }
  }
  return out;
};

/** All roles that unlock a station (for gates). */
export const rolesForStation = (station: Station): StaffRole[] =>
  (Object.keys(ROLE_STATIONS) as StaffRole[]).filter((r) =>
    ROLE_STATIONS[r].includes(station),
  );
