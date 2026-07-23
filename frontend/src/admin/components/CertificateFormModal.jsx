import { useState, useEffect } from "react";
import Modal from "../../components/Modal/Modal";
import adminApi from "../api/adminApi";
import { coursesData } from "../../data/courses";
import "./CertificateFormModal.css";

// Certificates are only ever issued to Students now, resolved by Admission
// Number, so only Student-facing certificate types are offered here.
const CERTIFICATE_TYPES = [
  "Student Course Completion",
  "Internship Completion",
  "Certificate of Appreciation",
  "Certificate of Excellence",
];

const todayIso = () => new Date().toISOString().slice(0, 10);

const emptyForm = {
  certificateNumber: "",
  admissionNumber: "",
  studentName: "",
  fatherName: "",
  course: "",
  duration: "",
  joiningDate: "",
  issueDate: todayIso(),
  technology: "",
  grade: "",
  certificateType: "Student Course Completion",
  description: "",
  status: "Valid",
};

// Course duration is catalog data (not stored on the Student record), so it
// is derived by matching the fetched student's course against the course
// catalog rather than fetched from the backend.
const durationForCourse = (courseTitle) =>
  coursesData.find((c) => c.title === courseTitle)?.duration || "";

const CertificateFormModal = ({ isOpen, onClose, onSaved, certificate }) => {
  const [form, setForm] = useState(emptyForm);
  const [studentFound, setStudentFound] = useState(false);
  const [lookupStatus, setLookupStatus] = useState(""); // "", "loading", "error"
  const [lookupError, setLookupError] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (certificate) {
      setForm({
        ...emptyForm,
        ...certificate,
        joiningDate: certificate.joiningDate ? certificate.joiningDate.slice(0, 10) : "",
        issueDate: certificate.issueDate ? certificate.issueDate.slice(0, 10) : todayIso(),
      });
      setStudentFound(!!certificate.admissionNumber);
    } else {
      setForm(emptyForm);
      setStudentFound(false);
    }
    setLookupStatus("");
    setLookupError("");
    setError("");
  }, [certificate, isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  const handleAdmissionNumberChange = (e) => {
    setForm({ ...form, admissionNumber: e.target.value });
    // Any edit to the admission number invalidates the previously fetched
    // student details until it's looked up again.
    setStudentFound(false);
    setLookupStatus("");
    setLookupError("");
  };

  const handleLookup = async () => {
    const admissionNumber = form.admissionNumber.trim();
    if (!admissionNumber) {
      setLookupError("Enter an admission number first.");
      return;
    }

    setLookupStatus("loading");
    setLookupError("");

    try {
      const res = await adminApi.get(`/certificates/lookup-student/${encodeURIComponent(admissionNumber)}`);
      const student = res.data.data;
      setForm((f) => ({
        ...f,
        admissionNumber: student.admissionNumber,
        studentName: student.studentName,
        fatherName: student.fatherName,
        course: student.course,
        joiningDate: student.joiningDate ? student.joiningDate.slice(0, 10) : "",
        duration: durationForCourse(student.course),
      }));
      setStudentFound(true);
      setLookupStatus("");
    } catch (err) {
      setStudentFound(false);
      setLookupStatus("error");
      setLookupError(err.response?.data?.message || "No student found with this admission number.");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!studentFound) {
      setError("Look up a valid admission number before saving.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const payload = { ...form };
      if (!payload.certificateNumber) delete payload.certificateNumber;

      if (certificate) {
        await adminApi.put(`/certificates/${certificate._id}`, payload);
      } else {
        await adminApi.post("/certificates", payload);
      }

      onSaved();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || "Could not save certificate.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <form className="certificate-form" onSubmit={handleSubmit}>
        <div className="certificate-form-heading">
          <h3>{certificate ? "Edit Certificate" : "Issue New Certificate"}</h3>
          <p>{certificate ? "Update the details below and save your changes." : "Enter the student's admission number to fetch their details, then complete the certificate."}</p>
        </div>

        <div className="certificate-form-body">
          <fieldset className="certificate-form-section">
            <legend>Student (via Admission Number)</legend>
            <div className="certificate-form-grid">
              <div className="admission-lookup-row span-2">
                <input
                  name="admissionNumber"
                  placeholder="Admission Number *"
                  value={form.admissionNumber}
                  onChange={handleAdmissionNumberChange}
                  required
                />
                <button type="button" onClick={handleLookup} disabled={lookupStatus === "loading"}>
                  {lookupStatus === "loading" ? "Fetching..." : "Fetch Student"}
                </button>
              </div>

              {lookupError && <p className="form-status error span-2">{lookupError}</p>}

              <input placeholder="Student Name" value={form.studentName} readOnly disabled />
              <input placeholder="Father's Name" value={form.fatherName} readOnly disabled />
              <input placeholder="Course" value={form.course} readOnly disabled />
              <input placeholder="Duration" value={form.duration} readOnly disabled />
              <label className="field-label">
                Joining Date
                <input value={form.joiningDate} readOnly disabled />
              </label>
              <label className="field-label">
                Issue Date
                <input name="issueDate" type="date" value={form.issueDate} readOnly disabled />
              </label>
            </div>
          </fieldset>

          <fieldset className="certificate-form-section">
            <legend>Certificate</legend>
            <div className="certificate-form-grid">
              <input
                name="certificateNumber"
                placeholder="Certificate Number (leave blank to auto-generate)"
                value={form.certificateNumber}
                onChange={handleChange}
                disabled={!!certificate}
              />

              <select name="certificateType" value={form.certificateType} onChange={handleChange}>
                {CERTIFICATE_TYPES.map((type) => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>

              <input name="technology" placeholder="Technology" value={form.technology} onChange={handleChange} />
              <input name="grade" placeholder="Grade" value={form.grade} onChange={handleChange} />

              <label className="field-label">
                Status
                <select name="status" value={form.status} onChange={handleChange}>
                  <option>Valid</option>
                  <option>Expired</option>
                  <option>Revoked</option>
                </select>
              </label>
            </div>

            <textarea
              name="description"
              placeholder="Description / Appreciation-Excellence citation text"
              rows="2"
              value={form.description}
              onChange={handleChange}
            ></textarea>
          </fieldset>
        </div>

        {error && <p className="form-status error">{error}</p>}

        <button type="submit" disabled={saving || !studentFound}>
          {saving ? "Saving..." : certificate ? "Update Certificate" : "Issue Certificate"}
        </button>
      </form>
    </Modal>
  );
};

export default CertificateFormModal;
