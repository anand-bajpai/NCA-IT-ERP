import { buildVerificationUrl } from "./generateCertificateQr.js";

// Turns a stored relative asset path (e.g. "/uploads/settings/logo.png") into
// an absolute URL so it renders inside an email client. Data URLs and already
// absolute URLs pass through untouched.
function toAbsoluteAssetUrl(src) {
  if (!src) return "";
  if (/^(https?:|data:)/i.test(src)) return src;
  const backendUrl = (process.env.BACKEND_PUBLIC_URL || process.env.SERVER_URL || "").replace(/\/$/, "");
  return backendUrl ? `${backendUrl}${src}` : "";
}

function formatDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

// Professional HTML email for a certificate. Deliberately does NOT attach the
// PDF — recipients get a secure verification link and must verify on the
// website before the (status-gated) download is enabled.
export function buildCertificateEmail(certificate, institute = {}) {
  const instituteName = institute.instituteName || "NCA IT Solution";
  const logoUrl = toAbsoluteAssetUrl(institute.logo);
  const verifyUrl = buildVerificationUrl(certificate.verificationId);

  const rows = [
    { label: "Recipient", value: certificate.studentName },
    { label: "Course / Project", value: certificate.course },
    { label: "Duration", value: certificate.duration },
    { label: "Certificate Number", value: certificate.certificateNumber },
    { label: "Verification ID", value: certificate.verificationId },
    { label: "Issue Date", value: formatDate(certificate.issueDate) },
    { label: "Certificate Type", value: certificate.certificateType },
  ];

  const rowsHtml = rows
    .filter((r) => r.value)
    .map(
      (r) => `
      <tr>
        <td style="padding:10px 14px;background:#f5f7fb;font-weight:600;color:#2d3748;border:1px solid #e5e7eb;width:200px;">${r.label}</td>
        <td style="padding:10px 14px;border:1px solid #e5e7eb;color:#1a202c;">${r.value}</td>
      </tr>`
    )
    .join("");

  const logoHtml = logoUrl
    ? `<img src="${logoUrl}" alt="${instituteName}" style="max-height:56px;margin-bottom:10px;" />`
    : "";

  const qrHtml = certificate.qrCode
    ? `
    <div style="text-align:center;margin:22px 0 6px;">
      <img src="${certificate.qrCode}" alt="Certificate verification QR code" width="160" height="160" style="border:1px solid #e5e7eb;border-radius:8px;" />
      <p style="font-size:12px;color:#64748b;margin:8px 0 0;">Scan this QR code to verify the certificate</p>
    </div>`
    : "";

  const html = `
  <div style="font-family:Arial,Helvetica,sans-serif;max-width:640px;margin:auto;background:#ffffff;">
    <div style="background:#2563eb;color:#fff;padding:24px;border-radius:8px 8px 0 0;text-align:center;">
      ${logoHtml}
      <h2 style="margin:0;font-size:20px;">Your Certificate is Ready 🎓</h2>
      <p style="margin:6px 0 0;font-size:13px;opacity:.9;">${instituteName}</p>
    </div>

    <div style="border:1px solid #e5e7eb;border-top:none;padding:24px;">
      <p style="color:#1a202c;font-size:14px;margin:0 0 6px;">Dear <strong>${certificate.studentName}</strong>,</p>
      <p style="color:#475569;font-size:14px;line-height:1.6;margin:0 0 18px;">
        Congratulations! Your certificate has been issued by <strong>${instituteName}</strong>.
        For your security, the certificate PDF is not attached to this email — please verify
        your certificate on our official website first, then download it there.
      </p>

      <table style="width:100%;border-collapse:collapse;border:1px solid #e5e7eb;">
        ${rowsHtml}
      </table>

      <div style="text-align:center;margin:26px 0 4px;">
        <a href="${verifyUrl}"
           style="display:inline-block;background:#2563eb;color:#ffffff;text-decoration:none;font-weight:600;font-size:15px;padding:13px 34px;border-radius:8px;">
          Verify &amp; Download Certificate
        </a>
        <p style="font-size:12px;color:#64748b;margin:10px 0 0;">
          Or open this link: <a href="${verifyUrl}" style="color:#2563eb;">${verifyUrl}</a>
        </p>
      </div>

      ${qrHtml}
    </div>

    <p style="font-size:12px;color:#888;margin-top:14px;text-align:center;">
      This message was generated automatically by ${instituteName}. If you did not expect this
      certificate, please ignore this email.
    </p>
  </div>`;

  return {
    subject: `🎓 Your Certificate ${certificate.certificateNumber} — ${instituteName}`,
    html,
  };
}

// Short pre-filled message used for the admin "WhatsApp Share" action.
export function buildCertificateWhatsAppMessage(certificate, institute = {}) {
  const instituteName = institute.instituteName || "NCA IT Solution";
  const verifyUrl = buildVerificationUrl(certificate.verificationId);
  return (
    `🎓 *${instituteName} — Certificate Issued*\n\n` +
    `Dear ${certificate.studentName},\n` +
    `Your certificate for *${certificate.course}* has been issued.\n\n` +
    `Certificate No: ${certificate.certificateNumber}\n` +
    `Verification ID: ${certificate.verificationId}\n\n` +
    `Verify & download securely here:\n${verifyUrl}`
  );
}
