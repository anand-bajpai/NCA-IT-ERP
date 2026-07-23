import { useState, useEffect } from "react";
import Modal from "../../components/Modal/Modal";
import adminApi from "../api/adminApi";
import "./ClientFormModal.css";

const emptyForm = {
  clientName: "",
  companyName: "",
  mobile: "",
  email: "",
  project: "",
  technology: "",
  startDate: "",
  completionDate: "",
  status: "Completed",
};

const ClientFormModal = ({ isOpen, onClose, onSaved, client }) => {
  const [form, setForm] = useState(emptyForm);
  const [logo, setLogo] = useState(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (client) {
      setForm({
        ...emptyForm,
        ...client,
        startDate: client.startDate ? client.startDate.slice(0, 10) : "",
        completionDate: client.completionDate ? client.completionDate.slice(0, 10) : "",
      });
    } else {
      setForm(emptyForm);
    }
    setLogo(null);
    setError("");
  }, [client, isOpen]);

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
      if (logo) data.append("logo", logo);

      if (client) {
        await adminApi.put(`/clients/${client._id}`, data);
      } else {
        await adminApi.post("/clients", data);
      }

      onSaved();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || "Could not save client record.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <form className="client-form" onSubmit={handleSubmit}>
        <h3>{client ? "Edit Client Record" : "Add Client Record"}</h3>

        <div className="client-form-grid">
          <input name="clientName" placeholder="Client Name *" value={form.clientName} onChange={handleChange} required />
          <input name="companyName" placeholder="Company Name *" value={form.companyName} onChange={handleChange} required />
          <input name="mobile" placeholder="Mobile Number" value={form.mobile} onChange={handleChange} />
          <input name="email" type="email" placeholder="Email" value={form.email} onChange={handleChange} />
          <input name="project" placeholder="Project *" value={form.project} onChange={handleChange} required />
          <input name="technology" placeholder="Technology *" value={form.technology} onChange={handleChange} required />

          <label className="field-label">
            Start Date
            <input name="startDate" type="date" value={form.startDate} onChange={handleChange} />
          </label>

          <label className="field-label">
            Completion Date
            <input name="completionDate" type="date" value={form.completionDate} onChange={handleChange} />
          </label>

          <select name="status" value={form.status} onChange={handleChange}>
            <option>Ongoing</option>
            <option>Completed</option>
            <option>On Hold</option>
          </select>
        </div>

        <label className="field-label">
          Company Logo (JPG/PNG/WEBP/SVG, max 2MB)
          <input type="file" accept="image/jpeg,image/png,image/webp,image/svg+xml" onChange={(e) => setLogo(e.target.files[0])} />
        </label>

        {error && <p className="form-status error">{error}</p>}

        <button type="submit" disabled={saving}>
          {saving ? "Saving..." : client ? "Update Record" : "Add Record"}
        </button>
      </form>
    </Modal>
  );
};

export default ClientFormModal;
