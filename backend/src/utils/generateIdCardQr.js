import QRCode from "qrcode";

// ID cards don't have a dedicated public verification page (out of scope
// for this module), so the QR encodes a compact, human-readable summary
// that scans correctly with any phone camera / QR app — no server round
// trip required to be useful to security staff checking a card.
export function buildIdCardQrText(idCard) {
  const lines = [
    `NCA IT Solution - Student ID Card`,
    `ID No: ${idCard.idCardNumber}`,
    `Name: ${idCard.studentName}`,
    idCard.admissionNumber ? `Admission No: ${idCard.admissionNumber}` : null,
    `Course: ${idCard.course}`,
    idCard.batch ? `Batch: ${idCard.batch}` : null,
    idCard.mobile ? `Mobile: ${idCard.mobile}` : null,
    `Valid Upto: ${idCard.validUpto ? new Date(idCard.validUpto).toLocaleDateString("en-IN") : "-"}`,
  ].filter(Boolean);

  return lines.join("\n");
}

export async function generateIdCardQr(idCard) {
  try {
    const dataUrl = await QRCode.toDataURL(buildIdCardQrText(idCard), {
      width: 200,
      margin: 1,
      color: { dark: "#0f172a", light: "#ffffff" },
    });
    return dataUrl;
  } catch (err) {
    console.error("ID card QR generation error:", err);
    return "";
  }
}
