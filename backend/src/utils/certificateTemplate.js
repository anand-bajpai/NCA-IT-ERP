import path from "path";
import { fileURLToPath } from "url";
import { fileToDataUrl, storedRefToDataUrl } from "./certificateAssets.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DEFAULT_LOGO_PATH = path.join(__dirname, "..", "assets", "logo.png");

// Certificate-type -> display metadata (title shown on the certificate,
// and the eyebrow line above the recipient name).
const TYPE_META = {
  "Student Course Completion": { title: "CERTIFICATE OF COMPLETION", eyebrow: "This is to certify that" },
  "Internship Completion": { title: "CERTIFICATE OF INTERNSHIP COMPLETION", eyebrow: "This is to certify that" },
  "Client Project Completion": { title: "CERTIFICATE OF PROJECT COMPLETION", eyebrow: "This is to certify that" },
  "Certificate of Appreciation": { title: "CERTIFICATE OF APPRECIATION", eyebrow: "Presented to" },
  "Certificate of Excellence": { title: "CERTIFICATE OF EXCELLENCE", eyebrow: "Presented to" },
  // Legacy values
  Training: { title: "CERTIFICATE OF COMPLETION", eyebrow: "This is to certify that" },
  Internship: { title: "CERTIFICATE OF INTERNSHIP COMPLETION", eyebrow: "This is to certify that" },
  Client: { title: "CERTIFICATE OF PROJECT COMPLETION", eyebrow: "This is to certify that" },
};

function escapeHtml(str) {
  return String(str ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function formatDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" });
}

// Builds the achievement statement paragraph, tailored per certificate type.
function buildStatement(cert) {
  const course = escapeHtml(cert.course);
  const technology = cert.technology ? ` (${escapeHtml(cert.technology)})` : "";
  const duration = escapeHtml(cert.duration || "-");
  const joining = cert.joiningDate ? `, having joined on <strong>${formatDate(cert.joiningDate)}</strong>` : "";
  const grade = cert.grade ? `, securing Grade <strong>${escapeHtml(cert.grade)}</strong>` : "";
  const organization = escapeHtml(cert.organization || "");

  switch (cert.certificateType) {
    case "Internship Completion":
    case "Internship":
      return `has successfully completed the internship program in <strong>${course}</strong>${technology} for a duration of <strong>${duration}</strong>${joining}, demonstrating dedication, discipline and technical aptitude throughout the internship period.`;

    case "Client Project Completion":
    case "Client":
      return `${organization ? `of <strong>${organization}</strong> ` : ""}has successfully completed the project <strong>${course}</strong>${
        cert.duration ? ` within a duration of <strong>${duration}</strong>` : ""
      }, delivered to the complete satisfaction of the client.`;

    case "Certificate of Appreciation":
      return cert.description
        ? escapeHtml(cert.description)
        : `is being honored with this Certificate of Appreciation in recognition of valuable contribution, dedication and support towards <strong>${
            organization || course
          }</strong>.`;

    case "Certificate of Excellence":
      return cert.description
        ? escapeHtml(cert.description)
        : `is being awarded this Certificate of Excellence for outstanding performance and exceptional dedication in <strong>${course}</strong>${grade}.`;

    case "Student Course Completion":
    case "Training":
    default:
      return `has successfully completed the course <strong>${course}</strong>${technology} for a duration of <strong>${duration}</strong>${joining}${grade}.`;
  }
}

// Builds a complete, standalone A4-landscape HTML document for a certificate.
// `certificate` is a plain object (lean/toObject) from the Certificate model.
// `institute` is the merged institute-settings object (see instituteSettingsCache.getInstituteInfo).
export function buildCertificateHtml(certificate, institute) {
  const meta = TYPE_META[certificate.certificateType] || TYPE_META["Student Course Completion"];

  const logoData = storedRefToDataUrl(institute.logo) || fileToDataUrl(DEFAULT_LOGO_PATH);
  const watermarkData = logoData;
  const signatureData = storedRefToDataUrl(institute.AuthorizedSignature);
  const stampData = storedRefToDataUrl(institute.InstituteStamp);
  const photoData = storedRefToDataUrl(certificate.photo);
  const qrData = certificate.qrCode || "";

  const instituteName = escapeHtml(institute.instituteName || "NCA IT Solution");
  const directorName = escapeHtml(institute.DirectorName || "Director");
  const recipientName = escapeHtml(certificate.studentName);
  const statement = buildStatement(certificate);

  // "CERTIFICATE OF COMPLETION" -> main word "CERTIFICATE" on its own line,
  // the rest ("OF COMPLETION") as the smaller letter-spaced subtitle below it.
  const [titleMain, ...titleRestParts] = meta.title.split(" ");
  const titleRest = titleRestParts.join(" ");

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<title>${escapeHtml(certificate.certificateNumber)}</title>
<style>
  @page { size: A4 landscape; margin: 0; }
  * {
    box-sizing: border-box;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
    color-adjust: exact;
  }
  html, body {
    margin: 0; padding: 0;
    width: 297mm; height: 210mm;
    font-family: 'Georgia', 'Times New Roman', serif;
    background: #fff;
  }
  .certificate {
    position: relative;
    width: 297mm; height: 210mm;
    overflow: hidden;
    background: #ffffff;
    page-break-inside: avoid;
    break-inside: avoid;
  }
  @media print {
    html, body { width: 297mm; height: 210mm; }
    .certificate { margin: 0; }
  }

  /* ---- outer grey frame + inner white card ---- */
  .outer-frame { position: absolute; inset: 6mm; background: #cbd5e1; z-index: 0; }
  .card { position: absolute; inset: 9mm; background: #ffffff; overflow: hidden; isolation: isolate; }
  .card-border { position: absolute; inset: 6mm; border: 1px solid #94a3b8; pointer-events: none; z-index: 3; }

  .watermark {
    position: absolute;
    top: 50%; left: 50%;
    width: 120mm;
    transform: translate(-50%, -50%);
    opacity: 0.05;
    pointer-events: none;
    z-index: 1;
  }

  /* ---- diagonal navy/gold corner ribbons/batch graphic, matching the
     certificate motif — pinned to the lowest layer inside the card so the
     QR verification badge (z-index further below) always renders above it,
     no matter how the markup is reordered. ---- */
  .ribbons { position: absolute; inset: 0; overflow: hidden; pointer-events: none; z-index: 1; }
  .band { position: absolute; width: 420mm; transform-origin: 0 0; }
  .tl1 { background: #0b2e4d; top: -58mm; left: -160mm; height: 60mm; transform: rotate(-38deg); }
  .tl2 { background: #f0b429; top: -14mm; left: -160mm; height: 14mm; transform: rotate(-38deg); }
  .tl3 { background: #123a5e; top: 6mm; left: -160mm; height: 30mm; transform: rotate(-38deg); }
  .tl4 { background: #f0b429; top: 34mm; left: -160mm; height: 7mm; transform: rotate(-38deg); }
  .tl5 { background: #081f36; top: 44mm; left: -160mm; height: 10mm; transform: rotate(-38deg); }
  .br1 { background: #0b2e4d; bottom: -58mm; right: -160mm; height: 60mm; transform: rotate(142deg); }
  .br2 { background: #f0b429; bottom: -14mm; right: -160mm; height: 14mm; transform: rotate(142deg); }
  .br3 { background: #123a5e; bottom: 6mm; right: -160mm; height: 30mm; transform: rotate(142deg); }
  .br4 { background: #f0b429; bottom: 34mm; right: -160mm; height: 7mm; transform: rotate(142deg); }
  .br5 { background: #081f36; bottom: 44mm; right: -160mm; height: 10mm; transform: rotate(142deg); }

  .content {
    position: absolute; inset: 0;
    z-index: 4;
    display: flex; flex-direction: column; align-items: center;
    padding: 14mm 26mm 12mm;
    text-align: center;
  }
  .header-row {
    width: 100%;
    display: flex; align-items: flex-start; justify-content: space-between;
  }
  .logo-block { display: flex; align-items: center; gap: 8px; }
  .logo-block img { width: 40px; height: 40px; object-fit: contain; }
  .logo-block .institute-name { font-size: 13px; font-weight: bold; color: #123a5e; letter-spacing: 0.5px; font-family: Arial, sans-serif; }
  .cert-meta-top { text-align: right; font-size: 8.5px; color: #64748b; line-height: 1.5; font-family: Arial, sans-serif; }

  .photo-frame {
    position: absolute;
    top: 16mm; right: 26mm;
    width: 24mm; height: 24mm;
    border-radius: 50%;
    border: 2px solid #f0b429;
    overflow: hidden;
    background: #f1f5f9;
  }
  .photo-frame img { width: 100%; height: 100%; object-fit: cover; }

  .title { margin-top: 9mm; font-size: 42px; letter-spacing: 9px; color: #1e293b; font-weight: 400; }
  .subtitle { font-size: 14px; letter-spacing: 5px; color: #334155; margin-top: 1mm; font-family: Arial, sans-serif; }
  .divider { display: flex; align-items: center; gap: 6px; margin: 5mm 0 6mm; }
  .diamond { width: 7px; height: 7px; transform: rotate(45deg); }
  .diamond.gold { background: #f0b429; }
  .diamond.navy { background: #123a5e; }

  .eyebrow { font-size: 11px; color: #475569; font-style: italic; font-family: Arial, sans-serif; }
  .recipient-name {
    margin-top: 3mm; font-family: 'Brush Script MT', 'Segoe Script', 'Lucida Handwriting', cursive;
    font-size: 42px; color: #1e293b; line-height: 1;
  }
  .statement {
    margin-top: 6mm; max-width: 185mm; font-size: 12.5px; line-height: 1.85; color: #334155; font-family: Arial, sans-serif;
  }

  .footer-row {
    position: absolute; bottom: 14mm; left: 26mm; right: 26mm;
    z-index: 5;
    display: flex; align-items: flex-end; justify-content: space-between;
  }
  .footer-block { text-align: center; min-width: 48mm; }
  .footer-block img.sign { height: 12mm; object-fit: contain; }
  .footer-block img.stamp { height: 20mm; object-fit: contain; }
  .footer-line { border-top: 1px solid #334155; margin-top: 2mm; padding-top: 1.5mm; font-size: 9.5px; font-weight: bold; color: #1e293b; font-family: Arial, sans-serif; }
  .footer-sub { font-size: 8px; color: #64748b; font-family: Arial, sans-serif; }

  /* ---- QR verification seal — styled as the medal/ribbon badge ----
     The seal itself sits well above the corner ribbons/batch graphic
     (z-index 1) and every other layer of the card, and internally the QR
     medal (z-index 2) is always painted above its own decorative ribbon
     tails (z-index 1) so nothing ever overlaps the scannable QR code. */
  .seal { position: relative; width: 30mm; text-align: center; z-index: 10; isolation: isolate; }
  .seal-ribbons { position: absolute; top: 22mm; left: 50%; transform: translateX(-50%); width: 26mm; z-index: 1; }
  .seal-ribbons svg { width: 100%; display: block; }
  .seal-medal {
    width: 26mm; height: 26mm; border-radius: 50%;
    background: #123a5e; border: 2px solid #f0b429;
    display: flex; align-items: center; justify-content: center;
    margin: 0 auto; position: relative; z-index: 2;
    box-shadow: 0 0 0 1px rgba(255,255,255,0.4);
  }
  .seal-medal .qr-inner {
    width: 20mm; height: 20mm; background: #fff; border-radius: 2px; padding: 1mm;
    position: relative; z-index: 2;
  }
  .seal-medal .qr-inner img { width: 100%; height: 100%; display: block; }
  .seal-label { margin-top: 9mm; font-size: 7.5px; letter-spacing: 0.5px; color: #64748b; font-family: Arial, sans-serif; }

  .ids-row {
    position: absolute; bottom: 4mm; left: 26mm; right: 26mm;
    z-index: 5;
    display: flex; justify-content: space-between;
    font-size: 7.5px; color: #94a3b8; font-family: Arial, sans-serif;
  }
  .ids-row strong { color: #64748b; }
</style>
</head>
<body>
  <div class="certificate">
    <div class="outer-frame"></div>
    <div class="card">
      <div class="ribbons">
        <div class="band tl1"></div>
        <div class="band tl2"></div>
        <div class="band tl3"></div>
        <div class="band tl4"></div>
        <div class="band tl5"></div>
        <div class="band br1"></div>
        <div class="band br2"></div>
        <div class="band br3"></div>
        <div class="band br4"></div>
        <div class="band br5"></div>
      </div>
      ${watermarkData ? `<img class="watermark" src="${watermarkData}" alt="" />` : ""}
      <div class="card-border"></div>

      <div class="content">
        <div class="header-row">
          <div class="logo-block">
            ${logoData ? `<img src="${logoData}" alt="logo" />` : ""}
            <span class="institute-name">${instituteName}</span>
          </div>
          <div class="cert-meta-top">
            Certificate No: <strong>${escapeHtml(certificate.certificateNumber)}</strong><br/>
            Issued: ${formatDate(certificate.issueDate)}
          </div>
        </div>

        ${photoData ? `<div class="photo-frame"><img src="${photoData}" alt="photo" /></div>` : ""}

        <div class="title">${escapeHtml(titleMain)}</div>
        ${titleRest ? `<div class="subtitle">${escapeHtml(titleRest)}</div>` : ""}
        <div class="divider">
          <span class="diamond gold"></span><span class="diamond navy"></span><span class="diamond gold"></span>
        </div>

        <div class="eyebrow">${meta.eyebrow}</div>
        <div class="recipient-name">${recipientName}</div>
        <div class="statement">${statement}</div>
      </div>

      <div class="footer-row">
        <div class="footer-block">
          ${signatureData ? `<img class="sign" src="${signatureData}" alt="signature" />` : ""}
          <div class="footer-line">${directorName}</div>
          <div class="footer-sub">Director</div>
        </div>

        <div class="seal">
          <div class="seal-ribbons">
            <svg viewBox="0 0 100 60" xmlns="http://www.w3.org/2000/svg">
              <polygon points="30,0 46,0 40,60 22,50" fill="#f0b429"/>
              <polygon points="54,0 70,0 78,50 60,60" fill="#123a5e"/>
            </svg>
          </div>
          <div class="seal-medal">
            ${qrData ? `<div class="qr-inner"><img src="${qrData}" alt="QR Code" /></div>` : ""}
          </div>
          <div class="seal-label">SCAN TO VERIFY</div>
        </div>

        <div class="footer-block">
          ${stampData ? `<img class="stamp" src="${stampData}" alt="stamp" />` : ""}
          <div class="footer-line">${instituteName}</div>
          <div class="footer-sub">Institute Stamp</div>
        </div>
      </div>

      <div class="ids-row">
        <span>Verification ID: <strong>${escapeHtml(certificate.verificationId)}</strong></span>
        <span>Verify at: <strong>${escapeHtml((process.env.FRONTEND_URL || "").replace(/\/$/, ""))}/certificate-verification/${escapeHtml(certificate.verificationId)}</strong></span>
      </div>
    </div>
  </div>
</body>
</html>`;
}
