import { describe, expect, it } from "vitest";

import {
  createStaffSchema,
  staffLoginSchema,
  updateStaffSchema,
} from "@/lib/validators/staff";

describe("staffLoginSchema", () => {
  it("accepts slug-like restaurant usernames with hyphens", () => {
    const result = staffLoginSchema.safeParse({
      username: "demo-restaurant",
      employeeCode: "EMP001",
      pin: "1111",
    });
    expect(result.success).toBe(true);
  });

  it("still rejects empty usernames and malformed PINs", () => {
    expect(
      staffLoginSchema.safeParse({
        username: "",
        employeeCode: "EMP001",
        pin: "1111",
      }).success,
    ).toBe(false);
    expect(
      staffLoginSchema.safeParse({
        username: "demo-restaurant",
        employeeCode: "EMP001",
        pin: "12",
      }).success,
    ).toBe(false);
  });
});

const baseStaff = {
  employeeCode: "E9",
  name: "Asha",
  role: "WAITER" as const,
  status: "ACTIVE" as const,
  phone: "+919876543210",
  pin: "1234",
};

describe("createStaffSchema extra roles", () => {
  it("accepts CASHIER as a primary role and defaults extraRoles to []", () => {
    const result = createStaffSchema.safeParse({ ...baseStaff, role: "CASHIER" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.extraRoles).toEqual([]);
    }
  });

  it("accepts extra stations for dual-role shifts", () => {
    const result = createStaffSchema.safeParse({
      ...baseStaff,
      extraRoles: ["CASHIER"],
    });
    expect(result.success).toBe(true);
  });

  it("rejects the primary role repeating in extraRoles", () => {
    const result = createStaffSchema.safeParse({
      ...baseStaff,
      extraRoles: ["WAITER"],
    });
    expect(result.success).toBe(false);
  });
});

describe("updateStaffSchema extra roles", () => {
  it("rejects the primary role repeating in extraRoles", () => {
    const result = updateStaffSchema.safeParse({
      id: "st1",
      ...baseStaff,
      role: "KITCHEN",
      extraRoles: ["KITCHEN", "CASHIER"],
    });
    expect(result.success).toBe(false);
  });
});
