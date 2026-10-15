import { describe, expect, it } from "vitest";

import { buildUpiUri, isValidVpa } from "@/lib/upi";

describe("isValidVpa", () => {
  it("accepts name@bank handles", () => {
    expect(isValidVpa("demo@okhdfc")).toBe(true);
    expect(isValidVpa("my.shop-12@okaxis")).toBe(true);
  });

  it("rejects malformed ids", () => {
    expect(isValidVpa("notavpa")).toBe(false);
    expect(isValidVpa("a@b")).toBe(false);
    expect(isValidVpa("")).toBe(false);
  });
});

describe("buildUpiUri", () => {
  it("builds a dynamic collect URI", () => {
    const uri = buildUpiUri({
      vpa: "demo@okhdfc",
      name: "Demo Restaurant",
      amount: 280,
      note: "Bill #3",
      ref: "ORD-3",
    });
    expect(uri).toBe(
      "upi://pay?pa=demo%40okhdfc&pn=Demo+Restaurant&am=280.00&cu=INR&tn=Bill+%233&tr=ORD-3",
    );
  });

  it("throws on bad vpa or amount", () => {
    expect(() =>
      buildUpiUri({ vpa: "bad", name: "X", amount: 10 }),
    ).toThrow("Invalid UPI ID");
    expect(() =>
      buildUpiUri({ vpa: "demo@okhdfc", name: "X", amount: 0 }),
    ).toThrow("greater than zero");
  });
});
