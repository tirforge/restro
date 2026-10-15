import { describe, expect, it } from "vitest";

import { staffLoginSchema } from "@/lib/validators/staff";

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
