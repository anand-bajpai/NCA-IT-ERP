import PDFDocument from "pdfkit";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { getInstituteInfo } from "./instituteSettingsCache.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DEFAULT_LOGO_PATH = path.join(__dirname, "..", "assets", "logo.png");
const UPLOADS_ROOT = path.resolve("uploads");

// Builds the header-info object drawReceipt() needs, pulling live values
// from Institute Settings (Admin Dashboard → Institute Settings) and
// falling back to the original hardcoded defaults for anything not yet
// filled in by the Super Admin — so existing receipts never break.
async function resolveInstituteInfo() {
  const settings = await getInstituteInfo();

  let logoPath = DEFAULT_LOGO_PATH;
  if (settings.logo) {
    const candidate = path.join(UPLOADS_ROOT, settings.logo.replace(/^\/?uploads\//, ""));
    if (fs.existsSync(candidate)) logoPath = candidate;
  }

  return {
    name: settings.instituteName || "NCA IT Solution",
    tagline: "Web Development & App Development Training",
    address: settings.Address || "",
    phone: settings.Phone || "",
    email: settings.Email || "",
    gstNumber: settings.GSTNumber || "",
    website: settings.Website || "",
    logoPath,
  };
}

const rupee = (n) =>
  `Rs. ${Number(n || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const formatDate = (d) =>
  new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" });

function drawReceipt(doc, receipt, institute) {
  // --- Header: logo + institute info ---
  const headerTop = doc.y;
  if (fs.existsSync(institute.logoPath)) {
    try {
      doc.image(institute.logoPath, 50, headerTop, { width: 55, height: 55, fit: [55, 55] });
    } catch {
      // if the image can't be embedded for any reason, skip it silently
    }
  }

  doc
    .fillColor("#2563eb")
    .fontSize(19)
    .font("Helvetica-Bold")
    .text(institute.name, 115, headerTop, { width: 430 });

  doc
    .fillColor("#475569")
    .fontSize(9.5)
    .font("Helvetica")
    .text(institute.tagline, 115, headerTop + 22, { width: 430 });

  doc
    .fontSize(8.5)
    .fillColor("#64748b")
    .text(institute.address, 115, headerTop + 36, { width: 430 });

  const contactBits = [`Phone: ${institute.phone}`, `Email: ${institute.email}`].filter((b) => !b.endsWith(": "));
  if (institute.website) contactBits.push(`Web: ${institute.website}`);
  doc.text(contactBits.join("   |   "), 115, doc.y);

  if (institute.gstNumber) {
    doc.text(`GSTIN: ${institute.gstNumber}`, 115, doc.y);
  }

  doc.y = headerTop + 70;

  doc
    .strokeColor("#2563eb")
    .lineWidth(1.5)
    .moveTo(50, doc.y)
    .lineTo(545, doc.y)
    .stroke();

  doc.moveDown(0.7);
  doc
    .fillColor("#0f172a")
    .fontSize(15)
    .font("Helvetica-Bold")
    .text("FEE RECEIPT", { align: "center" });

  doc.moveDown(0.6);

  // --- Receipt meta row ---
  const metaTop = doc.y;
  doc
    .fontSize(10)
    .font("Helvetica-Bold")
    .fillColor("#0f172a")
    .text(`Receipt No: `, 50, metaTop, { continued: true })
    .font("Helvetica")
    .text(receipt.receiptNumber);

  doc
    .font("Helvetica-Bold")
    .text(`Date: `, 400, metaTop, { continued: true })
    .font("Helvetica")
    .text(formatDate(receipt.paymentDate));

  doc.moveDown(0.9);

  // --- Student details box ---
  const boxTop = doc.y;
  const boxHeight = 110;
  doc.roundedRect(50, boxTop, 495, boxHeight, 6).fillAndStroke("#f8fafc", "#e2e8f0");

  const rowX1 = 65;
  const rowX2 = 310;
  let rowY = boxTop + 12;
  const line = (label, value, x) => {
    doc.fillColor("#64748b").fontSize(8.5).font("Helvetica").text(label, x, rowY);
    doc.fillColor("#0f172a").fontSize(10.5).font("Helvetica-Bold").text(value || "-", x, rowY + 12);
  };

  line("Student Name", receipt.studentName, rowX1);
  line("Father's Name", receipt.fatherName, rowX2);
  rowY += 32;
  line("Course", receipt.course, rowX1);
  line("Batch", receipt.batch, rowX2);
  rowY += 32;
  line("Admission Number", receipt.admissionNumber, rowX1);
  line("Mobile Number", receipt.mobile, rowX2);
  rowY += 32;
  line("Payment Mode", receipt.paymentMode, rowX1);
  line("Transaction ID", receipt.transactionId, rowX2);

  doc.y = boxTop + boxHeight + 18;

  // --- Fee breakdown table ---
  const zeroStr = rupee(0);
  const rows = [
    ["Course Fee", rupee(receipt.courseFee)],
    ["Registration Fee", rupee(receipt.registrationFee)],
    ["Study Material Fee", rupee(receipt.studyMaterialFee)],
    ["Other Charges", rupee(receipt.otherCharges)],
    ["Discount", `- ${rupee(receipt.discount)}`],
  ].filter(([label, v]) => label === "Course Fee" || v !== zeroStr);

  let y = doc.y;
  doc.fontSize(10);
  rows.forEach(([label, value]) => {
    doc
      .fillColor("#334155")
      .font("Helvetica")
      .text(label, 65, y)
      .text(value, 350, y, { width: 195, align: "right" });
    y += 19;
  });

  doc.strokeColor("#e2e8f0").moveTo(65, y + 2).lineTo(545, y + 2).stroke();
  y += 12;

  doc
    .fillColor("#334155")
    .font("Helvetica-Bold")
    .text("Subtotal", 65, y)
    .text(rupee(receipt.subtotal), 350, y, { width: 195, align: "right" });
  y += 19;

  if (receipt.cgstAmount > 0) {
    doc
      .font("Helvetica")
      .text(`CGST (${receipt.cgstPercent}%)`, 65, y)
      .text(rupee(receipt.cgstAmount), 350, y, { width: 195, align: "right" });
    y += 19;
  }
  if (receipt.sgstAmount > 0) {
    doc
      .font("Helvetica")
      .text(`SGST (${receipt.sgstPercent}%)`, 65, y)
      .text(rupee(receipt.sgstAmount), 350, y, { width: 195, align: "right" });
    y += 19;
  }

  y += 4;
  doc.roundedRect(50, y, 495, 30, 4).fill("#2563eb");
  doc
    .fillColor("#ffffff")
    .fontSize(12)
    .font("Helvetica-Bold")
    .text("Grand Total", 65, y + 9)
    .text(rupee(receipt.grandTotal), 350, y + 9, { width: 195, align: "right" });
  y += 42;

  doc
    .fillColor("#64748b")
    .fontSize(9)
    .font("Helvetica-Oblique")
    .text(`Amount in Words: ${receipt.amountInWords}`, 65, y, { width: 480 });
  y = doc.y + 12;

  // --- Payment status ---
  doc.fontSize(10);
  const statusRows = [
    ["Previously Paid", rupee(receipt.previouslyPaid)],
    ["Amount Paid (this receipt)", rupee(receipt.amountPaid)],
    ["Balance Due", rupee(receipt.balanceDue)],
  ];
  statusRows.forEach(([label, value], i) => {
    const isLast = i === statusRows.length - 1;
    doc
      .fillColor(isLast && receipt.balanceDue > 0 ? "#b91c1c" : "#334155")
      .font(isLast ? "Helvetica-Bold" : "Helvetica")
      .text(label, 65, y)
      .text(value, 350, y, { width: 195, align: "right" });
    y += 18;
  });

  doc.y = y + 10;

  if (receipt.remarks) {
    doc
      .fillColor("#64748b")
      .fontSize(9)
      .font("Helvetica-Bold")
      .text("Remarks: ", 65, doc.y, { continued: true })
      .font("Helvetica")
      .text(receipt.remarks);
    doc.moveDown(0.5);
  }

  // --- Footer / signature ---
  const footerY = Math.max(doc.y + 30, 700);
  doc
    .fontSize(8.5)
    .fillColor("#94a3b8")
    .text("This is a computer-generated receipt.", 50, footerY);

  doc
    .strokeColor("#94a3b8")
    .moveTo(400, footerY - 4)
    .lineTo(545, footerY - 4)
    .stroke();
  doc
    .fontSize(9.5)
    .fillColor("#0f172a")
    .font("Helvetica-Bold")
    .text("Authorized Signatory", 400, footerY, { width: 145, align: "center" });
}

// Streams a fee receipt PDF straight to an HTTP response (for admin download).
export async function streamFeeReceiptPdf(receipt, res) {
  const institute = await resolveInstituteInfo();
  const doc = new PDFDocument({ size: "A4", margin: 50 });

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="${receipt.receiptNumber}.pdf"`);

  doc.pipe(res);
  drawReceipt(doc, receipt, institute);
  doc.end();
}

// Builds a fee receipt PDF as a Buffer (for emailing as an attachment).
export async function buildFeeReceiptPdfBuffer(receipt) {
  const institute = await resolveInstituteInfo();
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margin: 50 });
    const chunks = [];

    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    drawReceipt(doc, receipt, institute);
    doc.end();
  });
}
