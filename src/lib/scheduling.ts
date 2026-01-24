export const TIME_ZONE = "America/Los_Angeles";

export const SLOT_MINUTES = 30;

// Business hours in local time
export const BUSINESS_START_HOUR = 9; // 9:00
export const BUSINESS_END_HOUR = 17; // 17:00 (5pm)

// Helpers
export function toMinutes(h: number, m: number) {
  return h * 60 + m;
}
