import { useState, useEffect, useRef } from "react";
import { useSearchParams, useParams } from "react-router-dom";
import axios from "axios";
import {
  FaSearch,
  FaCheckCircle,
  FaTimesCircle,
  FaUserCircle,
  FaCertificate,
  FaFilePdf,
  FaPrint,
  FaExclamationTriangle,
} from "react-icons/fa";
import siteConfig from "../../config/siteConfig";
import "./CertificateVerification.css";

// Natural pixel size of the A4-landscape certificate sheet (297mm × 210mm).
// The preview iframe renders at this size and is scaled down to fit its box.
const SHEET_W = 1122;
const SHEET_H = 794;

const statusMeta = {
  Valid: { label: "Certificate Valid", className: "valid", Icon: FaCheckCircle },
  Expired: { label: "Certificate Expired", className: "expired", Icon: FaExclamationTriangle },
  Revoked: { label: "Certificate Revoked", className: "revoked", Icon: FaTimesCircle },
  Reissued: { label: "Certificate Reissued", className: "expired", Icon: FaExclamationTriangle },
};

const CertificateVerification = () => {
  const [searchParams] = useSearchParams();
  const { verificationId: verificationIdFromPath } = useParams();
  const [query, setQuery] = useState(verificationIdFromPath || searchParams.get("id") || "");
  const [status, setStatus] = useState("idle"); // idle | loading | found | notfound | error
  const [result, setResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [downloading, setDownloading] = useState(false);
  const [institute, setInstitute] = useState(null);
  const [previewHtml, setPreviewHtml] = useState("");
  const printFrameRef = useRef(null);
  const previewWrapRef = useRef(null);
  const [previewScale, setPreviewScale] = useState(1);

  // Keep the certificate preview scaled to its container's width
  useEffect(() => {
    const el = previewWrapRef.current;
    if (!el) return;

    const update = () => setPreviewScale(el.clientWidth / SHEET_W);
    update();

    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [previewHtml]);

  // Institute branding (logo/name) for the verification result card
  useEffect(() => {
    axios
      .get(`${siteConfig.apiBaseUrl}/api/settings/public`)
      .then((res) => setInstitute(res.data.data))
      .catch(() => {}); // branding is decorative — never block verification
  }, []);

  const runVerification = async (value) => {
    const q = value.trim();
    if (!q) return;

    setStatus("loading");
    setErrorMsg("");
    try {
      const res = await axios.get(`${siteConfig.apiBaseUrl}/api/certificates/verify`, {
        params: { query: q },
      });
      const data = res.data.data;
      setResult(data);
      setStatus("found");

      // Certificate preview — only fetched (and only served by the backend)
      // for a currently-Valid certificate, after successful verification.
      setPreviewHtml("");
      if (data.status === "Valid" && data.verificationId) {
        try {
          const previewRes = await axios.get(
            `${siteConfig.apiBaseUrl}/api/certificates/${encodeURIComponent(data.verificationId)}/preview`,
            { responseType: "text" }
          );
          setPreviewHtml(typeof previewRes.data === "string" ? previewRes.data : "");
        } catch {
          // Preview is an enhancement — verification result still stands without it.
        }
      }
    } catch (err) {
      setPreviewHtml("");
      setResult(null);
      setStatus("notfound");
      setErrorMsg(err.response?.data?.message || "Invalid Certificate. No Record Found.");
    }
  };

  // Auto-verify if arriving from a scanned QR code (path param or ?id=...)
  useEffect(() => {
    const idFromPath = verificationIdFromPath;
    const idFromQuery = searchParams.get("id");
    const idToVerify = idFromPath || idFromQuery;
    if (idToVerify) runVerification(idToVerify);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    runVerification(query);
  };

  // Gated download: this is the ONLY way the public can ever get a PDF —
  // there is no static/direct link. The backend re-checks the certificate's
  // live status before streaming anything.
  const handleDownloadPdf = async () => {
    if (!result?.verificationId) return;
    setDownloading(true);
    try {
      const res = await axios.get(
        `${siteConfig.apiBaseUrl}/api/certificates/${encodeURIComponent(result.verificationId)}/pdf`,
        { responseType: "blob" }
      );
      const url = window.URL.createObjectURL(new Blob([res.data], { type: "application/pdf" }));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `${result.certificateNumber}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert(err.response?.data?.message || "Could not download this certificate's PDF.");
    } finally {
      setDownloading(false);
    }
  };

  // Print: loads the status-gated PDF into a hidden iframe and triggers the
  // browser print dialog. Same secure endpoint as download — never a direct URL.
  const handlePrint = async () => {
    if (!result?.verificationId) return;
    try {
      const res = await axios.get(
        `${siteConfig.apiBaseUrl}/api/certificates/${encodeURIComponent(result.verificationId)}/pdf`,
        { responseType: "blob" }
      );
      const url = window.URL.createObjectURL(new Blob([res.data], { type: "application/pdf" }));
      const frame = printFrameRef.current;
      if (frame) {
        frame.onload = () => frame.contentWindow?.print();
        frame.src = url;
      }
    } catch (err) {
      alert(err.response?.data?.message || "Could not open this certificate for printing.");
    }
  };

  return (
    <section className="cert-verify">
      {/* Hidden frame used only for the Print action */}
      <iframe ref={printFrameRef} title="Certificate Print" style={{ display: "none" }} />
      <div className="cert-verify-container">
        <div className="cert-verify-heading">
          {institute?.logo ? (
            <img
              src={`${siteConfig.apiBaseUrl}${institute.logo}`}
              alt={institute.instituteName || "Institute logo"}
              className="cert-verify-logo"
            />
          ) : (
            <FaCertificate className="cert-verify-icon" />
          )}
          <span className="cert-verify-eyebrow">Official Verification Portal</span>
          <h1>Certificate Verification</h1>
          <p>
            Enter the Certificate Number or Verification ID printed on your NCA IT
            Solution certificate to instantly confirm its authenticity.
          </p>
        </div>

        <form className="cert-verify-form" onSubmit={handleSubmit}>
          <div className="cert-verify-input">
            <FaSearch />
            <input
              type="text"
              placeholder="e.g. NCA-CERT-2026-0001 or NCA-VR-8F2C1A9D"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <button type="submit" disabled={status === "loading"}>
            {status === "loading" ? "Verifying..." : "Verify"}
          </button>
        </form>

        {status === "loading" && (
          <div className="cert-result loading">
            <span className="cert-verify-spinner" aria-hidden="true" />
            <p>Verifying certificate…</p>
          </div>
        )}

        {status === "notfound" && (
          <div className="cert-result invalid">
            <FaTimesCircle className="result-icon" />
            <h3>Invalid Certificate</h3>
            <p>{errorMsg}</p>
          </div>
        )}

        {status === "found" && result && (
          <div className={`cert-result found ${statusMeta[result.status]?.className || ""}`}>
            <div className="cert-result-top">
              {result.photo ? (
                <img
                  src={`${siteConfig.apiBaseUrl}${result.photo}`}
                  alt={result.studentName}
                  className="cert-result-photo"
                />
              ) : (
                <FaUserCircle className="cert-result-photo-placeholder" />
              )}

              <div>
                <span className={`cert-status-badge ${statusMeta[result.status]?.className || ""}`}>
                  {(() => {
                    const Icon = statusMeta[result.status]?.Icon || FaCheckCircle;
                    return <Icon />;
                  })()}
                  {statusMeta[result.status]?.label || result.status}
                </span>
                <h2>{result.studentName}</h2>
                <p className="cert-course">{result.course}</p>
              </div>

              {result.qrCode && <img src={result.qrCode} alt="QR Code" className="cert-result-qr" />}
            </div>

            <div className="cert-result-grid">
              <div>
                <span>Certificate Number</span>
                <strong>{result.certificateNumber}</strong>
              </div>
              <div>
                <span>Verification ID</span>
                <strong>{result.verificationId}</strong>
              </div>
              <div>
                <span>Duration</span>
                <strong>{result.duration || "—"}</strong>
              </div>
              <div>
                <span>Issue Date</span>
                <strong>{result.issueDate ? new Date(result.issueDate).toLocaleDateString("en-IN") : "—"}</strong>
              </div>
              <div>
                <span>Certificate Type</span>
                <strong>{result.certificateType}</strong>
              </div>
              {result.grade && (
                <div>
                  <span>Grade</span>
                  <strong>{result.grade}</strong>
                </div>
              )}
            </div>

            {result.status === "Revoked" && (
              <div className="cert-revoked-banner">
                <FaExclamationTriangle />
                <div>
                  <strong>⚠ Certificate Revoked</strong>
                  <p>This certificate has been revoked and is no longer valid. Downloads are disabled.</p>
                </div>
              </div>
            )}

            {previewHtml && (
              <div className="cert-preview-wrap">
                <h3>Certificate Preview</h3>
                <div className="cert-preview-box" ref={previewWrapRef}>
                  <iframe
                    title="Certificate Preview"
                    srcDoc={previewHtml}
                    className="cert-preview-frame"
                    sandbox=""
                    style={{
                      width: SHEET_W,
                      height: SHEET_H,
                      transform: `scale(${previewScale})`,
                      transformOrigin: "top left",
                    }}
                  />
                </div>
              </div>
            )}

            <p className="cert-verified-note">
              Verified against the official {institute?.instituteName || "NCA IT Solution"} records
              on {new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" })}.
            </p>

            {/* Download & Print are enabled ONLY after successful verification
                of a currently-Valid certificate. */}
            {result.status === "Valid" && (
              <div className="cert-result-actions">
                <button
                  type="button"
                  className="cert-download-pdf-btn"
                  onClick={handleDownloadPdf}
                  disabled={downloading}
                >
                  <FaFilePdf /> {downloading ? "Preparing PDF..." : "Download Certificate PDF"}
                </button>
                <button type="button" className="cert-print-btn" onClick={handlePrint}>
                  <FaPrint /> Print Certificate
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
};

export default CertificateVerification;
