import { useEffect } from "react";
import { FaCheckCircle, FaExclamationCircle, FaTimes } from "react-icons/fa";
import "./Toast.css";

// Minimal, dependency-free toast — used by AdminInstituteSettings (and any
// future admin page) for save/error feedback.
// Usage: <Toast message="Saved!" type="success" onClose={() => setToast(null)} />
const Toast = ({ message, type = "success", onClose, duration = 3500 }) => {
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [message, duration, onClose]);

  if (!message) return null;

  return (
    <div className={`admin-toast admin-toast-${type}`} role="status">
      <span className="admin-toast-icon">
        {type === "success" ? <FaCheckCircle /> : <FaExclamationCircle />}
      </span>
      <span className="admin-toast-message">{message}</span>
      <button className="admin-toast-close" onClick={onClose} aria-label="Dismiss">
        <FaTimes />
      </button>
    </div>
  );
};

export default Toast;
