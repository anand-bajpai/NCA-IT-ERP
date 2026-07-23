import { useState, useEffect, useCallback, useRef } from "react";
import {
  FaBuilding,
  FaAddressCard,
  FaFileInvoice,
  FaImage,
  FaShareAlt,
  FaSignature,
  FaUniversity,
  FaEye,
  FaSave,
  FaUndo,
  FaLock,
  FaUpload,
  FaTrash,
} from "react-icons/fa";
import adminApi from "../api/adminApi";
import siteConfig from "../../config/siteConfig";
import { useAdminAuth } from "../context/AdminAuthContext";
import { useInstituteSettings } from "../../context/InstituteSettingsContext";
import Toast from "../components/Toast";
import "./AdminInstituteSettings.css";

const emptyForm = {
  instituteName: "",
  GSTNumber: "",
  PANNumber: "",
  Address: "",
  Phone: "",
  AlternatePhone: "",
  Email: "",
  Website: "",
  DirectorName: "",
  Facebook: "",
  Instagram: "",
  LinkedIn: "",
  YouTube: "",
  Twitter: "",
  WhatsApp: "",
  BankAccountName: "",
  BankName: "",
  BankAccountNumber: "",
  BankIFSC: "",
  BankBranch: "",
  BankUPIId: "",
};

const IMAGE_FIELDS = [
  { key: "logo", label: "Institute Logo", hint: "Square logo, JPG/PNG/WEBP/SVG, max 2MB" },
  { key: "favicon", label: "Favicon", hint: "Small icon for browser tab, max 2MB" },
  { key: "AuthorizedSignature", label: "Authorized Signature", hint: "Transparent PNG recommended, max 2MB" },
  { key: "InstituteStamp", label: "Institute Stamp", hint: "Round/square stamp image, max 2MB" },
];

const absoluteUrl = (path) => (path ? `${siteConfig.apiBaseUrl}${path}` : "");

const AdminInstituteSettings = () => {
  const { admin } = useAdminAuth();
  const canEdit = admin?.role === "superadmin";
  const { refresh: refreshLiveSettings } = useInstituteSettings();

  const [form, setForm] = useState(emptyForm);
  const [savedForm, setSavedForm] = useState(emptyForm);
  const [existingImages, setExistingImages] = useState({});
  const [newFiles, setNewFiles] = useState({});
  const [previews, setPreviews] = useState({});
  const [removeLogo, setRemoveLogo] = useState(false);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [toast, setToast] = useState(null);

  const fileInputRefs = useRef({});

  const fetchSettings = useCallback(async () => {
    setLoading(true);
    setLoadError("");
    try {
      const res = await adminApi.get("/settings/institute");
      const data = res.data.data || {};
      const nextForm = { ...emptyForm };
      Object.keys(emptyForm).forEach((key) => {
        if (data[key] !== undefined) nextForm[key] = data[key];
      });
      setForm(nextForm);
      setSavedForm(nextForm);
      setExistingImages({
        logo: data.logo || "",
        favicon: data.favicon || "",
        AuthorizedSignature: data.AuthorizedSignature || "",
        InstituteStamp: data.InstituteStamp || "",
      });
      setRemoveLogo(false);
    } catch (err) {
      setLoadError(err.response?.data?.message || "Could not load institute settings.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  // Revoke object URLs on unmount to avoid memory leaks
  useEffect(() => {
    return () => {
      Object.values(previews).forEach((url) => url && URL.revokeObjectURL(url));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (key, file) => {
    if (!file) return;
    if (key === "logo") setRemoveLogo(false);
    setNewFiles((prev) => ({ ...prev, [key]: file }));
    setPreviews((prev) => ({ ...prev, [key]: URL.createObjectURL(file) }));
  };

  // Marks the logo for removal — actually applied when the form is saved,
  // same as every other change on this page.
  const handleRemoveLogo = () => {
    setRemoveLogo(true);
    setNewFiles((prev) => {
      const { logo, ...rest } = prev;
      return rest;
    });
    setPreviews((prev) => {
      if (prev.logo) URL.revokeObjectURL(prev.logo);
      const { logo, ...rest } = prev;
      return rest;
    });
    if (fileInputRefs.current.logo) fileInputRefs.current.logo.value = "";
  };

  const validate = () => {
    const errs = {};
    if (form.GSTNumber && !/^[0-9A-Za-z]{15}$/.test(form.GSTNumber)) {
      errs.GSTNumber = "GST Number must be exactly 15 characters.";
    }
    if (form.PANNumber && !/^[A-Za-z]{5}[0-9]{4}[A-Za-z]$/.test(form.PANNumber)) {
      errs.PANNumber = "PAN must be in the format ABCDE1234F.";
    }
    if (form.Email && !/^\S+@\S+\.\S+$/.test(form.Email)) {
      errs.Email = "Enter a valid email address.";
    }
    if (form.Website && !/^https?:\/\/.+/.test(form.Website)) {
      errs.Website = "Website must start with http:// or https://";
    }
    if (form.BankIFSC && !/^[A-Za-z]{4}0[A-Z0-9a-z]{6}$/.test(form.BankIFSC)) {
      errs.BankIFSC = "Enter a valid 11-character IFSC code.";
    }
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!canEdit) return;
    if (!validate()) {
      setToast({ type: "error", message: "Please fix the highlighted fields before saving." });
      return;
    }

    setSaving(true);
    try {
      const data = new FormData();
      Object.entries(form).forEach(([key, value]) => data.append(key, value ?? ""));
      Object.entries(newFiles).forEach(([key, file]) => data.append(key, file));
      data.append("removeLogo", removeLogo ? "true" : "false");

      const res = await adminApi.put("/settings/institute", data);
      const saved = res.data.data || {};

      const nextForm = { ...emptyForm };
      Object.keys(emptyForm).forEach((key) => {
        if (saved[key] !== undefined) nextForm[key] = saved[key];
      });
      setForm(nextForm);
      setSavedForm(nextForm);
      setExistingImages({
        logo: saved.logo || "",
        favicon: saved.favicon || "",
        AuthorizedSignature: saved.AuthorizedSignature || "",
        InstituteStamp: saved.InstituteStamp || "",
      });
      setNewFiles({});
      setPreviews({});
      setRemoveLogo(false);
      setToast({ type: "success", message: "Institute settings saved successfully." });

      // Logo / Website (and everything else here) are read from this same
      // record by the admin sidebar and the public site — refresh that
      // shared context now so the change appears immediately, everywhere.
      refreshLiveSettings();
    } catch (err) {
      setToast({
        type: "error",
        message: err.response?.data?.message || "Could not save institute settings.",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setForm(savedForm);
    setNewFiles({});
    setFieldErrors({});
    setRemoveLogo(false);
    Object.values(previews).forEach((url) => url && URL.revokeObjectURL(url));
    setPreviews({});
    Object.values(fileInputRefs.current).forEach((input) => input && (input.value = ""));
  };

  const imageSrc = (key) => {
    if (key === "logo" && removeLogo) return "";
    return previews[key] || absoluteUrl(existingImages[key]);
  };

  if (loading) {
    return (
      <div className="settings-page">
        <div className="settings-loading">Loading institute settings…</div>
      </div>
    );
  }

  return (
    <div className="settings-page">
      <div className="settings-header">
        <div>
          <h1>Institute Settings</h1>
          <p className="settings-subtitle">
            These details automatically appear on fee receipts, certificates, the verification page,
            website footer, navbar, contact page and outgoing emails.
          </p>
        </div>

        {!canEdit && (
          <span className="settings-view-only-badge">
            <FaLock /> View only — Super Admin can edit
          </span>
        )}
      </div>

      {loadError && <div className="settings-alert settings-alert-error">{loadError}</div>}

      <form onSubmit={handleSave}>
        <fieldset disabled={!canEdit} className="settings-fieldset">
          <div className="settings-grid">
            {/* ---------- Contact Information ---------- */}
            <section className="settings-card">
              <h2><FaAddressCard /> Contact Information</h2>
              <div className="settings-field-grid">
                <label className="settings-field">
                  Institute Name
                  <input name="instituteName" value={form.instituteName} onChange={handleChange} placeholder="e.g. NCA IT Solution" />
                </label>
                <label className="settings-field">
                  Director Name
                  <input name="DirectorName" value={form.DirectorName} onChange={handleChange} />
                </label>
                <label className="settings-field">
                  Phone Number
                  <input name="Phone" value={form.Phone} onChange={handleChange} />
                </label>
                <label className="settings-field">
                  Alternate Phone
                  <input name="AlternatePhone" value={form.AlternatePhone} onChange={handleChange} />
                </label>
                <label className="settings-field">
                  Email
                  <input name="Email" type="email" value={form.Email} onChange={handleChange} />
                  {fieldErrors.Email && <span className="settings-field-error">{fieldErrors.Email}</span>}
                </label>
                <label className="settings-field">
                  Website URL
                  <input name="Website" value={form.Website} onChange={handleChange} placeholder="https://example.com" />
                  {fieldErrors.Website && <span className="settings-field-error">{fieldErrors.Website}</span>}
                </label>
                <label className="settings-field settings-field-wide">
                  Full Address
                  <textarea name="Address" rows={2} value={form.Address} onChange={handleChange} />
                </label>
              </div>
            </section>

            {/* ---------- Tax Information ---------- */}
            <section className="settings-card">
              <h2><FaFileInvoice /> Tax Information</h2>
              <div className="settings-field-grid">
                <label className="settings-field">
                  GST Number
                  <input name="GSTNumber" value={form.GSTNumber} onChange={handleChange} placeholder="15-character GSTIN" style={{ textTransform: "uppercase" }} />
                  {fieldErrors.GSTNumber && <span className="settings-field-error">{fieldErrors.GSTNumber}</span>}
                </label>
                <label className="settings-field">
                  PAN Number
                  <input name="PANNumber" value={form.PANNumber} onChange={handleChange} placeholder="ABCDE1234F" style={{ textTransform: "uppercase" }} />
                  {fieldErrors.PANNumber && <span className="settings-field-error">{fieldErrors.PANNumber}</span>}
                </label>
              </div>
            </section>

            {/* ---------- Bank Details ---------- */}
            <section className="settings-card">
              <h2><FaUniversity /> Bank Details</h2>
              <div className="settings-field-grid">
                <label className="settings-field">
                  Account Holder Name
                  <input name="BankAccountName" value={form.BankAccountName} onChange={handleChange} placeholder="e.g. NCA IT Solution" />
                </label>
                <label className="settings-field">
                  Bank Name
                  <input name="BankName" value={form.BankName} onChange={handleChange} placeholder="e.g. HDFC Bank" />
                </label>
                <label className="settings-field">
                  Account Number
                  <input name="BankAccountNumber" value={form.BankAccountNumber} onChange={handleChange} />
                </label>
                <label className="settings-field">
                  IFSC Code
                  <input name="BankIFSC" value={form.BankIFSC} onChange={handleChange} placeholder="e.g. HDFC0001234" style={{ textTransform: "uppercase" }} />
                  {fieldErrors.BankIFSC && <span className="settings-field-error">{fieldErrors.BankIFSC}</span>}
                </label>
                <label className="settings-field">
                  Branch
                  <input name="BankBranch" value={form.BankBranch} onChange={handleChange} />
                </label>
                <label className="settings-field">
                  UPI ID
                  <input name="BankUPIId" value={form.BankUPIId} onChange={handleChange} placeholder="e.g. ncaitsolution@okhdfcbank" />
                </label>
              </div>
              <p className="settings-image-hint" style={{ marginTop: 10, maxWidth: "none" }}>
                Shown on Fee Receipts only, for students paying by bank transfer or UPI.
              </p>
            </section>

            {/* ---------- Branding ---------- */}
            <section className="settings-card">
              <h2><FaImage /> Branding</h2>
              <div className="settings-image-grid">
                {IMAGE_FIELDS.slice(0, 2).map(({ key, label, hint }) => (
                  <div key={key} className="settings-image-field">
                    <span className="settings-image-label">{label}</span>
                    <div className="settings-image-preview">
                      {imageSrc(key) ? <img src={imageSrc(key)} alt={label} /> : <FaImage className="settings-image-placeholder" />}
                    </div>
                    {canEdit && (
                      <>
                        <div className="settings-image-actions">
                          <label className="settings-upload-btn">
                            <FaUpload /> {imageSrc(key) ? "Change" : "Upload"}
                            <input
                              ref={(el) => (fileInputRefs.current[key] = el)}
                              type="file"
                              accept="image/jpeg,image/png,image/webp,image/svg+xml,image/x-icon"
                              onChange={(e) => handleFileChange(key, e.target.files[0])}
                              hidden
                            />
                          </label>
                          {key === "logo" && imageSrc(key) && (
                            <button
                              type="button"
                              className="settings-remove-btn"
                              onClick={handleRemoveLogo}
                            >
                              <FaTrash /> Remove
                            </button>
                          )}
                        </div>
                        <span className="settings-image-hint">{hint}</span>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </section>

            {/* ---------- Social Media ---------- */}
            <section className="settings-card">
              <h2><FaShareAlt /> Social Media</h2>
              <div className="settings-field-grid">
                <label className="settings-field">
                  Facebook
                  <input name="Facebook" value={form.Facebook} onChange={handleChange} placeholder="https://facebook.com/..." />
                </label>
                <label className="settings-field">
                  Instagram
                  <input name="Instagram" value={form.Instagram} onChange={handleChange} placeholder="https://instagram.com/..." />
                </label>
                <label className="settings-field">
                  LinkedIn
                  <input name="LinkedIn" value={form.LinkedIn} onChange={handleChange} placeholder="https://linkedin.com/..." />
                </label>
                <label className="settings-field">
                  YouTube
                  <input name="YouTube" value={form.YouTube} onChange={handleChange} placeholder="https://youtube.com/..." />
                </label>
                <label className="settings-field">
                  X (Twitter)
                  <input name="Twitter" value={form.Twitter} onChange={handleChange} placeholder="https://x.com/..." />
                </label>
                <label className="settings-field">
                  WhatsApp Number
                  <input name="WhatsApp" value={form.WhatsApp} onChange={handleChange} placeholder="91XXXXXXXXXX" />
                </label>
              </div>
            </section>

            {/* ---------- Signature & Stamp ---------- */}
            <section className="settings-card">
              <h2><FaSignature /> Signature &amp; Stamp</h2>
              <div className="settings-image-grid">
                {IMAGE_FIELDS.slice(2).map(({ key, label, hint }) => (
                  <div key={key} className="settings-image-field">
                    <span className="settings-image-label">{label}</span>
                    <div className="settings-image-preview">
                      {imageSrc(key) ? <img src={imageSrc(key)} alt={label} /> : <FaImage className="settings-image-placeholder" />}
                    </div>
                    {canEdit && (
                      <>
                        <label className="settings-upload-btn">
                          <FaUpload /> {imageSrc(key) ? "Change" : "Upload"}
                          <input
                            ref={(el) => (fileInputRefs.current[key] = el)}
                            type="file"
                            accept="image/jpeg,image/png,image/webp,image/svg+xml"
                            onChange={(e) => handleFileChange(key, e.target.files[0])}
                            hidden
                          />
                        </label>
                        <span className="settings-image-hint">{hint}</span>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </section>
          </div>
        </fieldset>

        {canEdit && (
          <div className="settings-actions">
            <button type="button" className="settings-btn settings-btn-secondary" onClick={handleReset} disabled={saving}>
              <FaUndo /> Reset
            </button>
            <button type="submit" className="settings-btn settings-btn-primary" disabled={saving}>
              <FaSave /> {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        )}
      </form>

      {/* ---------- Preview ---------- */}
      <section className="settings-card settings-preview-card">
        <h2><FaEye /> Preview</h2>
        <div className="settings-preview">
          <div className="settings-preview-logo">
            {imageSrc("logo") ? <img src={imageSrc("logo")} alt="Logo" /> : <FaBuilding />}
          </div>
          <div className="settings-preview-body">
            <h3>{form.instituteName || "Your Institute Name"}</h3>
            <p>{form.Address || "Institute address will appear here"}</p>
            <p className="settings-preview-contact">
              {form.Phone && <span>📞 {form.Phone}</span>}
              {form.Email && <span>✉️ {form.Email}</span>}
              {form.Website && <span>🌐 {form.Website}</span>}
            </p>
            {form.GSTNumber && <p className="settings-preview-gst">GSTIN: {form.GSTNumber}</p>}
          </div>
          <div className="settings-preview-stamps">
            {imageSrc("AuthorizedSignature") && (
              <div className="settings-preview-stamp">
                <img src={imageSrc("AuthorizedSignature")} alt="Authorized Signature" />
                <span>Signature</span>
              </div>
            )}
            {imageSrc("InstituteStamp") && (
              <div className="settings-preview-stamp">
                <img src={imageSrc("InstituteStamp")} alt="Institute Stamp" />
                <span>Stamp</span>
              </div>
            )}
          </div>
        </div>
      </section>

      <Toast message={toast?.message} type={toast?.type} onClose={() => setToast(null)} />
    </div>
  );
};

export default AdminInstituteSettings;
