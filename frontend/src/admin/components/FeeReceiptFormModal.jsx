import { useState, useEffect, useRef } from "react";
import { FaCheckCircle, FaExclamationTriangle, FaSpinner, FaTimes } from "react-icons/fa";
import Modal from "../../components/Modal/Modal";
import adminApi from "../api/adminApi";
import "./FeeReceiptFormModal.css";

const emptyForm = {
  student: "",
  studentName: "",
  fatherName: "",
  mobile: "",
  studentEmail: "",
  admissionNumber: "",
  course: "",
  batch: "",
  paymentMode: "Cash",
  transactionId: "",
  paymentDate: new Date().toISOString().slice(0, 10),
  courseFee: "",
  registrationFee: "0",
  studyMaterialFee: "0",
  otherCharges: "0",
  discount: "0",
  cgstPercent: "0",
  sgstPercent: "0",
  previouslyPaid: "0",
  amountPaid: "",
  remarks: "",
};

const num = (v) => Number(v) || 0;

const FeeReceiptFormModal = ({ isOpen, onClose, onSaved, receipt }) => {
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  // Admission-number lookup: "idle" | "loading" | "found" | "not-found" | "error"
  const [lookupStatus, setLookupStatus] = useState("idle");
  const lookupTimer = useRef(null);

  useEffect(() => {
    if (receipt) {
      setForm({
        ...emptyForm,
        ...receipt,
        student: receipt.student || "",
        courseFee: String(receipt.courseFee ?? ""),
        registrationFee: String(receipt.registrationFee ?? "0"),
        studyMaterialFee: String(receipt.studyMaterialFee ?? "0"),
        otherCharges: String(receipt.otherCharges ?? "0"),
        discount: String(receipt.discount ?? "0"),
        cgstPercent: String(receipt.cgstPercent ?? "0"),
        sgstPercent: String(receipt.sgstPercent ?? "0"),
        previouslyPaid: String(receipt.previouslyPaid ?? "0"),
        amountPaid: String(receipt.amountPaid ?? ""),
        paymentDate: receipt.paymentDate ? receipt.paymentDate.slice(0, 10) : "",
      });
      setLookupStatus(receipt.student ? "found" : "idle");
    } else {
      setForm(emptyForm);
      setLookupStatus("idle");
    }
    setError("");
  }, [receipt, isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  // Admin types the Admission Number; once it looks complete enough we
  // auto-fetch the student record and fill Name / Father's Name / Course /
  // Mobile / Email automatically — those fields become read-only below.
  const handleAdmissionNumberChange = (value) => {
    setForm((f) => ({ ...f, admissionNumber: value }));
    setLookupStatus("idle");

    if (lookupTimer.current) clearTimeout(lookupTimer.current);
    if (!value.trim() || value.trim().length < 3) return;

    lookupTimer.current = setTimeout(() => lookupByAdmissionNumber(value.trim()), 450);
  };

  const lookupByAdmissionNumber = async (admissionNumber) => {
    setLookupStatus("loading");
    try {
      const res = await adminApi.get(`/students/by-admission/${encodeURIComponent(admissionNumber)}`);
      const s = res.data.data;
      setForm((f) => ({
        ...f,
        student: s._id,
        studentName: s.fullName,
        fatherName: s.fatherName || "",
        mobile: s.mobile || "",
        studentEmail: s.email || "",
        admissionNumber: s.admissionNumber || admissionNumber,
        course: s.course || "",
        batch: s.batch || "",
      }));
      setLookupStatus("found");
    } catch (err) {
      setLookupStatus(err.response?.status === 404 ? "not-found" : "error");
    }
  };

  // Unlink the fetched student so the admin can enter a different admission number.
  const clearLookup = () => {
    setForm((f) => ({
      ...f,
      student: "",
      studentName: "",
      fatherName: "",
      mobile: "",
      studentEmail: "",
      admissionNumber: "",
      course: "",
      batch: "",
    }));
    setLookupStatus("idle");
  };

  const autoFilled = lookupStatus === "found";

  // --- Live calculation preview (mirrors backend logic) ---
  const subtotal = Math.max(
    0,
    num(form.courseFee) + num(form.registrationFee) + num(form.studyMaterialFee) + num(form.otherCharges) - num(form.discount)
  );
  const cgstAmount = (subtotal * num(form.cgstPercent)) / 100;
  const sgstAmount = (subtotal * num(form.sgstPercent)) / 100;
  const grandTotal = subtotal + cgstAmount + sgstAmount;
  const balanceDue = Math.max(0, grandTotal - num(form.previouslyPaid) - num(form.amountPaid));

  const inr = (n) => `Rs. ${n.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      const payload = { ...form };
      if (!payload.student) delete payload.student;

      if (receipt) {
        await adminApi.put(`/fee-receipts/${receipt._id}`, payload);
      } else {
        await adminApi.post("/fee-receipts", payload);
      }

      onSaved();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || "Could not save fee receipt.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <form className="receipt-form" onSubmit={handleSubmit}>
        <h3>{receipt ? "Edit Fee Receipt" : "New Fee Receipt"}</h3>

        <div className="receipt-form-section-title">Student Details</div>
        <div className="receipt-form-grid">
          <div className="admission-lookup-field">
            <label className="field-label">
              Admission Number *
              <div className="admission-input-row">
                <input
                  placeholder="Enter admission number..."
                  value={form.admissionNumber}
                  onChange={(e) => handleAdmissionNumberChange(e.target.value)}
                  disabled={autoFilled}
                  required
                />
                {autoFilled && (
                  <button type="button" className="lookup-clear-btn" onClick={clearLookup} title="Change admission number">
                    <FaTimes />
                  </button>
                )}
              </div>
            </label>

            {lookupStatus === "loading" && (
              <span className="lookup-status loading"><FaSpinner className="spin" /> Looking up student...</span>
            )}
            {lookupStatus === "found" && (
              <span className="lookup-status found"><FaCheckCircle /> Student details fetched automatically</span>
            )}
            {lookupStatus === "not-found" && (
              <span className="lookup-status not-found"><FaExclamationTriangle /> No student found with this admission number.</span>
            )}
            {lookupStatus === "error" && (
              <span className="lookup-status not-found"><FaExclamationTriangle /> Could not look up this admission number. Try again.</span>
            )}
          </div>

          <label className="field-label">
            Student Name *
            <input
              name="studentName"
              value={form.studentName}
              onChange={handleChange}
              readOnly={autoFilled}
              placeholder={autoFilled ? "" : "Auto-fills once admission number is found"}
              required
            />
          </label>
          <label className="field-label">
            Father's Name
            <input
              name="fatherName"
              value={form.fatherName}
              onChange={handleChange}
              readOnly={autoFilled}
              placeholder={autoFilled ? "" : "Auto-fills once admission number is found"}
            />
          </label>
          <label className="field-label">
            Mobile Number
            <input
              name="mobile"
              value={form.mobile}
              onChange={handleChange}
              readOnly={autoFilled}
              placeholder={autoFilled ? "" : "Auto-fills once admission number is found"}
            />
          </label>
          <label className="field-label">
            Student Email
            <input
              name="studentEmail"
              type="email"
              value={form.studentEmail}
              onChange={handleChange}
              readOnly={autoFilled}
              placeholder={autoFilled ? "" : "Auto-fills once admission number is found"}
            />
          </label>
          <label className="field-label">
            Course *
            <input
              name="course"
              value={form.course}
              onChange={handleChange}
              readOnly={autoFilled}
              placeholder={autoFilled ? "" : "Auto-fills once admission number is found"}
              required
            />
          </label>
          <label className="field-label">
            Batch
            <input
              name="batch"
              value={form.batch}
              onChange={handleChange}
              readOnly={autoFilled}
              placeholder={autoFilled ? "" : "Auto-fills once admission number is found"}
            />
          </label>
        </div>
        {!autoFilled && (
          <p className="lookup-hint">
            These fields fill in automatically once a matching admission number is found above. You can still edit them manually for a legacy record that isn't linked to a student.
          </p>
        )}

        <div className="receipt-form-section-title">Payment Details</div>
        <div className="receipt-form-grid">
          <label className="field-label">
            Payment Date
            <input name="paymentDate" type="date" value={form.paymentDate} onChange={handleChange} />
          </label>

          <select name="paymentMode" value={form.paymentMode} onChange={handleChange}>
            <option>Cash</option>
            <option>UPI</option>
            <option>Bank Transfer</option>
            <option>Card</option>
            <option>Cheque</option>
            <option>Online</option>
          </select>

          <input name="transactionId" placeholder="Transaction ID (if online)" value={form.transactionId} onChange={handleChange} />
        </div>

        <div className="receipt-form-section-title">Fee Breakdown</div>
        <div className="receipt-form-grid">
          <label className="field-label">
            Course Fee (Rs.) *
            <input name="courseFee" type="number" min="0" step="0.01" value={form.courseFee} onChange={handleChange} required />
          </label>
          <label className="field-label">
            Registration Fee (Rs.)
            <input name="registrationFee" type="number" min="0" step="0.01" value={form.registrationFee} onChange={handleChange} />
          </label>
          <label className="field-label">
            Study Material Fee (Rs.)
            <input name="studyMaterialFee" type="number" min="0" step="0.01" value={form.studyMaterialFee} onChange={handleChange} />
          </label>
          <label className="field-label">
            Other Charges (Rs.)
            <input name="otherCharges" type="number" min="0" step="0.01" value={form.otherCharges} onChange={handleChange} />
          </label>
          <label className="field-label">
            Discount (Rs.)
            <input name="discount" type="number" min="0" step="0.01" value={form.discount} onChange={handleChange} />
          </label>
          <label className="field-label">
            CGST (%)
            <input name="cgstPercent" type="number" min="0" max="100" step="0.01" value={form.cgstPercent} onChange={handleChange} />
          </label>
          <label className="field-label">
            SGST (%)
            <input name="sgstPercent" type="number" min="0" max="100" step="0.01" value={form.sgstPercent} onChange={handleChange} />
          </label>
        </div>

        <div className="receipt-form-section-title">Payment Status</div>
        <div className="receipt-form-grid">
          <label className="field-label">
            Previously Paid (Rs.)
            <input name="previouslyPaid" type="number" min="0" step="0.01" value={form.previouslyPaid} onChange={handleChange} />
          </label>
          <label className="field-label">
            Amount Paid Now (Rs.) *
            <input name="amountPaid" type="number" min="0" step="0.01" value={form.amountPaid} onChange={handleChange} required />
          </label>
        </div>

        <div className="calc-summary">
          <div><span>Subtotal</span><strong>{inr(subtotal)}</strong></div>
          {cgstAmount > 0 && <div><span>CGST ({form.cgstPercent}%)</span><strong>{inr(cgstAmount)}</strong></div>}
          {sgstAmount > 0 && <div><span>SGST ({form.sgstPercent}%)</span><strong>{inr(sgstAmount)}</strong></div>}
          <div className="grand"><span>Grand Total</span><strong>{inr(grandTotal)}</strong></div>
          <div className="balance"><span>Balance Due</span><strong>{inr(balanceDue)}</strong></div>
        </div>

        <textarea name="remarks" placeholder="Remarks (optional)" rows="2" value={form.remarks} onChange={handleChange}></textarea>

        {error && <p className="form-status error">{error}</p>}

        <button type="submit" disabled={saving}>
          {saving ? "Saving..." : receipt ? "Update Receipt" : "Save & Generate Receipt"}
        </button>
      </form>
    </Modal>
  );
};

export default FeeReceiptFormModal;
