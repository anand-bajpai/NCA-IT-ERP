import { useState } from "react";
import axios from "axios";
import { FaPhoneAlt, FaWhatsapp } from "react-icons/fa";
import siteConfig from "../../config/siteConfig";
import Modal from "../Modal/Modal";
import "./ConsultationCTA.css";

const initialForm = { fullName: "", email: "", phone: "", message: "" };

const ConsultationCTA = () => {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [status, setStatus] = useState({ state: "idle", message: "" });

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus({ state: "loading", message: "" });

    try {
      const res = await axios.post(`${siteConfig.apiBaseUrl}/api/contact`, {
        ...form,
        inquiryType: "Free Consultation",
        contactMethod: "Phone Call",
      });

      setStatus({ state: "success", message: res.data.message || "Request sent!" });
      setForm(initialForm);
      setTimeout(() => setOpen(false), 1500);
    } catch (err) {
      setStatus({
        state: "error",
        message: err.response?.data?.message || "Something went wrong. Please try again.",
      });
    }
  };

  return (
    <section className="consultation-cta">
      <div className="consultation-cta-container">

        <div className="consultation-cta-text">
          <span className="section-tag">FREE CONSULTATION</span>
          <h2>Not Sure Where to Start? Talk to Our Experts — Free</h2>
          <p>
            Get a free 20-minute consultation call with our team to discuss
            your project, course, or internship needs — no cost, no obligation.
          </p>
        </div>

        <div className="consultation-cta-actions">
          <button className="consultation-btn" onClick={() => setOpen(true)}>
            Get Free Consultation
          </button>

          <a href={`tel:${siteConfig.phone}`} className="consultation-call">
            <FaPhoneAlt /> {siteConfig.phoneDisplay}
          </a>
        </div>

      </div>

      <Modal isOpen={open} onClose={() => setOpen(false)}>
        <form className="consultation-form" onSubmit={handleSubmit}>
          <h3>Request a Free Consultation</h3>
          <p className="consultation-form-sub">
            Fill this in — our team will call you back shortly.
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

          <textarea
            rows="3"
            name="message"
            placeholder="What would you like to discuss? (optional)"
            value={form.message}
            onChange={handleChange}
          ></textarea>

          <button type="submit" disabled={status.state === "loading"}>
            {status.state === "loading" ? "Sending..." : "Request Callback"}
          </button>

          {status.state === "success" && <p className="form-status success">{status.message}</p>}
          {status.state === "error" && <p className="form-status error">{status.message}</p>}

          <a
            href={siteConfig.social.whatsapp}
            target="_blank"
            rel="noreferrer"
            className="consultation-whatsapp-link"
          >
            <FaWhatsapp /> Or chat with us on WhatsApp instantly
          </a>
        </form>
      </Modal>
    </section>
  );
};

export default ConsultationCTA;
