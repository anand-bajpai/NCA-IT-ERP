import "./Footer.css";
import { Link } from "react-router-dom";
import {
  FaLinkedinIn,
  FaInstagram,
  FaFacebookF,
  FaYoutube,
  FaWhatsapp,
  FaPhoneAlt,
  FaEnvelope,
  FaMapMarkerAlt,
  FaArrowUp
} from "react-icons/fa";

import { useInstituteSettings } from "../../context/InstituteSettingsContext";

const Footer = () => {
  const site = useInstituteSettings();

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  };

  return (
    <footer className="footer">

      <div className="footer-container">

        {/* Company */}
        <div className="footer-column">
          <h2 className="footer-logo">{site.companyName}</h2>

          <p className="footer-description">
            Empowering businesses and students through
            software development, AI solutions, training
            programs and real world projects.
          </p>

          <div className="trust-badges">
            <span>🏆 1000+ Students Trained</span>
            <span>💼 500+ Projects Delivered</span>
            <span>🎓 Internship Certificates</span>
            <span>🤝 Placement Assistance</span>
          </div>

          <div className="footer-social">

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

            <a
              href={site.social.whatsapp}
              target="_blank"
              rel="noreferrer"
              aria-label="WhatsApp"
            >
              <FaWhatsapp />
            </a>

          </div>
        </div>

        {/* Quick Links */}
        <div className="footer-column">
          <h3>Quick Links</h3>

          <Link to="/">Home</Link>
          <Link to="/about">About</Link>
          <Link to="/services">Services</Link>
          <Link to="/courses">Courses</Link>
          <Link to="/portfolio">Portfolio</Link>
          <Link to="/certificate-verification">Certificate Verification</Link>
          <Link to="/contact">Contact</Link>
        </div>

        {/* Courses */}
        <div className="footer-column">
          <h3>Popular Courses</h3>

          <Link to="/courses">MERN Stack Development</Link>
          <Link to="/courses">Python Development</Link>
          <Link to="/courses">Artificial Intelligence</Link>
          <Link to="/courses">Cyber Security</Link>
          <Link to="/courses">Java Full Stack</Link>
          <Link to="/courses">Cloud Computing</Link>
        </div>

        {/* Services */}
        <div className="footer-column">
          <h3>Services</h3>

          <Link to="/services#web-development">Web Development</Link>
          <Link to="/services#mobile-app-development">Mobile App Development</Link>
          <Link to="/services#ai-solutions">AI Solutions</Link>
          <Link to="/services#cloud-solutions">Cloud Solutions</Link>
          <Link to="/contact">Corporate Training</Link>
          <Link to="/internship">Internship Programs</Link>
        </div>

        {/* Contact */}
        <div className="footer-column">
          <h3>Contact Info</h3>

          <div className="footer-contact">

            <p>
              <FaMapMarkerAlt />
              {site.address.line2 || site.address.line1}
            </p>

            <p>
              <FaPhoneAlt />
              <a href={`tel:${site.phone}`}>{site.phoneDisplay}</a>
            </p>

            <p>
              <FaEnvelope />
              <a href={`mailto:${site.email}`}>{site.email}</a>
            </p>

          </div>

          <div className="mini-map">
            <iframe
              src="https://www.google.com/maps?q=NCA+IT+Solution+Noida,+Iconic+Corenthum+Tower,+Sector+62,+Noida&output=embed"
              title="NCA IT Solution"
              loading="lazy"
            ></iframe>
          </div>
        </div>

      </div>

      {/* Legal Links */}
      <div className="legal-links">
        <a href="#">Privacy Policy</a>
        <a href="#">Terms & Conditions</a>
        <a href="#">Refund Policy</a>
        <a href="#">Cookie Policy</a>
      </div>

      {/* Bottom */}
      <div className="footer-bottom">

        <p>
          © 2026 {site.companyName}. All Rights Reserved.
        </p>

        <p>
          Designed & Developed by NCA IT Solutions
        </p>

      </div>

      {/* Back To Top */}
      <button
        className="scroll-top"
        onClick={scrollToTop}
      >
        <FaArrowUp />
      </button>

    </footer>
  );
};

export default Footer;