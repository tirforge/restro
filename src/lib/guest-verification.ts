/**
 * Guest OTP kill-switch. When `GUEST_OTP_DISABLED=true`, guests order
 * straight from the table picker with no phone verification — the place
 * action skips the session check and the menu renders without the login
 * gate. Defaults to false (OTP required).
 */
export const isGuestOtpSkipped = (): boolean =>
  process.env.GUEST_OTP_DISABLED === "true";
