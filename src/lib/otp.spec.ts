import { describe, expect, it, vi, afterEach } from "vitest";

import { getDevOtpCode, isDevOtpBypass } from "@/lib/otp";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("isDevOtpBypass", () => {
  it("is false unless DEV_OTP_BYPASS is exactly 'true'", () => {
    vi.stubEnv("DEV_OTP_BYPASS", "");
    expect(isDevOtpBypass()).toBe(false);
    vi.stubEnv("DEV_OTP_BYPASS", "1");
    expect(isDevOtpBypass()).toBe(false);
    vi.stubEnv("DEV_OTP_BYPASS", "true");
    expect(isDevOtpBypass()).toBe(true);
  });
});

describe("getDevOtpCode", () => {
  it("defaults to 123456", () => {
    vi.stubEnv("DEV_OTP_CODE", "");
    expect(getDevOtpCode()).toBe("123456");
  });

  it("honours DEV_OTP_CODE", () => {
    vi.stubEnv("DEV_OTP_CODE", "654321");
    expect(getDevOtpCode()).toBe("654321");
  });
});
