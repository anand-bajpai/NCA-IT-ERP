import { useState, useEffect } from "react";
import { FaDownload, FaEnvelope, FaWhatsapp, FaHistory } from "react-icons/fa";
import Modal from "../../components/Modal/Modal";
import adminApi from "../api/adminApi";
import "./CertificateHistoryModal.css";

const formatDateTime = (d) =>
  d ? new Date(d).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }) : "—";

// Admin audit view: how many times a certificate PDF was downloaded (and by
// whom — IP / device), plus email + WhatsApp send tracking.
const CertificateHistoryModal = ({ isOpen, onClose, certificate }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isOpen || !certificate) return;

    let cancelled = false;
    setLoading(true);
    setError("");
    setData(null);

    adminApi
      .get(`/certificates/${certificate._id}/download-history`)
      .then((res) => {
        if (!cancelled) setData(res.data.data);
      })
      .catch((err) => {
        if (!cancelled) setError(err.response?.data?.message || "Could not load history.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isOpen, certificate]);

  if (!isOpen || !certificate) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="certificate-history">
        <div className="certificate-history-header">
          <span className="certificate-history-eyebrow"><FaHistory /> Activity History</span>
          <h3>{certificate.certificateNumber}</h3>
          <p>{certificate.studentName}</p>
        </div>

        {loading && (
          <p className="certificate-history-status">
            <span className="certificate-history-spinner" aria-hidden="true" />
            Loading history...
          </p>
        )}
        {error && <p className="certificate-history-status error">{error}</p>}

        {data && (
          <>
            <div className="certificate-history-stats">
              <div>
                <span><FaDownload /> PDF Downloads</span>
                <strong>{data.downloadCount}</strong>
                <small>Last: {formatDateTime(data.lastDownloadedAt)}</small>
              </div>
              <div>
                <span><FaEnvelope /> Emails Sent</span>
                <strong>{data.emailSentCount}</strong>
                <small>
                  {data.emailLastSentTo ? `To ${data.emailLastSentTo} — ` : ""}
                  {formatDateTime(data.emailLastSentAt)}
                </small>
              </div>
              <div>
                <span><FaWhatsapp /> WhatsApp Shares</span>
                <strong>{data.whatsappSharedCount}</strong>
                <small>Last: {formatDateTime(data.whatsappLastSharedAt)}</small>
              </div>
            </div>

            <h4>Recent Downloads</h4>
            {data.history.length === 0 ? (
              <p className="certificate-history-empty">No downloads recorded yet.</p>
            ) : (
              <div className="certificate-history-table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>When</th>
                      <th>Source</th>
                      <th>IP</th>
                      <th>Device</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.history.map((h, i) => (
                      <tr key={i}>
                        <td>{formatDateTime(h.downloadedAt)}</td>
                        <td>{h.source}</td>
                        <td>{h.ip || "—"}</td>
                        <td className="certificate-history-ua">{h.userAgent || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>
    </Modal>
  );
};

export default CertificateHistoryModal;
