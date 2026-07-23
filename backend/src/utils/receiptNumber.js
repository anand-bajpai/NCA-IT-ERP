import FeeReceipt from "../models/FeeReceipt.js";

// Generates receipt numbers like NCA-FR-2026-0001, unique per calendar year.
// Retries a few times on the (rare) race-condition duplicate-key error.
export async function generateReceiptNumber() {
  const year = new Date().getFullYear();
  const prefix = `NCA-FR-${year}-`;

  for (let attempt = 0; attempt < 5; attempt++) {
    const countThisYear = await FeeReceipt.countDocuments({
      receiptNumber: { $regex: `^${prefix}` },
    });

    const nextSeq = countThisYear + 1 + attempt;
    const candidate = `${prefix}${String(nextSeq).padStart(4, "0")}`;

    const exists = await FeeReceipt.exists({ receiptNumber: candidate });
    if (!exists) return candidate;
  }

  // Extremely unlikely fallback
  return `${prefix}${Date.now()}`;
}
