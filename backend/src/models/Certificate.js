import mongoose from "mongoose";

const certificateSchema = new mongoose.Schema(
  {
    certificateNumber: { type: String, required: true, unique: true, trim: true },
    verificationId: { type: String, required: true, unique: true, trim: true },

    studentName: { type: String, required: true, trim: true },
    fatherName: { type: String, trim: true },
    studentRef: { type: mongoose.Schema.Types.ObjectId, ref: "Student" },
    admissionNumber: { type: String, trim: true },
    mobile: { type: String, trim: true },
    email: { type: String, trim: true, lowercase: true },
    photo: { type: String, default: "" },

    course: { type: String, required: true, trim: true },
    // Legacy field — no longer editable from the admin form (replaced by
    // Joining Date), kept only so certificates issued before this change
    // keep loading/rendering exactly as before.
    batch: { type: String, trim: true },
    joiningDate: { type: Date },
    technology: { type: String, trim: true },
    duration: { type: String, trim: true },

    startDate: { type: Date },
    endDate: { type: Date },
    issueDate: { type: Date, required: true, default: Date.now },

    grade: { type: String, trim: true },

    // Organization / client company name — legacy field, kept only so
    // certificates issued before this module was restricted to Students
    // keep loading/rendering exactly as before. Not settable from the
    // current admin form (certificates are only issued to Students now).
    organization: { type: String, trim: true },

    certificateType: {
      type: String,
      enum: [
        "Student Course Completion",
        "Internship Completion",
        "Certificate of Appreciation",
        "Certificate of Excellence",
        // Legacy values — kept so certificates issued before this module was
        // restricted to Students keep loading/rendering exactly as before.
        "Client Project Completion",
        "Training",
        "Internship",
        "Client",
      ],
      default: "Student Course Completion",
    },

    // Linked source record when the certificate type is Internship / Client
    internshipRef: { type: mongoose.Schema.Types.ObjectId, ref: "InternshipRecord" },
    clientRef: { type: mongoose.Schema.Types.ObjectId, ref: "ClientRecord" },

    description: { type: String, trim: true },

    qrCode: { type: String, default: "" }, // base64 data URL

    // Generated PDF — private on-disk path (NOT under the statically served
    // /uploads root), so a PDF can only ever be reached through a controlled
    // download route that checks certificate status first. Never expose this
    // path directly to the client.
    pdfPath: { type: String, default: "", select: false },
    pdfGeneratedAt: { type: Date },

    status: {
      type: String,
      enum: ["Valid", "Expired", "Revoked", "Reissued"],
      default: "Valid",
    },

    // Revoke tracking
    revokedAt: { type: Date },
    revokedReason: { type: String, trim: true },
    revokedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Admin" },

    // Reissue lineage — old certificate is marked "Reissued" and points to the
    // new one; the new certificate points back to the one it replaced.
    reissueOf: { type: mongoose.Schema.Types.ObjectId, ref: "Certificate" },
    reissuedTo: { type: mongoose.Schema.Types.ObjectId, ref: "Certificate" },
    reissueCount: { type: Number, default: 0 },

    // Duplicate lineage — purely informational, does not affect status
    duplicateOf: { type: mongoose.Schema.Types.ObjectId, ref: "Certificate" },

    // Notification tracking (admin "Resend Email" / "WhatsApp Share")
    emailSentCount: { type: Number, default: 0 },
    emailLastSentAt: { type: Date },
    emailLastSentTo: { type: String, trim: true },
    whatsappSharedCount: { type: Number, default: 0 },
    whatsappLastSharedAt: { type: Date },

    // Download history — every successful public PDF download is recorded
    // here (capped, newest first) so admins can audit who pulled the PDF.
    downloadCount: { type: Number, default: 0 },
    lastDownloadedAt: { type: Date },
    downloadHistory: {
      type: [
        {
          downloadedAt: { type: Date, default: Date.now },
          ip: { type: String, trim: true },
          userAgent: { type: String, trim: true },
          source: { type: String, enum: ["public", "admin"], default: "public" },
        },
      ],
      default: [],
      select: false,
    },
  },
  { timestamps: true }
);

certificateSchema.index({
  certificateNumber: "text",
  verificationId: "text",
  studentName: "text",
  admissionNumber: "text",
  course: "text",
  mobile: "text",
  batch: "text",
  technology: "text",
});

export default mongoose.model("Certificate", certificateSchema);
