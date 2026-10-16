import { describe, expect, it } from "vitest";

import {
  resolveStations,
  resolveStationsFor,
  rolesForStation,
} from "@/lib/staff-stations";

describe("resolveStations", () => {
  it("maps a single role to its stations", () => {
    expect(resolveStations("WAITER")).toEqual(["orders", "billing"]);
    expect(resolveStations("KITCHEN")).toEqual(["kitchen"]);
    expect(resolveStations("CASHIER")).toEqual(["billing"]);
    expect(resolveStations("MANAGEMENT")).toEqual([
      "orders",
      "kitchen",
      "billing",
    ]);
  });

  it("unions extra roles for dual-job shifts without duplicates", () => {
    expect(resolveStations("WAITER", ["CASHIER"])).toEqual([
      "orders",
      "billing",
    ]);
    expect(resolveStations("KITCHEN", ["WAITER"])).toEqual([
      "kitchen",
      "orders",
      "billing",
    ]);
  });
});

describe("resolveStationsFor", () => {
  it("returns [] for no roles", () => {
    expect(resolveStationsFor([])).toEqual([]);
  });
});

describe("rolesForStation", () => {
  it("lists roles unlocking billing", () => {
    expect(rolesForStation("billing")).toEqual(
      expect.arrayContaining(["WAITER", "CASHIER", "MANAGEMENT"]),
    );
    expect(rolesForStation("billing")).not.toContain("KITCHEN");
  });
});
