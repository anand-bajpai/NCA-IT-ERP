import { useState, useEffect } from "react";
import { FaFileAlt, FaTimes } from "react-icons/fa";
import Modal from "../../components/Modal/Modal";
import adminApi from "../api/adminApi";
import siteConfig from "../../config/siteConfig";
import { coursesData } from "../../data/courses";
import "./StudentFormModal.css";

// Course Enrollment Module — the admission form's "Select Course" list is
// always the live Course catalog (same collection managed on the
// Enrollments page), so a course added/edited/deleted there is reflected
// here immediately. Falls back to the static catalog if the API call fails,
// so the form never breaks.
function useAdmissionCourseOptions(isOpen) {
  const [courseOptions, setCourseOptions] = useState(
    coursesData.map((c) => c.title)
  );

  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;

    adminApi
      .get("/enrollments/courses")
      .then((res) => {
        if (cancelled) return;
        const list = res.data?.data;
        if (Array.isArray(list) && list.length) {
          setCourseOptions(list.map((c) => c.title));
        }
      })
      .catch(() => {
        // keep the static fallback already in state
      });

    return () => {
      cancelled = true;
    };
  }, [isOpen]);

  return courseOptions;
}


const emptyForm = {
  fullName: "",
  fatherName: "",
  motherName: "",
  mobile: "",
  email: "",
  course: "",
  batch: "",
  admissionNumber: "",
  address: "",
  joiningDate: "",
  completionDate: "",
  status: "Active",
  studentType: "Regular",
  certificateEligible: false,
  idCardEligible: false,
};

// Batch is a fixed set of daily timings only — no month/year combinations.
const BATCH_OPTIONS = ["Morning", "Afternoon", "Evening"];

const StudentFormModal = ({ isOpen, onClose, onSaved, student }) => {
  const courseOptions = useAdmissionCourseOptions(isOpen);
  const [form, setForm] = useState(emptyForm);
  const [photo, setPhoto] = useState(null);
  const [documents, setDocuments] = useState([]); // newly selected files (this session)
  const [existingDocuments, setExistingDocuments] = useState([]); // already-saved docs (edit mode)
  const [removedDocUrls, setRemovedDocUrls] = useState([]);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (student) {
      setForm({
        ...emptyForm,
        ...student,
        joiningDate: student.joiningDate ? student.joiningDate.slice(0, 10) : "",
        completionDate: student.completionDate ? student.completionDate.slice(0, 10) : "",
      });
    } else {
      setForm(emptyForm);
    }
    setPhoto(null);
    setDocuments([]);
    setExistingDocuments(student?.documents || []);
    setRemovedDocUrls([]);
    setError("");
  }, [student, isOpen]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm({ ...form, [name]: type === "checkbox" ? checked : value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      const data = new FormData();
      Object.entries(form).forEach(([key, value]) => {
        if (key === "admissionNumber") return; // system-generated, never sent by the client
        data.append(key, value);
      });
      if (photo) data.append("photo", photo);
      documents.forEach((file) => data.append("documents", file));
      if (removedDocUrls.length) data.append("documentsToRemove", JSON.stringify(removedDocUrls));

      if (student) {
        await adminApi.put(`/students/${student._id}`, data);
      } else {
        await adminApi.post("/students", data);
      }

      onSaved();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || "Could not save student.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <form className="student-form" onSubmit={handleSubmit}>
        <h3>{student ? "Edit Student" : "Add New Student"}</h3>

        <div className="student-form-grid">
          <input name="fullName" placeholder="Full Name *" value={form.fullName} onChange={handleChange} required />
          <input name="fatherName" placeholder="Father's Name" value={form.fatherName} onChange={handleChange} />
          <input name="motherName" placeholder="Mother's Name" value={form.motherName} onChange={handleChange} />
          <input name="mobile" placeholder="Mobile Number *" value={form.mobile} onChange={handleChange} required />
          <input name="email" type="email" placeholder="Email" value={form.email} onChange={handleChange} />
          <select name="course" value={form.course} onChange={handleChange} required>
            <option value="">Select Course *</option>
            {courseOptions.map((title) => (
              <option key={title} value={title}>{title}</option>
            ))}
            {/* Preserve a pre-existing value saved before this course
                existed in the current catalog (e.g. course later renamed
                or removed), so editing that student doesn't silently blank
                the field. */}
            {form.course && !courseOptions.includes(form.course) && (
              <option value={form.course}>{form.course}</option>
            )}
          </select>

          <select name="batch" value={form.batch} onChange={handleChange}>
            <option value="">Select Batch</option>
            {BATCH_OPTIONS.map((b) => (
              <option key={b} value={b}>{b}</option>
            ))}
            {/* Preserve a pre-existing value saved before the batch list was
                restricted to Morning/Afternoon/Evening, so opening the edit
                form doesn't silently overwrite it. */}
            {form.batch && !BATCH_OPTIONS.includes(form.batch) && (
              <option value={form.batch}>{form.batch}</option>
            )}
          </select>

          <label className="field-label">
            Admission Number
            <input
              name="admissionNumber"
              value={student ? form.admissionNumber : "Auto-generated on save"}
              readOnly
              disabled={!student}
              title="System-generated — cannot be edited"
            />
          </label>

          <label className="field-label">
            Joining Date
            <input name="joiningDate" type="date" value={form.joiningDate} onChange={handleChange} />
          </label>

          <label className="field-label">
            Completion Date
            <input name="completionDate" type="date" value={form.completionDate} onChange={handleChange} />
          </label>

          <select name="status" value={form.status} onChange={handleChange}>
            <option>Active</option>
            <option>Completed</option>
            <option>Dropped</option>
            <option>On Hold</option>
          </select>

          <select name="studentType" value={form.studentType} onChange={handleChange}>
            <option>Regular</option>
            <option>Internship</option>
            <option>Client</option>
          </select>
        </div>

        <textarea name="address" placeholder="Address" rows="2" value={form.address} onChange={handleChange}></textarea>

        <div className="student-form-checkboxes">
          <label>
            <input type="checkbox" name="certificateEligible" checked={form.certificateEligible} onChange={handleChange} />
            Certificate Eligible
          </label>
          <label>
            <input type="checkbox" name="idCardEligible" checked={form.idCardEligible} onChange={handleChange} />
            ID Card Eligible
          </label>
        </div>

        <label className="field-label">
          Photo (JPG/PNG/WEBP, max 2MB)
          <input type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => setPhoto(e.target.files[0])} />
        </label>

        <label className="field-label">
          Documents (Aadhar, Marksheet, ID Proof — PDF/JPG/PNG, up to 5 files)
          <input
            type="file"
            multiple
            accept="application/pdf,image/jpeg,image/png,image/webp"
            onChange={(e) => setDocuments(Array.from(e.target.files).slice(0, 5))}
          />
        </label>

        {(existingDocuments.length > 0 || documents.length > 0) && (
          <div className="document-list">
            {existingDocuments.map((doc) => (
              <div className="document-chip" key={doc.url}>
                <FaFileAlt />
                <a href={`${siteConfig.apiBaseUrl}${doc.url}`} target="_blank" rel="noreferrer">
                  {doc.name || "Document"}
                </a>
                <button
                  type="button"
                  title="Remove"
                  onClick={() => {
                    setRemovedDocUrls((prev) => [...prev, doc.url]);
                    setExistingDocuments((prev) => prev.filter((d) => d.url !== doc.url));
                  }}
                >
                  <FaTimes />
                </button>
              </div>
            ))}
            {documents.map((file, idx) => (
              <div className="document-chip pending" key={`${file.name}-${idx}`}>
                <FaFileAlt />
                <span>{file.name}</span>
                <button
                  type="button"
                  title="Remove"
                  onClick={() => setDocuments((prev) => prev.filter((_, i) => i !== idx))}
                >
                  <FaTimes />
                </button>
              </div>
            ))}
          </div>
        )}

        {error && <p className="form-status error">{error}</p>}

        <button type="submit" disabled={saving}>
          {saving ? "Saving..." : student ? "Update Student" : "Add Student"}
        </button>
      </form>
    </Modal>
  );
};

export default StudentFormModal;
