import { useState } from "react";
import axios from "axios";
import "./Contact.css";

import {
  FaPhoneAlt,
  FaEnvelope,
  FaMapMarkerAlt,
  FaClock,
  FaWhatsapp,
  FaLinkedinIn,
  FaInstagram,
  FaFacebookF,
  FaYoutube,
} from "react-icons/fa";

import siteConfig from "../../config/siteConfig";
import { useInstituteSettings } from "../../context/InstituteSettingsContext";

const initialForm = {
  fullName: "",
  email: "",
  phone: "",
  inquiryType: "",
  contactMethod: "",
  budget: "",
  message: "",
};

const Contact = () => {
  const site = useInstituteSettings();
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
        `${siteConfig.apiBaseUrl}/api/contact`,
        form
      );

      setStatus({
        state: "success",
        message: res.data.message || "Message sent successfully!",
      });
      setForm(initialForm);
    } catch (err) {
      setStatus({
        state: "error",
        message:
          err.response?.data?.message ||
          "Something went wrong. Please try again or WhatsApp us directly.",
      });
    }
  };

  return (
    <section className="contact">

      <div className="contact-container">

        {/* LEFT SIDE */}
        <div className="contact-info">

          <span className="section-tag">
            CONTACT US
          </span>

          <h2>
            Let's Build Something Amazing Together
          </h2>

          <p className="contact-text">
            Have a project idea, course enquiry, internship query,
            or business requirement? Our team is ready to help you.
          </p>

          {/* Address */}
          <div className="contact-card">
            <div className="contact-icon">
              <FaMapMarkerAlt />
            </div>

            <div>
              <h3>Office Address</h3>

              <p>
                {site.companyName} <br />
                {site.address.full}
              </p>
            </div>
          </div>

          {/* Phone */}
          <div className="contact-card">
            <div className="contact-icon">
              <FaPhoneAlt />
            </div>

            <div>
              <h3>Phone Number</h3>

              <a href={`tel:${site.phone}`}>
                {site.phoneDisplay}
              </a>
            </div>
          </div>

          {/* Email */}
          <div className="contact-card">
            <div className="contact-icon">
              <FaEnvelope />
            </div>

            <div>
              <h3>Email Address</h3>

              <a href={`mailto:${site.email}`}>
                {site.email}
              </a>
            </div>
          </div>

          {/* Working Hours */}
          <div className="contact-card">
            <div className="contact-icon">
              <FaClock />
            </div>

            <div>
              <h3>Working Hours</h3>

              <p>{site.hours}</p>
            </div>
          </div>

          {/* Buttons */}
          <div className="contact-actions">

            <a
              href={site.social.whatsapp}
              target="_blank"
              rel="noreferrer"
              className="whatsapp-btn"
            >
              <FaWhatsapp />
              WhatsApp Chat
            </a>

            <a
              href={`tel:${site.phone}`}
              className="call-btn"
            >
              <FaPhoneAlt />
              Call Now
            </a>

          </div>

          {/* Social Icons */}
          <div className="social-links">

            <a href={site.social.linkedin} target="_blank" rel="noreferrer" aria-label="LinkedIn">
              <FaLinkedinIn />
            </a>

            <a href={site.social.instagram} target="_blank" rel="noreferrer" aria-label="Instagram">
              <FaInstagram />
            </a>

            <a href={site.social.facebook} target="_blank" rel="noreferrer" aria-label="Facebook">
              <FaFacebookF />
            </a>

            <a href={site.social.youtube} target="_blank" rel="noreferrer" aria-label="YouTube">
              <FaYoutube />
            </a>

          </div>

        </div>

        {/* RIGHT SIDE */}
        <div className="contact-form-container">

          <h2>Send Message</h2>

          <form className="contact-form" onSubmit={handleSubmit}>

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

            <select
              name="inquiryType"
              value={form.inquiryType}
              onChange={handleChange}
              required
            >
              <option value="">Inquiry Type</option>
              <option>Project Development</option>
              <option>Corporate Training</option>
              <option>Course Enquiry</option>
              <option>Internship Enquiry</option>
              <option>General Query</option>
            </select>

            <select
              name="contactMethod"
              value={form.contactMethod}
              onChange={handleChange}
              required
            >
              <option value="">Preferred Contact Method</option>
              <option>Phone Call</option>
              <option>WhatsApp</option>
              <option>Email</option>
            </select>

            <select
              name="budget"
              value={form.budget}
              onChange={handleChange}
            >
              <option value="">Budget Range</option>
              <option>Below ₹10,000</option>
              <option>₹10,000 - ₹20,000</option>
              <option>₹20,000 - ₹50,000</option>
              <option>₹50,000+</option>
              <option>Need Guidance</option>
            </select>

            <textarea
              rows="5"
              name="message"
              placeholder="Write your message..."
              value={form.message}
              onChange={handleChange}
              required
            ></textarea>

            <button type="submit" disabled={status.state === "loading"}>
              {status.state === "loading" ? "Sending..." : "Send Message"}
            </button>

            {status.state === "success" && (
              <p className="form-status success">{status.message}</p>
            )}

            {status.state === "error" && (
              <p className="form-status error">{status.message}</p>
            )}

          </form>

          {/* Extra Cards */}
          <div className="contact-extra">

            <div className="extra-card">
              ⚡ Response Within 24 Hours
            </div>

            <div className="extra-card">
              🎓 Internship Guidance Available
            </div>

            <div className="extra-card">
              💼 Free Business Consultation
            </div>

            <div className="extra-card">
              🛠 Technical Support Available
            </div>

          </div>
        </div>

      </div>

      {/* Google Map */}
        <div className="map-container">
        <iframe
            src="https://www.google.com/maps?q=NCA+IT+Solution+Noida,+Iconic+Corenthum+Tower,+Sector+62,+Noida&output=embed"
            width="100%"
            height="450"
            style={{ border: 0 }}
            allowFullScreen=""
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            title="NCA IT Solution Location"
        ></iframe>
        </div>

    </section>
  );
};

export default Contact;
