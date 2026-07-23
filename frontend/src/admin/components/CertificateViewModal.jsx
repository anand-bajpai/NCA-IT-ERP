import Modal from "../../components/Modal/Modal";
import "./CertificateViewModal.css";

const formatDate = (d) => (d ? new Date(d).toLocaleDateString("en-IN") : "—");

const CertificateViewModal = ({ isOpen, onClose, certificate }) => {
  if (!isOpen || !certificate) return null;

  const identityRows = [
    ["Verification ID", certificate.verificationId],
    ["Admission Number", certificate.admissionNumber || "—"],
    ["Student", certificate.studentName],
    ["Father's Name", certificate.fatherName || "—"],
    ["Mobile", certificate.mobile || "—"],
    ["Email", certificate.email || "—"],
  ];

  const programRows = [
    ["Course / Project", certificate.course],
    ["Technology", certificate.technology || "—"],
    ["Duration", certificate.duration || "—"],
    ["Grade", certificate.grade || "—"],
    ["Certificate Type", certificate.certificateType],
  ];

  const dateRows = [
    ["Joining Date", formatDate(certificate.joiningDate)],
    ["Start Date", formatDate(certificate.startDate)],
    ["End Date", formatDate(certificate.endDate)],
    ["Issue Date", formatDate(certificate.issueDate)],
  ];

  const noteRows = [
    ...(certificate.status === "Revoked" && certificate.revokedReason
      ? [["Revoke Reason", certificate.revokedReason]]
      : []),
    ...(certificate.description ? [["Description", certificate.description]] : []),
  ];

  const renderRows = (rows) =>
    rows.map(([label, value]) => (
      <div className="certificate-view-row" key={label}>
        <span className="certificate-view-label">{label}</span>
        <span className="certificate-view-value">{value}</span>
      </div>
    ));

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="certificate-view">
        <div className="certificate-view-header">
          <div>
            <span className="certificate-view-eyebrow">Certificate</span>
            <h3>{certificate.certificateNumber}</h3>
          </div>
          <span className={`status-badge status-${certificate.status.toLowerCase()}`}>
            {certificate.status}
          </span>
        </div>

        <div className="certificate-view-body">
          <div className="certificate-view-details">
            <div className="certificate-view-group">
              <h4>Recipient</h4>
              {renderRows(identityRows)}
            </div>

            <div className="certificate-view-group">
              <h4>Program</h4>
              {renderRows(programRows)}
            </div>

            <div className="certificate-view-group">
              <h4>Dates</h4>
              {renderRows(dateRows)}
            </div>

            {noteRows.length > 0 && (
              <div className="certificate-view-group">
                <h4>Notes</h4>
                {renderRows(noteRows)}
              </div>
            )}
          </div>

          {certificate.qrCode && (
            <div className="certificate-view-qr">
              <img src={certificate.qrCode} alt="Certificate QR Code" />
              <p>Scan to verify</p>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default CertificateViewModal;
