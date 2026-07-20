/** Client-safe Midtrans sandbox constants shared by the QRIS pay UI and server routes. */

export const MIDTRANS_SNAP_JS_URL = "https://app.sandbox.midtrans.com/snap/snap.js";

/** Fixed demo rate, mirroring `XLM_USD_RATE` — not a live FX feed. */
export const USD_IDR_RATE = 16_500;

/** Midtrans requires an integer IDR gross amount. */
export function usdToIdr(usd: number): number {
  return Math.round(usd * USD_IDR_RATE);
}

export function formatIdr(idr: number): string {
  return `Rp${idr.toLocaleString("id-ID")}`;
}
