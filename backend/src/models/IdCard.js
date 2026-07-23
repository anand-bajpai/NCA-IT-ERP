import mongoose from "mongoose";

const idCardSchema = new mongoose.Schema(
  {
    idCardNumber: { type: String, required: true, unique: true, trim: true },

    // Source of truth: the Admission (Student) record this card was
    // generated from. Name / photo / course etc. are copied onto the card
    // at generation time so a card keeps rendering correctly even if the
    // admission record is edited later — "Sync from Admission" in the
    // admin UI re-pulls the latest values on demand.
    studentRef: { type: mongoose.Schema.Types.ObjectId, ref: "Student", required: true },

    studentName: { type: String, required: true, trim: true },
    fatherName: { type: String, trim: true },
    photo: { type: String, default: "" },

    mobile: { type: String, trim: true },
    email: { type: String, trim: true, lowercase: true },
    address: { type: String, trim: true },
    emergencyContact: { type: String, trim: true },
    bloodGroup: { type: String, trim: true },

    course: { type: String, required: true, trim: true },
    batch: { type: String, trim: true },
    admissionNumber: { type: String, trim: true },

    issueDate: { type: Date, required: true, default: Date.now },
    validUpto: { type: Date, required: true },

    status: {
      type: String,
      enum: ["Active", "Expired", "Blocked"],
      default: "Active",
    },

    qrCode: { type: String, default: "" }, // base64 data URL

    // Generated PDF — private on-disk path, never exposed directly to the
    // client. Mirrors the Certificate module's pdfPath pattern.
    pdfPath: { type: String, default: "", select: false },
    pdfGeneratedAt: { type: Date },

    downloadCount: { type: Number, default: 0 },
    lastDownloadedAt: { type: Date },
  },
  { timestamps: true }
);

idCardSchema.index({
  idCardNumber: "text",
  studentName: "text",
  mobile: "text",
  admissionNumber: "text",
  course: "text",
  batch: "text",
});

export default mongoose.model("IdCard", idCardSchema);
