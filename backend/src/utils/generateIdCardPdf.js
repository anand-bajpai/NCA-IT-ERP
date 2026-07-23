import fs from "fs";
import path from "path";
import puppeteer from "puppeteer";

// PDFs are stored OUTSIDE the statically-served /uploads root on purpose —
// mirrors the Certificate module's private/certificates convention, so a
// generated card can only be reached through the controlled download route.
const PDF_DIR = path.resolve("private", "idcards");
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

// Renders the ID card HTML (front + back, portrait CR-80-on-its-side size —
// 54mm x 85.6mm each) to a PDF Buffer. Page size fits 2 stacked portrait
// cards + the cut guide on one small sheet ready to print & trim.
export async function renderIdCardPdfBuffer(html) {
  const browser = await getBrowser();
  const page = await browser.newPage();
  try {
    await page.setContent(html, { waitUntil: "networkidle0" });
    const pdfBuffer = await page.pdf({
      width: "62mm",
      height: "190mm",
      printBackground: true,
      margin: { top: 0, bottom: 0, left: 0, right: 0 },
    });
    return pdfBuffer;
  } finally {
    await page.close();
  }
}

export function pdfPathForIdCard(idCardNumber) {
  const safeName = idCardNumber.replace(/[^a-zA-Z0-9-_]/g, "_");
  return path.join(PDF_DIR, `${safeName}.pdf`);
}

export async function saveIdCardPdf(idCardNumber, html) {
  const buffer = await renderIdCardPdfBuffer(html);
  const filePath = pdfPathForIdCard(idCardNumber);
  fs.writeFileSync(filePath, buffer);
  return filePath;
}

export function idCardPdfExists(filePath) {
  return !!filePath && fs.existsSync(filePath);
}
