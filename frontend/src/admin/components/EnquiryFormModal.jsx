import { useState, useEffect } from "react";
import Modal from "../../components/Modal/Modal";
import adminApi from "../api/adminApi";
import "./EnquiryFormModal.css";

const emptyForm = {
  fullName: "",
  email: "",
  phone: "",
  course: "",
  inquiryType: "",
  contactMethod: "",
  source: "",
  budget: "",
  message: "",
  status: "New",
};

const EnquiryFormModal = ({ isOpen, onClose, onSaved, enquiry }) => {
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (enquiry) {
      setForm({ ...emptyForm, ...enquiry });
    } else {
      setForm(emptyForm);
    }
    setError("");
  }, [enquiry, isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      if (enquiry) {
        await adminApi.put(`/enquiries/${enquiry._id}`, form);
      } else {
        await adminApi.post("/enquiries", form);
      }

      onSaved();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || "Could not save enquiry.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <form className="enquiry-form" onSubmit={handleSubmit}>
        <h3>{enquiry ? "Edit Enquiry" : "Add Enquiry"}</h3>

        <div className="enquiry-form-grid">
          <input name="fullName" placeholder="Full Name *" value={form.fullName} onChange={handleChange} required />
          <input name="phone" placeholder="Phone Number" value={form.phone} onChange={handleChange} />
          <input name="email" type="email" placeholder="Email" value={form.email} onChange={handleChange} />
          <input name="course" placeholder="Course Interested In" value={form.course} onChange={handleChange} />

          <select name="inquiryType" value={form.inquiryType} onChange={handleChange}>
            <option value="">Inquiry Type</option>
            <option>Admission</option>
            <option>Internship</option>
            <option>Corporate Training</option>
            <option>General</option>
          </select>

          <select name="contactMethod" value={form.contactMethod} onChange={handleChange}>
            <option value="">Preferred Contact Method</option>
            <option>Phone</option>
            <option>Email</option>
            <option>WhatsApp</option>
          </select>

          <select name="source" value={form.source} onChange={handleChange}>
            <option value="">Source</option>
            <option>Website</option>
            <option>Walk-in</option>
            <option>Referral</option>
            <option>Social Media</option>
            <option>Advertisement</option>
          </select>

          <input name="budget" placeholder="Budget Range" value={form.budget} onChange={handleChange} />

          <select name="status" value={form.status} onChange={handleChange}>
            <option>New</option>
            <option>Contacted</option>
            <option>Follow-up</option>
            <option>Converted</option>
            <option>Closed</option>
          </select>
        </div>

        <label className="field-label">
          Message / Notes
          <textarea name="message" rows={3} value={form.message} onChange={handleChange} />
        </label>

        {error && <p className="form-status error">{error}</p>}

        <button type="submit" disabled={saving}>
          {saving ? "Saving..." : enquiry ? "Update Enquiry" : "Add Enquiry"}
        </button>
      </form>
    </Modal>
  );
};

export default EnquiryFormModal;
