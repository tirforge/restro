/**
 * UPI dynamic-collect helpers (NPCI `upi://pay` format — one code works in
 * Google Pay, PhonePe, Paytm, BHIM and every bank app).
 *
 * @see https://useqr.app/docs/payments/upi-qr-code-format
 */

export interface UpiPayDetails {
  /** Payee VPA, e.g. "shop@okhdfc". */
  readonly vpa: string;
  /** Payee name shown on the payer's confirmation screen. */
  readonly name: string;
  /** Amount in rupees (up to 2 decimals). */
  readonly amount: number;
  /** Transaction note (kept short — every char grows the QR). */
  readonly note?: string;
  /** Transaction reference, unique per collection. */
  readonly ref?: string;
}

const VPA_PATTERN = /^[\w.\-]{2,256}@[a-zA-Z]{2,64}$/;

/** Validate a UPI VPA (`name@bankhandle`). */
export const isValidVpa = (vpa: string): boolean => VPA_PATTERN.test(vpa);

/**
 * Build a `upi://pay?...` URI with a dynamic amount. Every value is
 * percent-encoded. Throws on an invalid VPA or non-positive amount.
 */
export const buildUpiUri = (d: UpiPayDetails): string => {
  if (!isValidVpa(d.vpa)) {
    throw new Error("Invalid UPI ID (expected name@bank).");
  }
  if (!Number.isFinite(d.amount) || d.amount <= 0) {
    throw new Error("Amount must be greater than zero.");
  }
  const params = new URLSearchParams({
    pa: d.vpa,
    pn: d.name,
    am: d.amount.toFixed(2),
    cu: "INR",
  });
  if (d.note) params.set("tn", d.note.slice(0, 25));
  if (d.ref) params.set("tr", d.ref.slice(0, 35));
  return `upi://pay?${params.toString()}`;
}
