import "./Hero.css";
import { Link } from "react-router-dom";
import heroImage from "../../../assets/images/Internship/hero.png";
import siteConfig from "../../../config/siteConfig";
import {
  FaBriefcase,
  FaUserTie,
  FaCertificate,
  FaHandshake
} from "react-icons/fa";

const Hero = () => {
  return (
    <section className="internship-hero">

      <div className="hero-container">

        <div className="hero-left">

          <span className="hero-badge">
            🚀 INTERNSHIP PROGRAM 2026
          </span>

          <h1>
            Kickstart Your Career
            With Industry Ready
            <span> Internships</span>
          </h1>

          <p>
            Gain hands-on experience with real-world projects,
            expert mentorship and internship certification
            that sets you ahead.
          </p>

          <div className="hero-buttons">
            <Link to="/internship#apply" className="apply-btn">
              Apply Now →
            </Link>

            <a
              href={`${siteConfig.social.whatsapp}?text=${encodeURIComponent(
                "Hi, I'd like to get the Internship Program brochure for NCA IT Solution."
              )}`}
              target="_blank"
              rel="noreferrer"
              className="brochure-btn"
            >
              Download Brochure ↓
            </a>
          </div>

          <div className="hero-features">

            <div>
              <FaBriefcase />
              Live Projects
            </div>

            <div>
              <FaUserTie />
              Expert Mentors
            </div>

            <div>
              <FaCertificate />
              Certificate
            </div>

            <div>
              <FaHandshake />
              Placement Support
            </div>

          </div>

        </div>

        <div className="hero-right">

          <img src={heroImage} alt="" />

          <div className="floating-card">
            <h4>Build Your Future</h4>
            <p>Learn • Build • Grow</p>
            <span>With NCA IT Solution</span>
          </div>

        </div>

      </div>

    </section>
  );
};

export default Hero;