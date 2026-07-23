import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import axios from "axios";
import "./Form.css";
import siteConfig from "../../../config/siteConfig";

const initialForm = {
  fullName: "",
  email: "",
  phone: "",
  college: "",
  branch: "",
  year: "",
  domain: "",
  duration: "",
  mode: "",
  message: "",
};

const Form = () => {
  const [form, setForm] = useState(initialForm);
  const [resume, setResume] = useState(null);
  const [status, setStatus] = useState({ state: "idle", message: "" });
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const domainFromUrl = searchParams.get("domain");
    if (domainFromUrl) {
      setForm((prev) => ({ ...prev, domain: domainFromUrl }));
    }
  }, [searchParams]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    setResume(e.target.files[0] || null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus({ state: "loading", message: "" });

    try {
      const data = new FormData();
      Object.entries(form).forEach(([key, value]) => data.append(key, value));
      if (resume) data.append("resume", resume);

      const res = await axios.post(
        `${siteConfig.apiBaseUrl}/api/internship-application`,
        data,
        { headers: { "Content-Type": "multipart/form-data" } }
      );

      setStatus({
        state: "success",
        message: res.data.message || "Application submitted successfully!",
      });
      setForm(initialForm);
      setResume(null);
      e.target.reset();
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
    <section className="apply-form" id="apply">

      <div className="apply-container">

        <div className="apply-left">

          <span className="section-tag">
            APPLY NOW
          </span>

          <h2>Apply for Internship</h2>

          <p>
            Fill in your details and our team will
            get back to you shortly.
          </p>

        </div>

        <form className="internship-form" onSubmit={handleSubmit}>

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
            name="college"
            placeholder="College / University"
            value={form.college}
            onChange={handleChange}
          />

          <input
            type="text"
            name="branch"
            placeholder="Branch / Stream"
            value={form.branch}
            onChange={handleChange}
          />

          <select name="year" value={form.year} onChange={handleChange}>
            <option value="">Current Year</option>
            <option>1st Year</option>
            <option>2nd Year</option>
            <option>3rd Year</option>
            <option>Final Year</option>
          </select>

          <select name="domain" value={form.domain} onChange={handleChange}>
            <option value="">Select Domain</option>
            <option>MERN Stack Development</option>
            <option>Python Development</option>
            <option>Artificial Intelligence</option>
            <option>Cyber Security</option>
            <option>Java Full Stack</option>
            <option>Cloud Computing</option>
          </select>

          <select name="duration" value={form.duration} onChange={handleChange}>
            <option value="">Preferred Duration</option>
            <option>1 Month</option>
            <option>2 Months</option>
            <option>3 Months</option>
          </select>

          <select name="mode" value={form.mode} onChange={handleChange}>
            <option value="">Mode</option>
            <option>Online</option>
            <option>Offline</option>
            <option>Hybrid</option>
          </select>

          <label className="file-label">
            Resume (PDF/DOC, max 5MB)
            <input
              type="file"
              name="resume"
              accept=".pdf,.doc,.docx"
              onChange={handleFileChange}
            />
          </label>

          <textarea
            rows="5"
            name="message"
            placeholder="Tell us about yourself..."
            value={form.message}
            onChange={handleChange}
          ></textarea>

          <button type="submit" disabled={status.state === "loading"}>
            {status.state === "loading" ? "Submitting..." : "Submit Application"}
          </button>

          {status.state === "success" && (
            <p className="form-status success">{status.message}</p>
          )}

          {status.state === "error" && (
            <p className="form-status error">{status.message}</p>
          )}

        </form>

      </div>

    </section>
  );
};

export default Form;
