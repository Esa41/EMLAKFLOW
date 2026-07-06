import type { RentalPeriod } from "@prisma/client";

/** Sözleşme tarih aralığından ödeme planı satırları üretir. */
export function buildPaymentSchedule(input: {
  startDate: Date;
  endDate: Date;
  period: RentalPeriod;
  rentAmount: number;
  paymentDueDay: number;
}): Array<{ periodLabel: string; dueDate: Date; amount: number }> {
  const { startDate, endDate, period, rentAmount, paymentDueDay } = input;
  const rows: Array<{ periodLabel: string; dueDate: Date; amount: number }> = [];

  if (period === "MONTHLY") {
    const cur = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
    const end = new Date(endDate.getFullYear(), endDate.getMonth(), 1);
    while (cur <= end) {
      const y = cur.getFullYear();
      const m = cur.getMonth();
      const lastDay = new Date(y, m + 1, 0).getDate();
      const day = Math.min(Math.max(paymentDueDay, 1), lastDay);
      const due = new Date(y, m, day);
      if (due >= startDate && due <= endDate) {
        rows.push({
          periodLabel: `${y}-${String(m + 1).padStart(2, "0")}`,
          dueDate: due,
          amount: rentAmount,
        });
      }
      cur.setMonth(cur.getMonth() + 1);
    }
    return rows;
  }

  if (period === "WEEKLY") {
    let i = 0;
    const cur = new Date(startDate);
    while (cur <= endDate) {
      const weekEnd = new Date(cur);
      weekEnd.setDate(weekEnd.getDate() + 6);
      rows.push({
        periodLabel: `H${++i}-${cur.toISOString().slice(0, 10)}`,
        dueDate: new Date(cur),
        amount: rentAmount,
      });
      cur.setDate(cur.getDate() + 7);
    }
    return rows;
  }

  // DAILY
  const cur = new Date(startDate);
  let i = 0;
  while (cur <= endDate) {
    rows.push({
      periodLabel: `G${++i}-${cur.toISOString().slice(0, 10)}`,
      dueDate: new Date(cur),
      amount: rentAmount,
    });
    cur.setDate(cur.getDate() + 1);
  }
  return rows;
}

export type PaymentStatus = "PAID" | "DUE" | "OVERDUE" | "UPCOMING";

export function paymentStatus(
  paidAt: Date | null,
  dueDate: Date,
  now = new Date(),
): PaymentStatus {
  if (paidAt) return "PAID";
  const due = new Date(dueDate);
  due.setHours(23, 59, 59, 999);
  if (due < now) return "OVERDUE";
  const soon = new Date(now);
  soon.setDate(soon.getDate() + 3);
  if (due <= soon) return "UPCOMING";
  return "DUE";
}
