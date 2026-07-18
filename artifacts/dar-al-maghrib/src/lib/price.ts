/** Fixed conversion rate: 1 AED = 2.5 MAD */
const MAD_PER_AED = 2.5;

/** Convert a MAD price to AED, rounded to the nearest whole number. */
export function madToAed(mad: number): number {
  return Math.round(mad / MAD_PER_AED);
}

/** Returns a plain string like "85 MAD" (for button labels etc.) */
export function madLabel(mad: number): string {
  return `${Math.round(mad)} MAD`;
}
