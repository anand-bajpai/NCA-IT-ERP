import Modal from "../../components/Modal/Modal";
import "./EnquiryViewModal.css";

const Field = ({ label, value }) => (
  <div className="view-field">
    <span className="view-field-label">{label}</span>
    <span className="view-field-value">{value || "—"}</span>
  </div>
);

const EnquiryViewModal = ({ isOpen, onClose, enquiry }) => {
  if (!enquiry) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="enquiry-view-panel">
        <h3>Enquiry Details</h3>

        <div className="view-grid">
          <Field label="Full Name" value={enquiry.fullName} />
          <Field label="Phone" value={enquiry.phone} />
          <Field label="Email" value={enquiry.email} />
          <Field label="Course Interested In" value={enquiry.course} />
          <Field label="Inquiry Type" value={enquiry.inquiryType} />
          <Field label="Preferred Contact Method" value={enquiry.contactMethod} />
          <Field label="Source" value={enquiry.source || "Website"} />
          <Field label="Budget Range" value={enquiry.budget} />
          <Field
            label="Received On"
            value={enquiry.createdAt ? new Date(enquiry.createdAt).toLocaleString() : ""}
          />
          <Field
            label="Status"
            value={
              <span className={`view-status-badge status-${enquiry.status.toLowerCase().replace(/\s+/g, "-")}`}>
                {enquiry.status}
              </span>
            }
          />
        </div>

        <div className="view-field view-message">
          <span className="view-field-label">Message / Notes</span>
          <p className="view-message-text">{enquiry.message || "—"}</p>
        </div>

        {enquiry.convertedToStudent && (
          <div className="view-converted-note">
            ✅ Converted to Admission — {enquiry.convertedToStudent.fullName}
            {enquiry.convertedToStudent.admissionNumber && ` (${enquiry.convertedToStudent.admissionNumber})`}
            {enquiry.convertedAt && ` on ${new Date(enquiry.convertedAt).toLocaleDateString()}`}
          </div>
        )}

        <div className="view-followups">
          <span className="view-field-label">Follow-up History</span>
          {(!enquiry.followUps || enquiry.followUps.length === 0) ? (
            <p className="followup-empty">No follow-ups logged yet.</p>
          ) : (
            [...enquiry.followUps].reverse().map((f, idx) => (
              <div className="followup-item" key={f._id || idx}>
                <p className="followup-note">{f.note}</p>
                <div className="followup-meta">
                  <span>{new Date(f.createdAt).toLocaleString()}</span>
                  {f.nextFollowUpDate && (
                    <span className="followup-next">
                      Next: {new Date(f.nextFollowUpDate).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </Modal>
  );
};

export default EnquiryViewModal;
