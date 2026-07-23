import { useState } from "react";
import { Link } from "react-router-dom";
import "./services.css";
import { servicesData } from "../../data/Services";
import Modal from "../Modal/Modal";

import {
  FaCode,
  FaMobileAlt,
  FaRobot,
  FaShieldAlt,
  FaChartBar,
  FaCloud,
  FaCheckCircle,
} from "react-icons/fa";

// Each service gets its own dedicated icon (fixes the earlier bug where
// "Web Development" was mistakenly showing the same image as "AI Solutions")
const serviceIcons = {
  1: <FaCode />,          // Web Development
  2: <FaMobileAlt />,     // Mobile App Development
  3: <FaRobot />,         // AI Solutions
  4: <FaShieldAlt />,     // Cyber Security
  5: <FaChartBar />,      // Data Science
  6: <FaCloud />,         // Cloud Solutions
};

const Services = () => {
  const [activeService, setActiveService] = useState(null);

  return (
    <section className="services" id="services">
      <div className="services-container">

        <div className="section-heading">
          <span>OUR SERVICES</span>
          <h2>AI-Powered Software Development Solutions</h2>
          <p>We deliver end-to-end custom software, mobile apps, and AI solutions that help startups and enterprises scale faster.</p>
        </div>

        <div className="services-grid">
          {servicesData.map((service) => (
            <div
              className="service-card"
              key={service.id}
              id={service.title.toLowerCase().replace(/\s+/g, "-")}
            >
              <div className="service-icon">
                {serviceIcons[service.id]}
              </div>

              <h3>{service.title}</h3>
              <p>{service.description}</p>
              <button
                className="learn-more-btn"
                onClick={() => setActiveService(service)}
              >
                Learn More →
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Detailed service info modal */}
      <Modal isOpen={!!activeService} onClose={() => setActiveService(null)}>
        {activeService && (
          <div className="service-modal">
            <div className="service-modal-icon">
              {serviceIcons[activeService.id]}
            </div>

            <h3>{activeService.title}</h3>
            <p className="service-modal-desc">{activeService.description}</p>

            <h4>What we provide</h4>
            <ul className="service-modal-list">
              {activeService.deliverables.map((item, i) => (
                <li key={i}>
                  <FaCheckCircle className="check-icon" />
                  {item}
                </li>
              ))}
            </ul>

            <h4>Technologies we use</h4>
            <div className="service-modal-tags">
              {activeService.technologies.map((tech) => (
                <span key={tech} className="service-tag">{tech}</span>
              ))}
            </div>

            <h4>Ideal for</h4>
            <p className="service-modal-ideal">{activeService.idealFor}</p>

            <Link
              to="/contact"
              className="service-modal-cta"
              onClick={() => setActiveService(null)}
            >
              Get a Free Quote
            </Link>
          </div>
        )}
      </Modal>
    </section>
  );
};

export default Services;
