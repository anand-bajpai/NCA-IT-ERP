import mongoose from "mongoose";

const studentSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true, trim: true },
    fatherName: { type: String, trim: true },
    motherName: { type: String, trim: true },
    photo: { type: String, default: "" }, // stored file path/URL

    // Admission documents (Aadhar, marksheets, ID proof, etc.) uploaded
    // against this record.
    documents: [
      {
        name: { type: String, trim: true }, // original filename / label
        url: { type: String, trim: true }, // stored file path/URL
        uploadedAt: { type: Date, default: Date.now },
      },
    ],

    mobile: { type: String, required: true, trim: true },
    email: { type: String, trim: true, lowercase: true },

    course: { type: String, required: true, trim: true },
    batch: { type: String, trim: true },

    admissionNumber: { type: String, unique: true, sparse: true, trim: true },

    address: { type: String, trim: true },

    joiningDate: { type: Date },
    completionDate: { type: Date },

    status: {
      type: String,
      enum: ["Active", "Completed", "Dropped", "On Hold"],
      default: "Active",
    },

    studentType: {
      type: String,
      enum: ["Regular", "Internship", "Client"],
      default: "Regular",
    },

    certificateEligible: { type: Boolean, default: false },
    idCardEligible: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Text index for global search across common fields
studentSchema.index({
  fullName: "text",
  email: "text",
  mobile: "text",
  admissionNumber: "text",
  course: "text",
});

export default mongoose.model("Student", studentSchema);
