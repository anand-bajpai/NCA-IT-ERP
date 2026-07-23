import IdCard from "../models/IdCard.js";

// Generates ID card numbers like NCA-ID-2026-0001, unique per calendar year.
export async function generateIdCardNumber() {
  const year = new Date().getFullYear();
  const prefix = `NCA-ID-${year}-`;

  for (let attempt = 0; attempt < 5; attempt++) {
    const countThisYear = await IdCard.countDocuments({
      idCardNumber: { $regex: `^${prefix}` },
    });

    const nextSeq = countThisYear + 1 + attempt;
    const candidate = `${prefix}${String(nextSeq).padStart(4, "0")}`;

    const exists = await IdCard.exists({ idCardNumber: candidate });
    if (!exists) return candidate;
  }

  return `${prefix}${Date.now()}`;
}
