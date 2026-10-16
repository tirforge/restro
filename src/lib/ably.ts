import Ably from "ably";

/**
 * Server-side Ably helpers. The API key never leaves the server — browsers
 * authenticate via short-lived tokens from `/api/ably/token`.
 */

export const orderChannel = (restaurantId: string): string =>
  `restaurant:${restaurantId}:orders`;

export type OrderEventName =
  | "order.created"
  | "order.updated"
  | "order.settled";

let rest: Ably.Rest | null = null;

const getClient = (): Ably.Rest | null => {
  const key = process.env.ABLY_API_KEY;
  if (!key) return null;
  rest ??= new Ably.Rest(key);
  return rest;
};

/**
 * Publish an order event. Fire-and-forget safe: logs and resolves when Ably
 * is unconfigured or unreachable — ordering must never break on realtime.
 */
export const publishOrderEvent = async (
  restaurantId: string,
  event: OrderEventName,
  data: Record<string, unknown> = {},
): Promise<void> => {
  try {
    const client = getClient();
    if (!client) return;
    await client.channels.get(orderChannel(restaurantId)).publish(event, data);
  } catch (error) {
    console.warn("[ably] publish failed:", (error as Error).message);
  }
};
