import path from "path";
import { fileURLToPath } from "url";
import { fileToDataUrl, storedRefToDataUrl } from "./certificateAssets.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DEFAULT_LOGO_PATH = path.join(__dirname, "..", "assets", "logo.png");

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
  return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

// Purely decorative bar-code look-alike, generated deterministically from
// the card number (no external barcode library / network dependency needed
// for a print element that exists for visual effect — the QR code on the
// back is what actually gets scanned for verification).
function fakeBarcodeBars(seedText) {
  const seed = String(seedText || "0000");
  let bars = "";
  for (let i = 0; i < 34; i++) {
    const code = seed.charCodeAt(i % seed.length) || 48;
    const width = 0.4 + ((code * (i + 3)) % 5) * 0.25; // 0.4mm - 1.65mm
    bars += `<div class="bar" style="width:${width.toFixed(2)}mm"></div>`;
  }
  return bars;
}

// Builds a complete, standalone HTML document showing the front and back
// faces of a PORTRAIT student ID card (54mm x 85.6mm — a CR-80 card turned
// on its side), stacked on one small sheet with a dashed cut guide — ready
// for on-screen preview, browser print, or headless-PDF rendering (see
// generateIdCardPdf.js).
// `idCard` is a plain object (lean/toObject) from the IdCard model.
// `institute` is the merged institute-settings object.
export function buildIdCardHtml(idCard, institute) {
  const logoData = storedRefToDataUrl(institute.logo) || fileToDataUrl(DEFAULT_LOGO_PATH);
  const signatureData = storedRefToDataUrl(institute.AuthorizedSignature);
  const stampData = storedRefToDataUrl(institute.InstituteStamp);
  const photoData = storedRefToDataUrl(idCard.photo);
  const qrData = idCard.qrCode || "";

  const instituteName = escapeHtml(institute.instituteName || "NCA IT Solution");
  const address = escapeHtml(institute.Address || "");
  const phone = escapeHtml(institute.Phone || "");
  const website = escapeHtml((institute.Website || "").replace(/^https?:\/\//, ""));

  const studentName = escapeHtml(idCard.studentName);
  const course = escapeHtml(idCard.course);
  const batch = escapeHtml(idCard.batch || "");
  const admissionNumber = escapeHtml(idCard.admissionNumber || "—");
  const mobile = escapeHtml(idCard.mobile || "—");
  const email = escapeHtml(idCard.email || "—");
  const cardAddress = escapeHtml(idCard.address || "—");
  const emergencyContact = escapeHtml(idCard.emergencyContact || "—");
  const joinDate = formatDate(idCard.issueDate);
  const expiredDate = formatDate(idCard.validUpto);

  const statusClass = (idCard.status || "Active").toLowerCase();
  const barcodeBars = fakeBarcodeBars(idCard.idCardNumber);

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<title>${escapeHtml(idCard.idCardNumber)}</title>
<style>
  @page { size: 62mm 190mm; margin: 0; }
  * { box-sizing: border-box; }
  html, body {
    margin: 0; padding: 0;
    width: 62mm; height: 190mm;
    font-family: 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
    background: #f1f5f9;
  }
  .sheet {
    width: 62mm; height: 190mm;
    display: flex; flex-direction: column; align-items: center;
    padding: 4mm 0;
    gap: 3mm;
  }
  .card {
    position: relative;
    width: 54mm; height: 85.6mm;
    border-radius: 3mm;
    overflow: hidden;
    box-shadow: 0 1px 4px rgba(15, 23, 42, 0.25);
    background: #fff;
  }

  /* ---------- FRONT (portrait) ---------- */
  .card-front { display: flex; flex-direction: column; background: #ffffff; }

  /* Curved wave header, echoing the reference design's blue wave banner. */
  .front-wave {
    position: relative;
    height: 22mm;
    background: linear-gradient(135deg, #1e3a8a 0%, #1d4ed8 55%, #2563eb 100%);
    overflow: hidden;
  }
  .front-wave svg { position: absolute; bottom: -1px; left: 0; width: 100%; height: 10mm; }
  .front-wave-name {
    position: absolute; top: 2mm; left: 0; right: 0; text-align: center;
    color: #fff; font-size: 6.5px; font-weight: 800; letter-spacing: 0.5px;
    text-transform: uppercase;
    display: flex; align-items: center; justify-content: center; gap: 1.2mm;
  }
  .front-wave-name img { width: 4mm; height: 4mm; object-fit: contain; border-radius: 50%; background: #fff; padding: 0.3mm; }
  .front-wave-tagline {
    position: absolute; top: 5mm; left: 0; right: 0; text-align: center;
    color: #dbeafe; font-size: 4.4px; letter-spacing: 0.3px;
  }

  .front-photo {
    width: 20mm; height: 20mm; border-radius: 50%; overflow: hidden;
    border: 0.7mm solid #fff; background: #f1f5f9; flex-shrink: 0;
    margin: -11mm auto 0; box-shadow: 0 1px 5px rgba(15, 23, 42, 0.3);
    position: relative; z-index: 2;
  }
  .front-photo img { width: 100%; height: 100%; object-fit: cover; }
  .front-photo .ph-fallback {
    width: 100%; height: 100%; display: flex; align-items: center; justify-content: center;
    color: #94a3b8; font-size: 5px; text-align: center;
  }

  .front-body { display: flex; flex-direction: column; flex: 1; padding: 2mm 3.5mm 0; }
  .front-name { font-size: 9.5px; font-weight: 800; color: #1e293b; text-align: center; line-height: 1.2; margin-top: 1mm; }
  .front-course { font-size: 6.8px; color: #1d4ed8; font-weight: 700; text-align: center; margin-top: 0.6mm; }
  .front-batch { font-size: 5.4px; color: #64748b; text-align: center; margin-top: 0.3mm; }

  .front-info { display: flex; flex-direction: column; gap: 1.5mm; margin-top: 2.5mm; }
  .front-info .f-row { display: flex; font-size: 6px; color: #475569; gap: 1.5mm; }
  .front-info .f-row b { color: #1e293b; font-weight: 700; min-width: 15mm; flex-shrink: 0; }
  .front-info .f-row span { word-break: break-word; }

  /* Barcode strip on a matching wave-tinted footer band */
  .front-footer {
    margin-top: auto;
    position: relative;
    padding: 3mm 3.5mm 3mm;
    background: linear-gradient(135deg, #eff6ff, #dbeafe);
    border-top: 0.3mm solid #bfdbfe;
  }
  .front-barcode { display: flex; align-items: flex-end; justify-content: center; gap: 0.35mm; height: 6mm; }
  .front-barcode .bar { background: #1e293b; height: 100%; }
  .front-id { display: block; text-align: center; font-size: 5.4px; letter-spacing: 1.5px; color: #334155; font-weight: 700; margin-top: 1mm; }
  .front-status {
    position: absolute; top: 2mm; right: 3mm;
    font-size: 4.6px; font-weight: 800; letter-spacing: 0.3px; padding: 0.6mm 1.8mm;
    border-radius: 3mm; text-transform: uppercase;
  }
  .front-status.active { background: #dcfce7; color: #166534; }
  .front-status.expired { background: #fee2e2; color: #991b1b; }
  .front-status.blocked { background: #fee2e2; color: #991b1b; }

  /* ---------- BACK (portrait) ---------- */
  .card-back {
    display: flex; flex-direction: column;
    padding: 4mm 3.5mm 0;
    background: #ffffff;
  }
  .back-title { font-size: 6.5px; font-weight: 800; color: #1e3a8a; letter-spacing: 0.4px; }
  .back-title-rule { height: 0.4mm; width: 8mm; background: #2563eb; margin-top: 1mm; border-radius: 1mm; }

  .back-terms { font-size: 5px; color: #64748b; line-height: 1.6; margin-top: 2mm; }
  .back-terms ul { margin: 0.5mm 0 0; padding-left: 3mm; }

  .back-dates { display: flex; justify-content: space-between; margin-top: 3mm; }
  .back-dates .bd-item { font-size: 5.6px; color: #1e293b; }
  .back-dates .bd-item b { color: #1d4ed8; font-weight: 800; letter-spacing: 0.3px; }

  .back-sign-row { margin-top: 3.5mm; display: flex; justify-content: flex-end; }
  .back-sign { text-align: center; position: relative; min-width: 20mm; }
  .back-sign img.sign { height: 5.5mm; object-fit: contain; }
  .back-sign img.stamp { position: absolute; height: 11mm; opacity: 0.85; left: -3mm; bottom: 4mm; object-fit: contain; }
  .back-sign .sign-line { font-size: 4.8px; font-weight: 700; color: #1e293b; border-top: 0.3mm solid #334155; padding-top: 0.5mm; margin-top: 0.5mm; }

  /* Curved navy wave footer holding the QR — mirrors the front header */
  .back-wave {
    position: relative;
    margin-top: auto;
    padding: 4mm 3.5mm 3mm;
    background: linear-gradient(135deg, #1e3a8a 0%, #1d4ed8 55%, #2563eb 100%);
    color: #fff;
    display: flex; align-items: center; gap: 2.5mm;
  }
  .back-wave svg { position: absolute; top: -1px; left: 0; width: 100%; height: 6mm; transform: scaleY(-1); }
  .back-wave img.qr { width: 14mm; height: 14mm; flex-shrink: 0; background: #fff; border-radius: 1mm; padding: 0.6mm; position: relative; z-index: 1; }
  .back-wave-text { font-size: 4.6px; line-height: 1.55; position: relative; z-index: 1; }
  .back-wave-text strong { display: block; font-size: 5.6px; font-weight: 800; }

  .cut-guide {
    width: 54mm; text-align: center; font-size: 5px; color: #94a3b8;
    border-top: 0.3mm dashed #cbd5e1; padding-top: 1mm;
  }
</style>
</head>
<body>
  <div class="sheet">
    <div class="card card-front">
      <div class="front-wave">
        <div class="front-wave-name">${logoData ? `<img src="${logoData}" alt="logo" />` : ""}<span>${instituteName}</span></div>
        <div class="front-wave-tagline">Student Identity Card</div>
        <svg viewBox="0 0 216 40" preserveAspectRatio="none">
          <path d="M0,20 C54,45 162,-5 216,20 L216,40 L0,40 Z" fill="#ffffff"></path>
        </svg>
      </div>

      <div class="front-photo">
        ${photoData ? `<img src="${photoData}" alt="photo" />` : `<div class="ph-fallback">No Photo</div>`}
      </div>

      <div class="front-body">
        <div class="front-name">${studentName}</div>
        <div class="front-course">${course}</div>
        ${batch ? `<div class="front-batch">Batch ${batch}</div>` : ""}

        <div class="front-info">
          <div class="f-row"><b>ID No:</b> <span>${escapeHtml(idCard.idCardNumber)}</span></div>
          <div class="f-row"><b>Adm. No:</b> <span>${admissionNumber}</span></div>
          <div class="f-row"><b>Email:</b> <span>${email}</span></div>
          <div class="f-row"><b>Phone:</b> <span>${mobile}</span></div>
        </div>
      </div>

      <div class="front-footer">
        <span class="front-status ${statusClass}">${escapeHtml(idCard.status || "Active")}</span>
        <div class="front-barcode">${barcodeBars}</div>
        <span class="front-id">${escapeHtml(idCard.idCardNumber)}</span>
      </div>
    </div>

    <div class="card card-back">
      <div class="back-title">${instituteName}</div>
      <div class="back-title-rule"></div>

      <div class="back-terms">
        <strong style="font-size:5.6px;color:#1e293b;">Terms &amp; Conditions</strong>
        <ul>
          <li>This card is the property of ${instituteName} and must be carried at all times on campus.</li>
          <li>Non-transferable. Report loss or theft immediately.</li>
          <li>Must be surrendered upon completion, withdrawal, or on request.</li>
        </ul>
        ${cardAddress !== "—" ? `<div style="margin-top:2mm;"><b style="color:#1e293b;">Address:</b> ${cardAddress}</div>` : ""}
        ${emergencyContact !== "—" ? `<div style="margin-top:1mm;"><b style="color:#1e293b;">Emergency Contact:</b> ${emergencyContact}</div>` : ""}
      </div>

      <div class="back-dates">
        <div class="bd-item"><b>JOIN:</b> ${joinDate}</div>
        <div class="bd-item"><b>EXPIRED:</b> ${expiredDate}</div>
      </div>

      <div class="back-sign-row">
        <div class="back-sign">
          ${stampData ? `<img class="stamp" src="${stampData}" alt="stamp" />` : ""}
          ${signatureData ? `<img class="sign" src="${signatureData}" alt="signature" />` : ""}
          <div class="sign-line">${signatureData ? "Authorized Signatory" : "Your Signature Here"}</div>
        </div>
      </div>

      <div class="back-wave">
        <svg viewBox="0 0 216 24" preserveAspectRatio="none">
          <path d="M0,12 C54,-12 162,36 216,12 L216,24 L0,24 Z" fill="#ffffff"></path>
        </svg>
        ${qrData ? `<img class="qr" src="${qrData}" alt="QR Code" />` : ""}
        <div class="back-wave-text">
          <strong>Scan to verify</strong>
          ${address ? `${address}<br/>` : ""}
          ${phone ? `Ph: ${phone}` : ""}${website ? ` &middot; ${website}` : ""}
        </div>
      </div>
    </div>

    <div class="cut-guide">✂ Cut along the card edges</div>
  </div>
</body>
</html>`;
}
