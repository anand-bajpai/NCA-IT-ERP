import { useState, useEffect, useRef } from "react";
import { FaSearch, FaUserGraduate, FaSyncAlt, FaIdCard } from "react-icons/fa";
import Modal from "../../components/Modal/Modal";
import adminApi from "../api/adminApi";
import siteConfig from "../../config/siteConfig";
import "./IdCardFormModal.css";

function toDateInput(d) {
  if (!d) return "";
  return new Date(d).toISOString().slice(0, 10);
}

function oneYearFromNowInput() {
  const d = new Date();
  d.setFullYear(d.getFullYear() + 1);
  return toDateInput(d);
}

const emptyForm = {
  bloodGroup: "",
  address: "",
  emergencyContact: "",
  mobile: "",
  issueDate: toDateInput(new Date()),
  validUpto: oneYearFromNowInput(),
  status: "Active",
};

// Creates or edits an ID card. Every card is generated FROM an admission
// (Student) record, found by its Admission Number — typing the number and
// fetching pulls in Student Name, Photo, Course, Admission Number, Mobile
// and Email automatically. Address and Emergency Contact are entered by
// hand (Address defaults from the admission record if one is on file).
const IdCardFormModal = ({ isOpen, onClose, onSaved, idCard }) => {
  const isEdit = !!idCard;

  const [form, setForm] = useState(emptyForm);
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  // Admission Number lookup — the primary way a card is generated.
  const [admissionNumber, setAdmissionNumber] = useState("");
  const [fetching, setFetching] = useState(false);
  const [fetchError, setFetchError] = useState("");
  const [selectedStudent, setSelectedStudent] = useState(null);

  // Fallback: browse/search admissions instead of typing the number.
  const [browseOpen, setBrowseOpen] = useState(false);
  const [studentQuery, setStudentQuery] = useState("");
  const [studentResults, setStudentResults] = useState([]);
  const [searchingStudents, setSearchingStudents] = useState(false);
  const searchTimer = useRef(null);

  useEffect(() => {
    if (!isOpen) return;

    if (isEdit) {
      setForm({
        bloodGroup: idCard.bloodGroup || "",
        address: idCard.address || "",
        emergencyContact: idCard.emergencyContact || "",
        mobile: idCard.mobile || "",
        issueDate: toDateInput(idCard.issueDate) || toDateInput(new Date()),
        validUpto: toDateInput(idCard.validUpto) || oneYearFromNowInput(),
        status: idCard.status || "Active",
      });
      setPhotoPreview(idCard.photo || "");
      setSelectedStudent({
        _id: idCard.studentRef,
        fullName: idCard.studentName,
        course: idCard.course,
        batch: idCard.batch,
        admissionNumber: idCard.admissionNumber,
        mobile: idCard.mobile,
        email: idCard.email,
        photo: idCard.photo,
      });
    } else {
      setForm(emptyForm);
      setPhotoPreview("");
      setSelectedStudent(null);
    }
    setPhotoFile(null);
    setAdmissionNumber("");
    setFetchError("");
    setBrowseOpen(false);
    setStudentQuery("");
    setStudentResults([]);
    setError("");
  }, [idCard, isEdit, isOpen]);

  // Debounced admission-record browse search (fallback to number lookup)
  useEffect(() => {
    if (!browseOpen) return;
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(async () => {
      setSearchingStudents(true);
      try {
        const res = await adminApi.get("/students", {
          params: { search: studentQuery, limit: 8 },
        });
        setStudentResults(res.data.data || []);
      } catch {
        setStudentResults([]);
      } finally {
        setSearchingStudents(false);
      }
    }, 300);
    return () => clearTimeout(searchTimer.current);
  }, [studentQuery, browseOpen]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const applyStudent = (student) => {
    setSelectedStudent(student);
    setForm((f) => ({
      ...f,
      mobile: student.mobile || f.mobile,
      address: student.address || f.address,
    }));
  };

  const handleFetchByAdmissionNumber = async () => {
    const num = admissionNumber.trim();
    if (!num) {
      setFetchError("Enter an Admission Number to fetch the student.");
      return;
    }
    setFetching(true);
    setFetchError("");
    try {
      const res = await adminApi.get(`/students/by-admission/${encodeURIComponent(num)}`);
      applyStudent(res.data.data);
    } catch (err) {
      setSelectedStudent(null);
      setFetchError(err.response?.data?.message || "No admission record found with this Admission Number.");
    } finally {
      setFetching(false);
    }
  };

  const pickStudent = (student) => {
    applyStudent(student);
    setBrowseOpen(false);
    setStudentQuery("");
    setAdmissionNumber(student.admissionNumber || "");
    setFetchError("");
  };

  const changeStudent = () => {
    setSelectedStudent(null);
    setAdmissionNumber("");
    setFetchError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isEdit && !selectedStudent) {
      setError("Fetch a student by Admission Number to generate the card from.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const data = new FormData();
      Object.entries(form).forEach(([key, value]) => data.append(key, value ?? ""));
      if (!isEdit) {
        data.append("studentRef", selectedStudent._id);
        data.append("admissionNumber", selectedStudent.admissionNumber || admissionNumber);
      }
      if (photoFile) data.append("photo", photoFile);

      if (isEdit) {
        await adminApi.put(`/id-cards/${idCard._id}`, data);
      } else {
        await adminApi.post("/id-cards", data);
      }

      onSaved();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || "Could not save the ID card.");
    } finally {
      setSaving(false);
    }
  };

  const studentPhotoSrc = (photo) =>
    photo ? `${siteConfig.apiBaseUrl}${photo}` : "";

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <form className="idcard-form" onSubmit={handleSubmit}>
        <div className="idcard-form-heading">
          <h3>{isEdit ? "Edit ID Card" : "Generate ID Card"}</h3>
          <p>
            {isEdit
              ? "Update this ID card's details below and save your changes."
              : "Enter the student's Admission Number to auto-fetch their admission data."}
          </p>
        </div>

        <div className="idcard-form-body">
          <fieldset className="idcard-form-section">
            <legend>Admission Record</legend>

            {isEdit ? (
              <div className="idcard-student-locked">
                <FaUserGraduate />
                <div>
                  <strong>{selectedStudent?.fullName}</strong>
                  <span>{selectedStudent?.course} {selectedStudent?.batch ? `· Batch ${selectedStudent.batch}` : ""}</span>
                </div>
              </div>
            ) : selectedStudent ? (
              <div className="idcard-fetched">
                <div className="idcard-student-picked">
                  {studentPhotoSrc(selectedStudent.photo) ? (
                    <img src={studentPhotoSrc(selectedStudent.photo)} alt={selectedStudent.fullName} />
                  ) : (
                    <span className="idcard-student-avatar"><FaUserGraduate /></span>
                  )}
                  <div className="idcard-student-picked-text">
                    <strong>{selectedStudent.fullName}</strong>
                    <span>
                      {selectedStudent.course}
                      {selectedStudent.batch ? ` · Batch ${selectedStudent.batch}` : ""}
                      {selectedStudent.admissionNumber ? ` · ${selectedStudent.admissionNumber}` : ""}
                    </span>
                  </div>
                  <button type="button" className="idcard-change-btn" onClick={changeStudent}>
                    Change
                  </button>
                </div>

                <div className="idcard-fetched-grid">
                  <div><b>Admission No.</b><span>{selectedStudent.admissionNumber || "—"}</span></div>
                  <div><b>Mobile</b><span>{selectedStudent.mobile || "—"}</span></div>
                  <div className="span-2"><b>Email</b><span>{selectedStudent.email || "—"}</span></div>
                </div>
              </div>
            ) : (
              <>
                <div className="idcard-fetch-box">
                  <FaIdCard />
                  <input
                    type="text"
                    placeholder="Enter Admission Number (e.g. NCA-2026-0142)"
                    value={admissionNumber}
                    onChange={(e) => setAdmissionNumber(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleFetchByAdmissionNumber();
                      }
                    }}
                  />
                  <button type="button" onClick={handleFetchByAdmissionNumber} disabled={fetching}>
                    {fetching ? "Fetching…" : "Fetch"}
                  </button>
                </div>

                {fetchError && <p className="form-status error idcard-fetch-error">{fetchError}</p>}

                <button
                  type="button"
                  className="idcard-browse-toggle"
                  onClick={() => setBrowseOpen((v) => !v)}
                >
                  <FaSearch /> {browseOpen ? "Hide admission search" : "Don't have the Admission Number? Browse admissions"}
                </button>

                {browseOpen && (
                  <div className="idcard-student-search">
                    <div className="idcard-search-box">
                      <FaSearch />
                      <input
                        type="text"
                        placeholder="Search admissions by name, mobile, admission no..."
                        value={studentQuery}
                        onChange={(e) => setStudentQuery(e.target.value)}
                        autoFocus
                      />
                    </div>

                    <div className="idcard-student-results">
                      {searchingStudents ? (
                        <p className="idcard-student-results-status">Searching…</p>
                      ) : studentResults.length === 0 ? (
                        <p className="idcard-student-results-status">
                          {studentQuery ? "No matching admission records." : "Type to search admission records."}
                        </p>
                      ) : (
                        studentResults.map((s) => (
                          <button type="button" key={s._id} className="idcard-student-result" onClick={() => pickStudent(s)}>
                            {studentPhotoSrc(s.photo) ? (
                              <img src={studentPhotoSrc(s.photo)} alt={s.fullName} />
                            ) : (
                              <span className="idcard-student-avatar"><FaUserGraduate /></span>
                            )}
                            <span className="idcard-student-result-text">
                              <strong>{s.fullName}</strong>
                              <span>{s.course}{s.batch ? ` · Batch ${s.batch}` : ""}{s.admissionNumber ? ` · ${s.admissionNumber}` : ""}</span>
                            </span>
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </>
            )}
          </fieldset>

          <fieldset className="idcard-form-section">
            <legend>Card Details</legend>
            <div className="idcard-form-grid">
              <input name="mobile" placeholder="Mobile Number" value={form.mobile} onChange={handleChange} />
              <input name="bloodGroup" placeholder="Blood Group (e.g. O+)" value={form.bloodGroup} onChange={handleChange} />
              <input name="address" placeholder="Address" value={form.address} onChange={handleChange} className="span-2" />
              <input
                name="emergencyContact"
                placeholder="Emergency Contact (name & number)"
                value={form.emergencyContact}
                onChange={handleChange}
                className="span-2"
              />

              <label className="field-label">
                Issue Date
                <input name="issueDate" type="date" value={form.issueDate} onChange={handleChange} />
              </label>

              <label className="field-label">
                Valid Upto
                <input name="validUpto" type="date" value={form.validUpto} onChange={handleChange} required />
              </label>

              <label className="field-label">
                Status
                <select name="status" value={form.status} onChange={handleChange}>
                  <option>Active</option>
                  <option>Expired</option>
                  <option>Blocked</option>
                </select>
              </label>
            </div>
          </fieldset>

          <fieldset className="idcard-form-section">
            <legend>Photo (optional override)</legend>
            <div className="idcard-form-grid">
              <label className="field-label span-2">
                By default the photo on file in the admission record is used. Upload a new one only to override it.
                <input name="photo" type="file" accept="image/png, image/jpeg, image/webp" onChange={handlePhotoChange} />
              </label>

              {photoPreview && (
                <div className="idcard-photo-preview">
                  <img
                    src={photoFile ? photoPreview : studentPhotoSrc(photoPreview) || photoPreview}
                    alt="Card preview"
                  />
                  <span>Photo preview</span>
                </div>
              )}
            </div>
          </fieldset>
        </div>

        {error && <p className="form-status error">{error}</p>}

        <button type="submit" disabled={saving}>
          {saving ? "Saving..." : isEdit ? <><FaSyncAlt /> Update Card</> : "Generate Portrait ID Card"}
        </button>
      </form>
    </Modal>
  );
};

export default IdCardFormModal;
