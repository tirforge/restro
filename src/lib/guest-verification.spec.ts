import { describe, expect, it, vi } from "vitest";

import { isGuestOtpSkipped } from "@/lib/guest-verification";

describe("isGuestOtpSkipped", () => {
  it("is false unless the env flag is exactly true", () => {
    vi.stubEnv("GUEST_OTP_DISABLED", "false");
    expect(isGuestOtpSkipped()).toBe(false);
    vi.stubEnv("GUEST_OTP_DISABLED", "1");
    expect(isGuestOtpSkipped()).toBe(false);
    vi.unstubAllEnvs();
  });

  it("is true when the flag is set", () => {
    vi.stubEnv("GUEST_OTP_DISABLED", "true");
    expect(isGuestOtpSkipped()).toBe(true);
    vi.unstubAllEnvs();
  });
});
