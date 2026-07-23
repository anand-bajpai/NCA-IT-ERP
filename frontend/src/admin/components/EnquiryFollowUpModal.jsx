import { useState } from "react";
import Modal from "../../components/Modal/Modal";
import adminApi from "../api/adminApi";
import "./EnquiryFollowUpModal.css";

const EnquiryFollowUpModal = ({ isOpen, onClose, onSaved, enquiry }) => {
  const [note, setNote] = useState("");
  const [nextFollowUpDate, setNextFollowUpDate] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  if (!enquiry) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      await adminApi.post(`/enquiries/${enquiry._id}/followups`, {
        note,
        nextFollowUpDate: nextFollowUpDate || undefined,
      });
      setNote("");
      setNextFollowUpDate("");
      onSaved();
    } catch (err) {
      setError(err.response?.data?.message || "Could not add follow-up.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="followup-panel">
        <h3>Follow-up — {enquiry.fullName}</h3>

        <div className="followup-history">
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

        <form className="followup-form" onSubmit={handleSubmit}>
          <textarea
            placeholder="What happened on this follow-up? (call, visit, message...)"
            rows={3}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            required
          />
          <label className="field-label">
            Next Follow-up Date (optional)
            <input
              type="date"
              value={nextFollowUpDate}
              onChange={(e) => setNextFollowUpDate(e.target.value)}
            />
          </label>

          {error && <p className="form-status error">{error}</p>}

          <button type="submit" disabled={saving}>
            {saving ? "Saving..." : "Add Follow-up"}
          </button>
        </form>
      </div>
    </Modal>
  );
};

export default EnquiryFollowUpModal;
