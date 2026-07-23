import { NavLink } from "react-router-dom";
import {
  FaMapMarkerAlt,
  FaClock,
  FaPhoneAlt,
  FaLinkedinIn,
  FaInstagram,
  FaFacebookF,
} from "react-icons/fa";

import siteConfig from "../../config/siteConfig";
import { useInstituteSettings } from "../../context/InstituteSettingsContext";
import "./TopBar.css";

const TopBar = () => {
  const site = useInstituteSettings();
  return (
    <div className="topbar">
      <div className="topbar-container">

        {/* Left: address + hours */}
        <div className="topbar-left">
          <span className="topbar-item">
            <FaMapMarkerAlt className="topbar-icon" />
            {site.address.line2 ? `${site.address.line1}, ${site.address.line2}` : site.address.line1}
          </span>

          <span className="topbar-divider" />

          <span className="topbar-item">
            <FaClock className="topbar-icon" />
            {site.hours}
          </span>
        </div>

        {/* Right: CTAs, phone, socials */}
        <div className="topbar-right">
          <NavLink to={siteConfig.links.registrationForm} className="topbar-btn">
            Registration Form
          </NavLink>

          <NavLink to={siteConfig.links.enquiry} className="topbar-btn topbar-btn-outline">
            Enquiry
          </NavLink>

          <a href={`tel:${site.phone}`} className="topbar-phone">
            <FaPhoneAlt />
            {site.phoneDisplay}
          </a>
        </div>

      </div>
    </div>
  );
};

export default TopBar;
