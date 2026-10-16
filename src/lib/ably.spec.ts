import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("ably", () => ({
  default: { Rest: vi.fn() },
}));

import Ably from "ably";
import { orderChannel, publishOrderEvent } from "./ably";

describe("orderChannel", () => {
  it("scopes channels per restaurant", () => {
    expect(orderChannel("res_1")).toBe("restaurant:res_1:orders");
  });
});

describe("publishOrderEvent", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.unstubAllEnvs();
  });

  it("publishes on the restaurant channel", async () => {
    vi.stubEnv("ABLY_API_KEY", "key:secret");
    const publish = vi.fn().mockResolvedValue(undefined);
    // NOTE: must be `function` — arrow functions cannot be constructed.
    vi.mocked(Ably.Rest).mockImplementation(function (
      this: unknown,
    ) {
      return { channels: { get: () => ({ publish }) } };
    } as never);

    await publishOrderEvent("res_1", "order.created", { orderId: "o1" });

    expect(publish).toHaveBeenCalledWith("order.created", { orderId: "o1" });
  });

  it("no-ops without a key and never throws offline", async () => {
    vi.stubEnv("ABLY_API_KEY", "");
    await expect(
      publishOrderEvent("res_1", "order.created"),
    ).resolves.toBeUndefined();

    vi.stubEnv("ABLY_API_KEY", "key:secret");
    vi.mocked(Ably.Rest).mockImplementation(function (
      this: unknown,
    ) {
      return {
        channels: {
          get: () => ({
            publish: vi.fn().mockRejectedValue(new Error("offline")),
          }),
        },
      };
    } as never);
    await expect(
      publishOrderEvent("res_1", "order.created"),
    ).resolves.toBeUndefined();
  });
});
