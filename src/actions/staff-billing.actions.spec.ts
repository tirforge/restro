import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/admin-auth", () => ({ getAdminContextOrNull: vi.fn() }));
vi.mock("@/lib/manager-auth", () => ({ getManagerContextOrNull: vi.fn() }));
vi.mock("@/lib/staff-auth", () => ({ getStaffContextOrNull: vi.fn() }));
vi.mock("@/services/settlement.service", () => ({ settle: vi.fn() }));
vi.mock("@/services/order.service", () => ({ listOrders: vi.fn() }));

import { getStaffContextOrNull } from "@/lib/staff-auth";
import { listOrders } from "@/services/order.service";
import { settle } from "@/services/settlement.service";
import {
  staffOpenBillsAction,
  staffSettleAction,
} from "./staff-billing.actions";

const waiterCtx = {
  staffId: "st1",
  restaurantId: "res_1",
  role: "WAITER" as const,
  roles: ["WAITER" as const],
  name: "Ramesh",
  employeeCode: "E1",
};

const settleInput = {
  orderId: "o1",
  payments: [{ mode: "UPI" as const, amount: 280 }],
};

describe("staffSettleAction", () => {
  beforeEach(() => vi.clearAllMocks());

  it("settles attributed to the waiter (no manager userId)", async () => {
    vi.mocked(getStaffContextOrNull).mockResolvedValue(waiterCtx);
    vi.mocked(settle).mockResolvedValue({ id: "o1" } as never);

    const result = await staffSettleAction(settleInput);

    expect(result.success).toBe(true);
    expect(settle).toHaveBeenCalledWith(
      { restaurantId: "res_1", userId: null, staffId: "st1" },
      expect.objectContaining({ orderId: "o1" }),
    );
  });

  it("rejects kitchen staff", async () => {
    vi.mocked(getStaffContextOrNull).mockResolvedValue({
      ...waiterCtx,
      role: "KITCHEN" as const,
  roles: ["KITCHEN" as const],
    });

    const result = await staffSettleAction(settleInput);

    expect(result.success).toBe(false);
    expect(settle).not.toHaveBeenCalled();
  });

  it("rejects without a staff session", async () => {
    vi.mocked(getStaffContextOrNull).mockResolvedValue(null);

    const result = await staffSettleAction(settleInput);

    expect(result.success).toBe(false);
    expect(settle).not.toHaveBeenCalled();
  });
});

describe("staffOpenBillsAction", () => {
  beforeEach(() => vi.clearAllMocks());

  it("lists open orders for the staff restaurant", async () => {
    vi.mocked(getStaffContextOrNull).mockResolvedValue(waiterCtx);
    vi.mocked(listOrders).mockResolvedValue([{ id: "o1" }] as never);

    const result = await staffOpenBillsAction({});

    expect(result.success).toBe(true);
    expect(listOrders).toHaveBeenCalledWith("res_1", ["OPEN"]);
  });
});
