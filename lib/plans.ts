export const LIMITS = {
  todayMax: 3, // Everyone: only three things on "Today" — the whole point.
  free: { laterMax: 15, winsHistoryDays: 7, aiSteps: false },
  pro: { laterMax: 500, winsHistoryDays: 3650, aiSteps: true },
} as const;

export const PRO_PRICE_LABEL = "$5/month";

export function limitsFor(plan: "free" | "pro") {
  return plan === "pro" ? LIMITS.pro : LIMITS.free;
}
