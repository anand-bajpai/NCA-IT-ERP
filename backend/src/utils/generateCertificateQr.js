import QRCode from "qrcode";

// Builds the public verification URL a scanned QR code should open,
// and returns it as a base64 PNG data URL ready to store on the
// Certificate document / render straight into an <img src="...">.
//
// URL shape: /certificate-verification/:verificationId  (path param, per spec)
export function buildVerificationUrl(verificationId) {
  const frontendUrl = (process.env.FRONTEND_URL || "http://localhost:5173").replace(/\/$/, "");
  return `${frontendUrl}/certificate-verification/${encodeURIComponent(verificationId)}`;
}

export async function generateCertificateQr(verificationId) {
  const verifyUrl = buildVerificationUrl(verificationId);

  try {
    const dataUrl = await QRCode.toDataURL(verifyUrl, {
      width: 220,
      margin: 1,
      color: { dark: "#0f172a", light: "#ffffff" },
    });
    return dataUrl;
  } catch (err) {
    console.error("QR generation error:", err);
    return "";
  }
}
