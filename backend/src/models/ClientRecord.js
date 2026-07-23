import mongoose from "mongoose";

const clientRecordSchema = new mongoose.Schema(
  {
    clientName: { type: String, required: true, trim: true }, // contact person
    companyName: { type: String, required: true, trim: true },
    logo: { type: String, default: "" },

    mobile: { type: String, trim: true },
    email: { type: String, trim: true, lowercase: true },

    project: { type: String, required: true, trim: true },
    technology: { type: String, required: true, trim: true },

    startDate: { type: Date },
    completionDate: { type: Date },

    status: {
      type: String,
      enum: ["Ongoing", "Completed", "On Hold"],
      default: "Completed",
    },

    certificateRef: { type: mongoose.Schema.Types.ObjectId, ref: "Certificate" },
  },
  { timestamps: true }
);

clientRecordSchema.index({
  clientName: "text",
  companyName: "text",
  project: "text",
  technology: "text",
});

export default mongoose.model("ClientRecord", clientRecordSchema);
