import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Modal from "../../components/Modal/Modal";
import adminApi from "../api/adminApi";
import "./EnquiryConvertModal.css";

const EnquiryConvertModal = ({ isOpen, onClose, onConverted, enquiry }) => {
  const [form, setForm] = useState({
    mobile: "",
    course: "",
    batch: "",
    fatherName: "",
    motherName: "",
    address: "",
    joiningDate: "",
  });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (enquiry) {
      setForm((f) => ({
        ...f,
        mobile: enquiry.phone || "",
        course: enquiry.course || "",
        joiningDate: new Date().toISOString().slice(0, 10),
      }));
      setError("");
    }
  }, [enquiry, isOpen]);

  if (!enquiry) return null;

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      await adminApi.post(`/enquiries/${enquiry._id}/convert`, form);
      onConverted();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || "Could not convert this enquiry into an admission.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <form className="convert-form" onSubmit={handleSubmit}>
        <h3>Convert to Admission — {enquiry.fullName}</h3>
        <p className="convert-hint">
          This creates a new Admission (Student) record from this enquiry. You can adjust the
          details below before confirming.
        </p>

        <div className="convert-form-grid">
          <input name="mobile" placeholder="Mobile Number *" value={form.mobile} onChange={handleChange} required />
          <input name="course" placeholder="Course *" value={form.course} onChange={handleChange} required />
          <input name="batch" placeholder="Batch" value={form.batch} onChange={handleChange} />
          <input name="fatherName" placeholder="Father's Name" value={form.fatherName} onChange={handleChange} />
          <input name="motherName" placeholder="Mother's Name" value={form.motherName} onChange={handleChange} />
          <label className="field-label">
            Joining Date
            <input name="joiningDate" type="date" value={form.joiningDate} onChange={handleChange} />
          </label>
        </div>

        <label className="field-label">
          Address
          <textarea name="address" rows={2} value={form.address} onChange={handleChange} />
        </label>

        {error && <p className="form-status error">{error}</p>}

        <div className="convert-form-actions">
          <button type="submit" disabled={saving}>
            {saving ? "Converting..." : "Confirm & Create Admission"}
          </button>
          <button
            type="button"
            className="secondary"
            onClick={() => navigate("/admin/students")}
          >
            View Admissions
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default EnquiryConvertModal;
