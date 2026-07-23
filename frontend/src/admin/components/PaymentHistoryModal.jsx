import { useState, useEffect } from "react";
import { FaEye, FaFilePdf, FaEnvelope } from "react-icons/fa";
import Modal from "../../components/Modal/Modal";
import adminApi from "../api/adminApi";
import "./PaymentHistoryModal.css";

const inr = (n) => `Rs. ${Number(n || 0).toLocaleString("en-IN")}`;

const formatDate = (d) =>
  d ? new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—";

// Shows every fee receipt ever issued to a student as a timeline, using the
// dedicated /fee-receipts/history/:studentId endpoint. Reuses the same
// preview/download/email actions already wired up on the main table.
const PaymentHistoryModal = ({ isOpen, onClose, student, onPreview, onDownload, onEmail, busyId }) => {
  const [receipts, setReceipts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isOpen || !student) return;

    let cancelled = false;
    setLoading(true);
    setError("");
    setReceipts([]);

    adminApi
      .get(`/fee-receipts/history/${student.id}`)
      .then((res) => {
        if (!cancelled) setReceipts(res.data.data);
      })
      .catch((err) => {
        if (!cancelled) setError(err.response?.data?.message || "Could not load payment history.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isOpen, student]);

  if (!isOpen || !student) return null;

  const totalPaid = receipts.reduce((sum, r) => sum + Number(r.amountPaid || 0), 0);
  const outstanding = receipts.length ? Number(receipts[0].balanceDue || 0) : 0;

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="payment-history">
        <div className="payment-history-header">
          <h3>Payment History</h3>
          <p>{student.name}</p>
        </div>

        {loading && <p className="payment-history-status">Loading history...</p>}
        {error && <p className="payment-history-status error">{error}</p>}

        {!loading && !error && (
          <>
            <div className="payment-history-stats">
              <div>
                <span>Receipts Issued</span>
                <strong>{receipts.length}</strong>
              </div>
              <div>
                <span>Total Paid</span>
                <strong className="positive">{inr(totalPaid)}</strong>
              </div>
              <div>
                <span>Current Balance</span>
                <strong className={outstanding > 0 ? "negative" : "positive"}>{inr(outstanding)}</strong>
              </div>
            </div>

            {receipts.length === 0 ? (
              <p className="payment-history-empty">No fee receipts found for this student.</p>
            ) : (
              <ol className="payment-history-timeline">
                {receipts.map((r) => (
                  <li key={r._id} className={r.balanceDue > 0 ? "due" : "clear"}>
                    <div className="payment-history-dot" />
                    <div className="payment-history-content">
                      <div className="payment-history-row-top">
                        <span className="mono">{r.receiptNumber}</span>
                        <span className="payment-history-date">{formatDate(r.paymentDate)}</span>
                      </div>
                      <div className="payment-history-row-mid">
                        <span>Paid {inr(r.amountPaid)} of {inr(r.grandTotal)}</span>
                        {r.balanceDue > 0 ? (
                          <span className="badge due">Balance {inr(r.balanceDue)}</span>
                        ) : (
                          <span className="badge clear">Fully Paid</span>
                        )}
                      </div>
                      <div className="payment-history-actions">
                        <button onClick={() => onPreview(r)} title="Preview / Print"><FaEye /> View</button>
                        <button onClick={() => onDownload(r)} title="Download PDF" disabled={busyId === r._id}><FaFilePdf /> PDF</button>
                        <button onClick={() => onEmail(r)} title="Email Receipt" disabled={busyId === r._id}><FaEnvelope /> Email</button>
                      </div>
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </>
        )}
      </div>
    </Modal>
  );
};

export default PaymentHistoryModal;
