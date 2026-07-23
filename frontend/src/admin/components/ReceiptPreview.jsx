import "./ReceiptPreview.css";

const inr = (n) =>
  `Rs. ${Number(n || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const formatDate = (d) =>
  d ? new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" }) : "-";

// A print-friendly on-screen preview of a fee receipt. Uses a scoped
// print stylesheet (see ReceiptPreview.css) so only the receipt itself
// is sent to the printer, not the rest of the admin panel.
const ReceiptPreview = ({ receipt, onClose }) => {
  if (!receipt) return null;

  const handlePrint = () => window.print();

  return (
    <div className="receipt-preview-overlay" onClick={onClose}>
      <div className="receipt-preview-shell" onClick={(e) => e.stopPropagation()}>
        <div className="receipt-preview-toolbar no-print">
          <button onClick={handlePrint} className="print-btn">Print</button>
          <button onClick={onClose} className="close-btn">Close</button>
        </div>

        <div id="printable-receipt" className="receipt-sheet">
          <div className="receipt-sheet-header">
            <h2>NCA IT Solution</h2>
            <p>Web Development & App Development Training</p>
            <p className="small">
              Iconic Corenthum Tower, Floor 7, Office No-705A, Near Electronic City Metro Station, Sector 62, Noida, Uttar Pradesh 201309
            </p>
            <p className="small">Phone: +91 8287584509 | Email: ncaitsolutionnoida@gmail.com</p>
          </div>

          <h3 className="receipt-title">FEE RECEIPT</h3>

          <div className="receipt-meta">
            <span><strong>Receipt No:</strong> {receipt.receiptNumber}</span>
            <span><strong>Date:</strong> {formatDate(receipt.paymentDate)}</span>
          </div>

          <div className="receipt-info-grid">
            <div><span className="label">Student Name</span><span className="value">{receipt.studentName || "-"}</span></div>
            <div><span className="label">Father's Name</span><span className="value">{receipt.fatherName || "-"}</span></div>
            <div><span className="label">Course</span><span className="value">{receipt.course || "-"}</span></div>
            <div><span className="label">Batch</span><span className="value">{receipt.batch || "-"}</span></div>
            <div><span className="label">Admission Number</span><span className="value">{receipt.admissionNumber || "-"}</span></div>
            <div><span className="label">Mobile Number</span><span className="value">{receipt.mobile || "-"}</span></div>
            <div><span className="label">Payment Mode</span><span className="value">{receipt.paymentMode || "-"}</span></div>
            <div><span className="label">Transaction ID</span><span className="value">{receipt.transactionId || "-"}</span></div>
          </div>

          <table className="receipt-fee-table">
            <tbody>
              <tr><td>Course Fee</td><td>{inr(receipt.courseFee)}</td></tr>
              {receipt.registrationFee > 0 && <tr><td>Registration Fee</td><td>{inr(receipt.registrationFee)}</td></tr>}
              {receipt.studyMaterialFee > 0 && <tr><td>Study Material Fee</td><td>{inr(receipt.studyMaterialFee)}</td></tr>}
              {receipt.otherCharges > 0 && <tr><td>Other Charges</td><td>{inr(receipt.otherCharges)}</td></tr>}
              {receipt.discount > 0 && <tr><td>Discount</td><td>- {inr(receipt.discount)}</td></tr>}
              <tr className="subtotal-row"><td>Subtotal</td><td>{inr(receipt.subtotal)}</td></tr>
              {receipt.cgstAmount > 0 && <tr><td>CGST ({receipt.cgstPercent}%)</td><td>{inr(receipt.cgstAmount)}</td></tr>}
              {receipt.sgstAmount > 0 && <tr><td>SGST ({receipt.sgstPercent}%)</td><td>{inr(receipt.sgstAmount)}</td></tr>}
            </tbody>
          </table>

          <div className="grand-total-row">
            <span>Grand Total</span>
            <span>{inr(receipt.grandTotal)}</span>
          </div>

          <p className="amount-words">Amount in Words: {receipt.amountInWords}</p>

          <table className="receipt-fee-table payment-status">
            <tbody>
              <tr><td>Previously Paid</td><td>{inr(receipt.previouslyPaid)}</td></tr>
              <tr><td>Amount Paid (this receipt)</td><td>{inr(receipt.amountPaid)}</td></tr>
              <tr className="balance-row"><td>Balance Due</td><td>{inr(receipt.balanceDue)}</td></tr>
            </tbody>
          </table>

          {receipt.remarks && <p className="remarks">Remarks: {receipt.remarks}</p>}

          <div className="receipt-footer">
            <span className="small">This is a computer-generated receipt.</span>
            <span className="signature">Authorized Signatory</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReceiptPreview;
