import { useState, useRef, useEffect } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  FaBars,
  FaTimes,
  FaChevronDown,
  FaWhatsapp,
  FaInstagram,
  FaLinkedinIn,
} from "react-icons/fa";

import { navLinks } from "../../data/navLinks";
import { useInstituteSettings } from "../../context/InstituteSettingsContext";

import TopBar from "./TopBar";
import "./Navbar.css";

const Navbar = () => {
  const site = useInstituteSettings();
  const [menuOpen, setMenuOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState(null);
  const dropdownRef = useRef(null);
  const { pathname } = useLocation();

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const closeAll = () => {
    setMenuOpen(false);
    setOpenDropdown(null);
  };

  return (
    <header className="site-header">
      <TopBar />

      <nav className="navbar">
        <div className="navbar-container">

          {/* Logo */}
          <div className="logo">
            <NavLink to="/" className="logo-wrapper" onClick={closeAll}>
              {site.logo && <img src={site.logo} alt={site.companyName} className="logo-icon" />}
              <span className="logo-text">
                <span className="logo-name">
                  NCA <span className="logo-name-accent">IT SOLUTIONS</span>
                </span>
                <span className="logo-tagline">
                  Innovate . Connect . Accelerate
                </span>
              </span>
            </NavLink>
          </div>

          {/* Desktop Navigation */}
          <ul
            className={menuOpen ? "nav-links active" : "nav-links"}
            ref={dropdownRef}
          >
            {navLinks.map((link) => (
              <li
                key={link.path}
                className={link.children ? "has-dropdown" : ""}
              >
                {link.children ? (
                  <>
                    <button
                      type="button"
                      className={[
                        "nav-link",
                        "dropdown-toggle",
                        openDropdown === link.title ? "open" : "",
                        pathname.startsWith(link.path) ? "active-link" : "",
                      ]
                        .filter(Boolean)
                        .join(" ")}
                      onClick={() =>
                        setOpenDropdown(
                          openDropdown === link.title ? null : link.title
                        )
                      }
                    >
                      {link.title}
                      <FaChevronDown className="chevron" />
                    </button>

                    <ul
                      className={
                        openDropdown === link.title
                          ? "dropdown-menu open"
                          : "dropdown-menu"
                      }
                    >
                      {link.children.map((child) => (
                        <li key={child.path}>
                          <NavLink
                            to={child.path}
                            className="dropdown-link"
                            onClick={closeAll}
                          >
                            {child.title}
                          </NavLink>
                        </li>
                      ))}
                    </ul>
                  </>
                ) : (
                  <NavLink
                    to={link.path}
                    end={link.path === "/"}
                    className={({ isActive }) =>
                      isActive ? "nav-link active-link" : "nav-link"
                    }
                    onClick={closeAll}
                  >
                    {link.title}
                  </NavLink>
                )}
              </li>
            ))}

            {/* Mobile-only quick contact icons */}
            <li className="mobile-quick-icons">
              <a href={site.social.whatsapp} target="_blank" rel="noreferrer" aria-label="WhatsApp">
                <FaWhatsapp />
              </a>
              <a href={site.social.instagram} target="_blank" rel="noreferrer" aria-label="Instagram">
                <FaInstagram />
              </a>
              <a href={site.social.linkedin} target="_blank" rel="noreferrer" aria-label="LinkedIn">
                <FaLinkedinIn />
              </a>
            </li>
          </ul>

          {/* Quick-access icons (desktop) + CTA */}
          <div className="nav-btn">
            <div className="quick-icons">
              <a
                href={site.social.whatsapp}
                target="_blank"
                rel="noreferrer"
                aria-label="Chat on WhatsApp"
                className="quick-icon whatsapp"
              >
                <FaWhatsapp />
              </a>
              <a
                href={site.social.instagram}
                target="_blank"
                rel="noreferrer"
                aria-label="Follow on Instagram"
                className="quick-icon instagram"
              >
                <FaInstagram />
              </a>
              <a
                href={site.social.linkedin}
                target="_blank"
                rel="noreferrer"
                aria-label="Follow on LinkedIn"
                className="quick-icon linkedin"
              >
                <FaLinkedinIn />
              </a>
            </div>

            <NavLink to="/contact" className="btn-primary">
              Get Started
            </NavLink>
          </div>

          {/* Mobile Menu Button */}
          <div className="menu-icon" onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <FaTimes /> : <FaBars />}
          </div>

        </div>
      </nav>
    </header>
  );
};

export default Navbar;
