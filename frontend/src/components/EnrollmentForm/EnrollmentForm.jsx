import { useState } from "react";
import axios from "axios";
import siteConfig from "../../config/siteConfig";
import "./EnrollmentForm.css";

const initialForm = {
  fullName: "",
  email: "",
  phone: "",
  city: "",
  message: "",
};

const EnrollmentForm = ({ courseTitle, onSuccess }) => {
  const [form, setForm] = useState(initialForm);
  const [status, setStatus] = useState({ state: "idle", message: "" });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus({ state: "loading", message: "" });

    try {
      const res = await axios.post(
        `${siteConfig.apiBaseUrl}/api/course-enrollment`,
        { ...form, courseTitle }
      );

      setStatus({
        state: "success",
        message: res.data.message || "Enrolled successfully!",
      });
      setForm(initialForm);
      if (onSuccess) setTimeout(onSuccess, 1500);
    } catch (err) {
      setStatus({
        state: "error",
        message:
          err.response?.data?.message ||
          "Something went wrong. Please try again or WhatsApp us.",
      });
    }
  };

  return (
    <form className="enrollment-form" onSubmit={handleSubmit}>
      <h3>Enroll in {courseTitle}</h3>
      <p className="enrollment-subtext">
        Fill your details — our counsellor will call you shortly.
      </p>

      <input
        type="text"
        name="fullName"
        placeholder="Full Name"
        value={form.fullName}
        onChange={handleChange}
        required
      />

      <input
        type="email"
        name="email"
        placeholder="Email Address"
        value={form.email}
        onChange={handleChange}
        required
      />

      <input
        type="tel"
        name="phone"
        placeholder="Phone Number"
        value={form.phone}
        onChange={handleChange}
        required
      />

      <input
        type="text"
        name="city"
        placeholder="City"
        value={form.city}
        onChange={handleChange}
      />

      <textarea
        rows="3"
        name="message"
        placeholder="Any question? (optional)"
        value={form.message}
        onChange={handleChange}
      ></textarea>

      <button type="submit" disabled={status.state === "loading"}>
        {status.state === "loading" ? "Submitting..." : "Submit & Enroll"}
      </button>

      {status.state === "success" && (
        <p className="form-status success">{status.message}</p>
      )}

      {status.state === "error" && (
        <p className="form-status error">{status.message}</p>
      )}
    </form>
  );
};

export default EnrollmentForm;
