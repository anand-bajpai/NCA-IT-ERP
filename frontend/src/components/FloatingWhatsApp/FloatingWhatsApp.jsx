import { FaWhatsapp } from "react-icons/fa";
import siteConfig from "../../config/siteConfig";
import "./FloatingWhatsApp.css";

const FloatingWhatsApp = () => {
  return (
    <a
      href={siteConfig.social.whatsapp}
      target="_blank"
      rel="noreferrer"
      className="floating-whatsapp"
      aria-label="Chat with us on WhatsApp"
    >
      <FaWhatsapp />
    </a>
  );
};

export default FloatingWhatsApp;
