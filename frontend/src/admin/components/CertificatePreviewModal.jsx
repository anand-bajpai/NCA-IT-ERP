import { useState, useEffect, useRef } from "react";
import { FaPrint, FaMagic, FaFileDownload } from "react-icons/fa";
import Modal from "../../components/Modal/Modal";
import adminApi from "../api/adminApi";
import "./CertificatePreviewModal.css";

// The certificate HTML is a fixed A4-landscape sheet (297mm ≈ 1122px wide).
// We render the iframe at its natural size and scale it down to fit the
// modal, so phones/tablets see the whole certificate instead of scrollbars.
const SHEET_W = 1122;
const SHEET_H = 794;

const CertificatePreviewModal = ({ isOpen, onClose, certificate, onGenerated }) => {
  const [html, setHtml] = useState("");
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState("");
  const iframeRef = useRef(null);
  const frameWrapRef = useRef(null);
  const [scale, setScale] = useState(1);

  // Keep the sheet scaled to the wrapper's current width
  useEffect(() => {
    if (!isOpen) return;
    const el = frameWrapRef.current;
    if (!el) return;

    const update = () => setScale(el.clientWidth / SHEET_W);
    update();

    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [isOpen, html]);

  useEffect(() => {
    if (!isOpen || !certificate) return;

    let cancelled = false;
    setLoading(true);
    setError("");
    setHtml("");

    adminApi
      .get(`/certificates/${certificate._id}/preview`, { responseType: "text" })
      .then((res) => {
        if (!cancelled) setHtml(typeof res.data === "string" ? res.data : String(res.data));
      })
      .catch(() => {
        if (!cancelled) setError("Could not load certificate preview.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isOpen, certificate]);

  if (!isOpen || !certificate) return null;

  const handlePrint = () => {
    iframeRef.current?.contentWindow?.print();
  };

  const handleGeneratePdf = async () => {
    setGenerating(true);
    setError("");
    try {
      await adminApi.post(`/certificates/${certificate._id}/generate-pdf`);
      onGenerated?.();
    } catch (err) {
      setError(err.response?.data?.message || "Could not generate certificate PDF.");
    } finally {
      setGenerating(false);
    }
  };

  const handleDownloadPdf = async () => {
    setDownloading(true);
    setError("");
    try {
      const res = await adminApi.get(`/certificates/${certificate._id}/pdf`, { responseType: "blob" });
      const url = window.URL.createObjectURL(new Blob([res.data], { type: "application/pdf" }));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `${certificate.certificateNumber}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError("Could not download certificate PDF.");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="certificate-preview">
        <div className="certificate-preview-header">
          <div>
            <span className="certificate-preview-eyebrow">Certificate Preview</span>
            <h3>{certificate.certificateNumber}</h3>
          </div>
        </div>

        <div className="certificate-preview-frame-wrap" ref={frameWrapRef}>
          {loading && (
            <p className="certificate-preview-status">
              <span className="certificate-preview-spinner" aria-hidden="true" />
              Rendering certificate...
            </p>
          )}
          {!loading && html && (
            <iframe
              ref={iframeRef}
              title="Certificate Preview"
              srcDoc={html}
              className="certificate-preview-frame"
              style={{
                width: SHEET_W,
                height: SHEET_H,
                transform: `scale(${scale})`,
                transformOrigin: "top left",
              }}
            />
          )}
        </div>

        {error && <p className="form-status error">{error}</p>}

        <div className="certificate-preview-actions">
          <button type="button" className="ghost" onClick={handlePrint} disabled={loading || !html}>
            <FaPrint /> Print
          </button>
          <button type="button" className="accent" onClick={handleGeneratePdf} disabled={generating}>
            <FaMagic /> {generating ? "Generating..." : "Generate PDF"}
          </button>
          <button type="button" onClick={handleDownloadPdf} disabled={downloading}>
            <FaFileDownload /> {downloading ? "Downloading..." : "Download PDF"}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default CertificatePreviewModal;
