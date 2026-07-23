import Student from "../models/Student.js";

// Generates admission numbers like NCA2026001, NCA2026002, ..., unique per
// calendar year. Mirrors the same prefix + yearly-sequence + collision-check
// pattern used by generateCertificateNumber() in certificateNumber.js.
export async function generateAdmissionNumber() {
  const year = new Date().getFullYear();
  const prefix = `NCA${year}`;

  for (let attempt = 0; attempt < 5; attempt++) {
    const countThisYear = await Student.countDocuments({
      admissionNumber: { $regex: `^${prefix}` },
    });

    const nextSeq = countThisYear + 1 + attempt;
    const candidate = `${prefix}${String(nextSeq).padStart(3, "0")}`;

    const exists = await Student.exists({ admissionNumber: candidate });
    if (!exists) return candidate;
  }

  return `${prefix}${Date.now()}`;
}
