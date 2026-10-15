"use server";

import { z } from "zod";

import { withStaffValidation } from "@/actions/helpers";
import { settleSchema } from "@/lib/validators/order";
import { settle } from "@/services/settlement.service";
import { listOrders } from "@/services/order.service";
import type { OrderDTO } from "@/types/order";

/**
 * Cashier billing — no admin/manager portal needed. Any signed-in staff
 * member can view open bills; only WAITER + MANAGEMENT roles may settle.
 */

export const staffOpenBillsAction = withStaffValidation(
  z.object({}),
  async (_data, ctx): Promise<OrderDTO[]> => listOrders(ctx.restaurantId, ["OPEN"]),
);

export const staffSettleAction = withStaffValidation(
  settleSchema,
  async (data, ctx): Promise<OrderDTO> => {
    if (ctx.role !== "WAITER" && ctx.role !== "MANAGEMENT") {
      throw new Error("STAFF_FORBIDDEN");
    }
    return settle(
      { restaurantId: ctx.restaurantId, userId: null, staffId: ctx.staffId },
      data,
    );
  },
);
