import mongoose from "mongoose";

const internshipRecordSchema = new mongoose.Schema(
  {
    studentName: { type: String, required: true, trim: true },
    studentRef: { type: mongoose.Schema.Types.ObjectId, ref: "Student" },
    photo: { type: String, default: "" },

    mobile: { type: String, trim: true },
    email: { type: String, trim: true, lowercase: true },

    companyName: { type: String, required: true, trim: true },
    technology: { type: String, required: true, trim: true },
    mentor: { type: String, trim: true },
    projectName: { type: String, trim: true },

    startDate: { type: Date },
    endDate: { type: Date },
    internshipDuration: { type: String, trim: true }, // e.g. "3 Months"

    status: {
      type: String,
      enum: ["Ongoing", "Completed", "Dropped"],
      default: "Ongoing",
    },

    certificateRef: { type: mongoose.Schema.Types.ObjectId, ref: "Certificate" },
  },
  { timestamps: true }
);

internshipRecordSchema.index({
  studentName: "text",
  companyName: "text",
  technology: "text",
  projectName: "text",
});

export default mongoose.model("InternshipRecord", internshipRecordSchema);
