import { useState, useEffect } from "react";
import Modal from "../../components/Modal/Modal";
import adminApi from "../api/adminApi";
import "./InternshipFormModal.css";

const emptyForm = {
  studentName: "",
  mobile: "",
  email: "",
  companyName: "",
  technology: "",
  mentor: "",
  projectName: "",
  startDate: "",
  endDate: "",
  internshipDuration: "",
  status: "Ongoing",
};

const InternshipFormModal = ({ isOpen, onClose, onSaved, internship }) => {
  const [form, setForm] = useState(emptyForm);
  const [photo, setPhoto] = useState(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (internship) {
      setForm({
        ...emptyForm,
        ...internship,
        startDate: internship.startDate ? internship.startDate.slice(0, 10) : "",
        endDate: internship.endDate ? internship.endDate.slice(0, 10) : "",
      });
    } else {
      setForm(emptyForm);
    }
    setPhoto(null);
    setError("");
  }, [internship, isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      const data = new FormData();
      Object.entries(form).forEach(([key, value]) => data.append(key, value));
      if (photo) data.append("photo", photo);

      if (internship) {
        await adminApi.put(`/internships/${internship._id}`, data);
      } else {
        await adminApi.post("/internships", data);
      }

      onSaved();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || "Could not save internship record.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <form className="internship-form" onSubmit={handleSubmit}>
        <h3>{internship ? "Edit Internship Record" : "Add Internship Record"}</h3>

        <div className="internship-form-grid">
          <input name="studentName" placeholder="Student Name *" value={form.studentName} onChange={handleChange} required />
          <input name="mobile" placeholder="Mobile Number" value={form.mobile} onChange={handleChange} />
          <input name="email" type="email" placeholder="Email" value={form.email} onChange={handleChange} />
          <input name="companyName" placeholder="Company Name *" value={form.companyName} onChange={handleChange} required />
          <input name="technology" placeholder="Technology *" value={form.technology} onChange={handleChange} required />
          <input name="mentor" placeholder="Mentor" value={form.mentor} onChange={handleChange} />
          <input name="projectName" placeholder="Project Name" value={form.projectName} onChange={handleChange} />
          <input name="internshipDuration" placeholder="Duration (e.g. 3 Months)" value={form.internshipDuration} onChange={handleChange} />

          <label className="field-label">
            Start Date
            <input name="startDate" type="date" value={form.startDate} onChange={handleChange} />
          </label>

          <label className="field-label">
            End Date
            <input name="endDate" type="date" value={form.endDate} onChange={handleChange} />
          </label>

          <select name="status" value={form.status} onChange={handleChange}>
            <option>Ongoing</option>
            <option>Completed</option>
            <option>Dropped</option>
          </select>
        </div>

        <label className="field-label">
          Photo (JPG/PNG/WEBP, max 2MB)
          <input type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => setPhoto(e.target.files[0])} />
        </label>

        {error && <p className="form-status error">{error}</p>}

        <button type="submit" disabled={saving}>
          {saving ? "Saving..." : internship ? "Update Record" : "Add Record"}
        </button>
      </form>
    </Modal>
  );
};

export default InternshipFormModal;
