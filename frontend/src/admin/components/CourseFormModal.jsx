import { useState, useEffect } from "react";
import Modal from "../../components/Modal/Modal";
import adminApi from "../api/adminApi";
import siteConfig from "../../config/siteConfig";
import "./CourseFormModal.css";

const emptyForm = {
  title: "",
  slug: "",
  duration: "",
  level: "",
  students: "",
  originalPrice: "",
  discountPrice: "",
  discount: "",
  rating: "",
  totalRatings: "",
  totalLectures: "",
  about: "",
  syllabus: "",
  benefits: "",
  upskills: "",
};

// Arrays (syllabus/benefits/upskills) are edited as one-item-per-line text
// and converted back to arrays on submit.
const arrayToLines = (arr) => (Array.isArray(arr) ? arr.join("\n") : "");

// Course Enrollment Module — Discount % is always derived from Original
// Price vs Discount Price, never typed in manually, so it can never drift
// out of sync with the two prices.
function computeDiscountPercent(originalPrice, discountPrice) {
  const original = Number(originalPrice);
  const discounted = Number(discountPrice);
  if (!original || original <= 0 || Number.isNaN(discounted)) return "";
  const percent = ((original - discounted) / original) * 100;
  return String(Math.max(0, Math.round(percent)));
}

const CourseFormModal = ({ isOpen, onClose, onSaved, course }) => {
  const [form, setForm] = useState(emptyForm);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const isEdit = !!course;

  useEffect(() => {
    if (course) {
      setForm({
        ...emptyForm,
        ...course,
        syllabus: arrayToLines(course.syllabus),
        benefits: arrayToLines(course.benefits),
        upskills: arrayToLines(course.upskills),
        discount: computeDiscountPercent(course.originalPrice, course.discountPrice),
      });
      setImagePreview(course.image || "");
    } else {
      setForm(emptyForm);
      setImagePreview("");
    }
    setImageFile(null);
    setError("");
  }, [course, isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "originalPrice" || name === "discountPrice") {
      const next = { ...form, [name]: value };
      next.discount = computeDiscountPercent(next.originalPrice, next.discountPrice);
      setForm(next);
      return;
    }

    setForm({ ...form, [name]: value });
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const imageSrc = (image) =>
    image && image.startsWith("/uploads") ? `${siteConfig.apiBaseUrl}${image}` : image;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) {
      setError("Course title is required.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const data = new FormData();
      Object.entries(form).forEach(([key, value]) => data.append(key, value ?? ""));
      if (imageFile) data.append("image", imageFile);

      if (isEdit) {
        await adminApi.put(`/enrollments/courses/${course._id}`, data);
      } else {
        await adminApi.post("/enrollments/courses", data);
      }

      onSaved();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || "Could not save the course.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <form className="course-form" onSubmit={handleSubmit}>
        <div className="course-form-heading">
          <h3>{isEdit ? "Edit Course" : "Add Course"}</h3>
          <p>
            {isEdit
              ? "Changes are reflected on the public website immediately."
              : "This course will appear on the public website as soon as it's saved."}
          </p>
        </div>

        {error && <p className="form-status error">{error}</p>}

        <div className="course-form-body">
          <div className="course-form-grid">
            <label className="field-label span-2">
              Course Title <span className="required-mark">*</span>
              <input name="title" value={form.title} onChange={handleChange} required />
            </label>

            <label className="field-label">
              Duration
              <input name="duration" placeholder="e.g. 6 Months" value={form.duration} onChange={handleChange} />
            </label>

            <label className="field-label">
              Level
              <input name="level" placeholder="e.g. Beginner to Advanced" value={form.level} onChange={handleChange} />
            </label>

            <label className="field-label">
              Students (display text)
              <input name="students" placeholder="e.g. 500+ Students" value={form.students} onChange={handleChange} />
            </label>

            <label className="field-label">
              Total Lectures
              <input type="number" min="0" name="totalLectures" value={form.totalLectures} onChange={handleChange} />
            </label>

            <label className="field-label">
              Original Price (₹)
              <input type="number" min="0" name="originalPrice" value={form.originalPrice} onChange={handleChange} />
            </label>

            <label className="field-label">
              Discount Price (₹)
              <input type="number" min="0" name="discountPrice" value={form.discountPrice} onChange={handleChange} />
            </label>

            <label className="field-label">
              Discount (%) — auto-calculated
              <input
                type="number"
                min="0"
                max="100"
                name="discount"
                value={form.discount}
                readOnly
                tabIndex={-1}
                placeholder="Auto"
                title="Calculated automatically from Original Price and Discount Price"
              />
            </label>

            <label className="field-label">
              Rating (out of 5)
              <input type="number" min="0" max="5" step="0.1" name="rating" value={form.rating} onChange={handleChange} />
            </label>

            <label className="field-label">
              Total Ratings
              <input type="number" min="0" name="totalRatings" value={form.totalRatings} onChange={handleChange} />
            </label>

            <label className="field-label span-2">
              About
              <textarea name="about" rows={3} value={form.about} onChange={handleChange} />
            </label>

            <label className="field-label span-2">
              Syllabus (one item per line)
              <textarea name="syllabus" rows={4} value={form.syllabus} onChange={handleChange} />
            </label>

            <label className="field-label span-2">
              Benefits (one item per line)
              <textarea name="benefits" rows={4} value={form.benefits} onChange={handleChange} />
            </label>

            <label className="field-label span-2">
              Upskills (one item per line)
              <textarea name="upskills" rows={4} value={form.upskills} onChange={handleChange} />
            </label>

            <label className="field-label span-2">
              Course Image
              <input type="file" accept="image/png, image/jpeg, image/webp" onChange={handleImageChange} />
            </label>

            {imagePreview && (
              <div className="course-image-preview span-2">
                <img src={imageFile ? imagePreview : imageSrc(imagePreview)} alt="Course preview" />
              </div>
            )}
          </div>
        </div>

        <button type="submit" disabled={saving}>
          {saving ? "Saving..." : isEdit ? "Save Changes" : "Add Course"}
        </button>
      </form>
    </Modal>
  );
};

export default CourseFormModal;
