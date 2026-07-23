import { useState, useEffect, useRef } from "react";
import { FaPrint, FaMagic, FaFileDownload } from "react-icons/fa";
import Modal from "../../components/Modal/Modal";
import adminApi from "../api/adminApi";
import "./IdCardPreviewModal.css";

// The ID card sheet (front + back, portrait 54mm x 85.6mm cards) is a
// fixed 62mm x 190mm page. We render the iframe at its natural pixel size
// and scale it down to fit the modal — same approach as
// CertificatePreviewModal — so the whole sheet is visible instead of
// scrollbars, on phones too.
const SHEET_W = 234; // 62mm @ ~96dpi-ish CSS px, matches the card's aspect ratio
const SHEET_H = 718; // 190mm

const IdCardPreviewModal = ({ isOpen, onClose, idCard, onGenerated }) => {
  const [html, setHtml] = useState("");
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState("");
  const iframeRef = useRef(null);
  const frameWrapRef = useRef(null);
  const [scale, setScale] = useState(1);

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
    if (!isOpen || !idCard) return;

    let cancelled = false;
    setLoading(true);
    setError("");
    setHtml("");

    adminApi
      .get(`/id-cards/${idCard._id}/preview`, { responseType: "text" })
      .then((res) => {
        if (!cancelled) setHtml(typeof res.data === "string" ? res.data : String(res.data));
      })
      .catch(() => {
        if (!cancelled) setError("Could not load ID card preview.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isOpen, idCard]);

  if (!isOpen || !idCard) return null;

  const handlePrint = () => {
    iframeRef.current?.contentWindow?.print();
  };

  const handleGeneratePdf = async () => {
    setGenerating(true);
    setError("");
    try {
      await adminApi.post(`/id-cards/${idCard._id}/generate-pdf`);
      onGenerated?.();
    } catch (err) {
      setError(err.response?.data?.message || "Could not generate the ID card PDF.");
    } finally {
      setGenerating(false);
    }
  };

  const handleDownloadPdf = async () => {
    setDownloading(true);
    setError("");
    try {
      const res = await adminApi.get(`/id-cards/${idCard._id}/pdf`, { responseType: "blob" });
      const url = window.URL.createObjectURL(new Blob([res.data], { type: "application/pdf" }));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `${idCard.idCardNumber}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      onGenerated?.();
    } catch (err) {
      setError("Could not download the ID card PDF.");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="idcard-preview">
        <div className="idcard-preview-header">
          <div>
            <span className="idcard-preview-eyebrow">ID Card Preview</span>
            <h3>{idCard.idCardNumber}</h3>
          </div>
        </div>

        <div className="idcard-preview-frame-wrap" ref={frameWrapRef}>
          {loading && (
            <p className="idcard-preview-status">
              <span className="idcard-preview-spinner" aria-hidden="true" />
              Rendering ID card...
            </p>
          )}
          {!loading && html && (
            <iframe
              ref={iframeRef}
              title="ID Card Preview"
              srcDoc={html}
              className="idcard-preview-frame"
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

        <div className="idcard-preview-actions">
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

export default IdCardPreviewModal;
