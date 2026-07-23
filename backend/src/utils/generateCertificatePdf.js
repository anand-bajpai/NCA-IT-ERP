import fs from "fs";
import path from "path";
import puppeteer from "puppeteer";

// PDFs are stored OUTSIDE the statically-served /uploads root on purpose —
// see Certificate.pdfPath in the model. This directory must never be passed
// to express.static(); the only way to reach a file in here is through the
// controller download routes, which check the certificate's status first.
const PDF_DIR = path.resolve("private", "certificates");
fs.mkdirSync(PDF_DIR, { recursive: true });

let browserPromise = null;
function getBrowser() {
  if (!browserPromise) {
    browserPromise = puppeteer
      .launch({
        headless: true,
        args: ["--no-sandbox", "--disable-setuid-sandbox"],
      })
      .catch((err) => {
        browserPromise = null; // allow retry on next call
        throw err;
      });
  }
  return browserPromise;
}

// Renders a certificate HTML string to a PDF Buffer (A4 landscape, print backgrounds on).
export async function renderCertificatePdfBuffer(html) {
  const browser = await getBrowser();
  const page = await browser.newPage();
  try {
    await page.setContent(html, { waitUntil: "networkidle0" });
    const pdfBuffer = await page.pdf({
      format: "A4",
      landscape: true,
      printBackground: true,
      margin: { top: 0, bottom: 0, left: 0, right: 0 },
    });
    return pdfBuffer;
  } finally {
    await page.close();
  }
}

export function pdfPathForCertificate(certificateNumber) {
  const safeName = certificateNumber.replace(/[^a-zA-Z0-9-_]/g, "_");
  return path.join(PDF_DIR, `${safeName}.pdf`);
}

// Renders + writes the PDF to the private store, returning the absolute path.
export async function saveCertificatePdf(certificateNumber, html) {
  const buffer = await renderCertificatePdfBuffer(html);
  const filePath = pdfPathForCertificate(certificateNumber);
  fs.writeFileSync(filePath, buffer);
  return filePath;
}

export function certificatePdfExists(filePath) {
  return !!filePath && fs.existsSync(filePath);
}
