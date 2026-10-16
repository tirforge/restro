import type { GuestPlaceOrderInput } from "@/lib/validators/guest-order";
import { deriveKitchenStatus } from "@/lib/kitchen";
import {
  findOrdersForGuest,
  findOrdersForWalkInTable,
  type OrderWithRelations,
} from "@/repositories/order.repository";
import { findRestaurantByUsername } from "@/repositories/restaurant.repository";
import { findTablesByRestaurant } from "@/repositories/table.repository";
import { computeBill } from "@/services/billing";
import { getMenu } from "@/services/menu-item.service";
import {
  addItems,
  createOrder,
  fireOrder,
  listOrders,
  type OrderContext,
} from "@/services/order.service";
import { resolveTableForOrder } from "@/services/table.service";
import type { MenuDTO } from "@/types/menu";
import type { GuestOrderSummaryDTO, OrderDTO } from "@/types/order";

export const GUEST_ORDER_RESTAURANT_NOT_FOUND = "GUEST_ORDER_RESTAURANT_NOT_FOUND";
export const GUEST_ORDER_DISABLED = "GUEST_ORDER_DISABLED";
export const GUEST_ORDER_TABLE_INVALID = "GUEST_ORDER_TABLE_INVALID";

export interface GuestOrderTarget {
  readonly restaurantId: string;
  readonly tableId: string;
  readonly tableLabel: string;
}

/**
 * Validate that a restaurant (by username) has self-ordering enabled and that
 * the table belongs to it. Shared by the OTP + place-order guest actions.
 */
export const resolveGuestOrderTarget = async (
  username: string,
  tableId: string,
): Promise<GuestOrderTarget> => {
  const restaurant = await findRestaurantByUsername(username);
  if (!restaurant || restaurant.deletedAt || !restaurant.isActive) {
    throw new Error(GUEST_ORDER_RESTAURANT_NOT_FOUND);
  }
  if (!restaurant.selfOrderEnabled) {
    throw new Error(GUEST_ORDER_DISABLED);
  }
  let table: { id: string; label: string };
  try {
    table = await resolveTableForOrder(restaurant.id, tableId);
  } catch {
    throw new Error(GUEST_ORDER_TABLE_INVALID);
  }
  return {
    restaurantId: restaurant.id,
    tableId: table.id,
    tableLabel: table.label,
  };
};

export interface GuestOrderActor {
  readonly restaurantId: string;
  readonly tableId: string;
  /** Verified phone, or null when OTP is disabled via GUEST_OTP_DISABLED. */
  readonly phone: string | null;
}

/**
 * Place a verified guest's dine-in order. If the table already has an open
 * order, append the items and fire them as an add-on batch; otherwise create a
 * new open order. Lines are tagged `SELF_ORDER`. No staff-accept gate (v1).
 */
export const placeGuestOrder = async (
  actor: GuestOrderActor,
  input: GuestPlaceOrderInput,
): Promise<OrderDTO> => {
  const ctx: OrderContext = {
    restaurantId: actor.restaurantId,
    userId: null,
    staffId: null,
    source: "SELF_ORDER",
  };

  const open = await listOrders(actor.restaurantId, ["OPEN"]);
  const existing = open.find((o) => o.tableId === actor.tableId);
  if (existing) {
    await addItems(ctx, { orderId: existing.id, items: input.items });
    return fireOrder(ctx, existing.id);
  }

  return createOrder(ctx, {
    orderType: "DINE_IN",
    tableId: actor.tableId,
    idempotencyKey: input.idempotencyKey,
    customerName: input.customerName,
    customerPhone: actor.phone ?? undefined,
    note: input.note,
    items: input.items,
  });
};

export interface GuestOrderPageData {
  readonly restaurantId: string;
  readonly restaurantName: string;
  readonly logoUrl: string | null;
  readonly username: string;
  readonly tableId: string;
  readonly tableLabel: string;
  readonly menu: MenuDTO;
}

export type GuestOrderPageResult =
  | { readonly status: "ok"; readonly data: GuestOrderPageData }
  | { readonly status: "not_found" }
  | { readonly status: "disabled"; readonly restaurantName: string }
  | { readonly status: "invalid_table"; readonly restaurantName: string };

/**
 * Load everything the public `/order/[username]` page needs, returning a
 * discriminated status instead of throwing so the page can render friendly
 * fallbacks (disabled / invalid table) without redirecting.
 */
export const loadGuestOrderPage = async (
  username: string,
  tableId: string | undefined,
): Promise<GuestOrderPageResult> => {
  const restaurant = await findRestaurantByUsername(username);
  if (!restaurant || restaurant.deletedAt || !restaurant.isActive) {
    return { status: "not_found" };
  }
  if (!restaurant.selfOrderEnabled) {
    return { status: "disabled", restaurantName: restaurant.name };
  }
  if (!tableId) {
    return { status: "invalid_table", restaurantName: restaurant.name };
  }
  let table: { id: string; label: string };
  try {
    table = await resolveTableForOrder(restaurant.id, tableId);
  } catch {
    return { status: "invalid_table", restaurantName: restaurant.name };
  }
  const menu = await getMenu(restaurant.id);
  return {
    status: "ok",
    data: {
      restaurantId: restaurant.id,
      restaurantName: restaurant.name,
      logoUrl: restaurant.logoUrl,
      username: restaurant.username ?? username,
      tableId: table.id,
      tableLabel: table.label,
      menu,
    },
  };
};

export interface GuestTableOption {
  readonly id: string;
  readonly label: string;
  readonly seats: number | null;
}

/**
 * Active tables a guest can pick from when they arrive without a table QR
 * (or want to switch). Returns an empty list when the restaurant is missing,
 * inactive, or has self-ordering disabled.
 */
export const listGuestTables = async (
  username: string,
): Promise<readonly GuestTableOption[]> => {
  const restaurant = await findRestaurantByUsername(username);
  if (
    !restaurant ||
    restaurant.deletedAt ||
    !restaurant.isActive ||
    !restaurant.selfOrderEnabled
  ) {
    return [];
  }
  const tables = await findTablesByRestaurant(restaurant.id);
  return tables.map((t) => ({ id: t.id, label: t.label, seats: t.seats }));
};

const GUEST_ORDER_LIMIT = 15;

const num = (v: unknown): number => Number(v);

const toGuestSummary = (o: OrderWithRelations): GuestOrderSummaryDTO => {
  const active = o.items.filter((i) => i.state !== "VOID");
  const total =
    o.status === "COMPLETED"
      ? num(o.grandTotal)
      : computeBill(
          active.map((i) => ({
            unitPrice: num(i.unitPrice),
            modifiersDelta: i.modifiers.reduce(
              (s, m) => s + num(m.priceDelta),
              0,
            ),
            quantity: i.quantity,
            taxRate: num(i.taxRate),
            taxInclusive: i.taxInclusive,
            isComp: i.isComp,
          })),
        ).grandTotal;
  return {
    id: o.id,
    orderNumber: o.orderNumber,
    createdAt: o.createdAt.toISOString(),
    orderType: o.orderType,
    tableLabel: o.tableLabel,
    status: o.status,
    kitchenStatus: deriveKitchenStatus(active.map((i) => i.state)),
    itemCount: active.reduce((s, i) => s + i.quantity, 0),
    total,
    lines: active.map((i) => ({
      name: i.name,
      variantName: i.variantName,
      quantity: i.quantity,
      state: i.state,
    })),
  };
};

/**
 * A verified guest's own orders (by phone) plus any order on their current
 * table, most recent first — as a PII-free summary with live kitchen status.
 */
export const getGuestOrders = async (
  restaurantId: string,
  phone: string,
  tableId: string,
): Promise<GuestOrderSummaryDTO[]> => {
  const orders = await findOrdersForGuest(
    restaurantId,
    phone,
    tableId,
    GUEST_ORDER_LIMIT,
  );
  return orders.map(toGuestSummary);
};

/**
 * Walk-in (OTP-disabled) tracking: the table + guest name stand in for the
 * phone. An empty name matches nothing — the UI requires a name before
 * placing, so tracking always has a key.
 */
export const getGuestWalkInOrders = async (
  restaurantId: string,
  tableId: string,
  customerName?: string,
): Promise<GuestOrderSummaryDTO[]> => {
  const name = customerName?.trim();
  if (!name) {
    return [];
  }
  const orders = await findOrdersForWalkInTable(
    restaurantId,
    tableId,
    name,
    GUEST_ORDER_LIMIT,
  );
  return orders.map(toGuestSummary);
};
