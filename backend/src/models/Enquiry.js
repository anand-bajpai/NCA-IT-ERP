import mongoose from "mongoose";

// A single follow-up note logged against an enquiry (call/visit/message etc.)
const followUpSchema = new mongoose.Schema(
  {
    note: { type: String, trim: true, required: true },
    nextFollowUpDate: { type: Date },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "Admin" },
  },
  { timestamps: true }
);

// Stores every enquiry — both submitted via the public Contact page and
// added manually by staff (walk-ins/phone calls) — so the Admin Panel can
// manage, follow up on, and convert them into admissions.
const enquirySchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true, trim: true },
    email: { type: String, trim: true, lowercase: true },
    phone: { type: String, trim: true },

    course: { type: String, trim: true }, // course they're interested in
    inquiryType: { type: String, trim: true }, // e.g. Admission, Internship, General
    contactMethod: { type: String, trim: true }, // e.g. Phone, Email, Walk-in
    source: { type: String, trim: true }, // e.g. Website, Walk-in, Referral, Social Media
    budget: { type: String, trim: true },
    message: { type: String, trim: true },

    status: {
      type: String,
      enum: ["New", "Contacted", "Follow-up", "Converted", "Closed"],
      default: "New",
    },

    nextFollowUpDate: { type: Date }, // convenience mirror of latest follow-up's date, for quick filtering
    followUps: [followUpSchema],

    // Set once this enquiry has been converted into an admission (Student record)
    convertedToStudent: { type: mongoose.Schema.Types.ObjectId, ref: "Student" },
    convertedAt: { type: Date },

    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "Admin" },
  },
  { timestamps: true }
);

enquirySchema.index({
  fullName: "text",
  email: "text",
  phone: "text",
  inquiryType: "text",
  course: "text",
  message: "text",
});

export default mongoose.model("Enquiry", enquirySchema);
