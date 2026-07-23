import mongoose from "mongoose";

// Singleton document — only ONE InstituteSettings record should ever exist.
// Every field is optional so the admin can fill the form in gradually
// without breaking anything that reads from it (all consumers fall back
// to sensible defaults when a field is empty).
const instituteSettingsSchema = new mongoose.Schema(
  {
    // Fixed key used to guarantee a single document (see findOrCreate below).
    singletonKey: { type: String, default: "INSTITUTE_SETTINGS", unique: true },

    // --- General Information ---
    instituteName: { type: String, trim: true, default: "" },
    shortName: { type: String, trim: true, default: "" },

    // --- Branding ---
    logo: { type: String, default: "" },
    favicon: { type: String, default: "" },

    // --- Tax Information ---
    GSTNumber: { type: String, trim: true, default: "" },
    PANNumber: { type: String, trim: true, default: "" },

    // --- Contact / Address Information ---
    Address: { type: String, trim: true, default: "" },
    City: { type: String, trim: true, default: "" },
    State: { type: String, trim: true, default: "" },
    Country: { type: String, trim: true, default: "" },
    Pincode: { type: String, trim: true, default: "" },
    Phone: { type: String, trim: true, default: "" },
    AlternatePhone: { type: String, trim: true, default: "" },
    Email: { type: String, trim: true, lowercase: true, default: "" },
    Website: { type: String, trim: true, default: "" },
    GoogleMapLink: { type: String, trim: true, default: "" },

    // --- Authority ---
    DirectorName: { type: String, trim: true, default: "" },
    AuthorizedSignature: { type: String, default: "" },
    InstituteStamp: { type: String, default: "" },

    // --- Social Media ---
    Facebook: { type: String, trim: true, default: "" },
    Instagram: { type: String, trim: true, default: "" },
    LinkedIn: { type: String, trim: true, default: "" },
    YouTube: { type: String, trim: true, default: "" },
    Twitter: { type: String, trim: true, default: "" },
    WhatsApp: { type: String, trim: true, default: "" },

    // --- Support ---
    SupportEmail: { type: String, trim: true, lowercase: true, default: "" },
    SupportPhone: { type: String, trim: true, default: "" },

    // --- Bank Details (used on Fee Receipts for online/bank payments) ---
    BankAccountName: { type: String, trim: true, default: "" },
    BankName: { type: String, trim: true, default: "" },
    BankAccountNumber: { type: String, trim: true, default: "" },
    BankIFSC: { type: String, trim: true, uppercase: true, default: "" },
    BankBranch: { type: String, trim: true, default: "" },
    BankUPIId: { type: String, trim: true, default: "" },

    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Admin" },
  },
  { timestamps: true }
);

// Returns the single settings document, creating an empty one on first use.
instituteSettingsSchema.statics.findOrCreate = async function () {
  let settings = await this.findOne({ singletonKey: "INSTITUTE_SETTINGS" });
  if (!settings) {
    settings = await this.create({ singletonKey: "INSTITUTE_SETTINGS" });
  }
  return settings;
};

export default mongoose.model("InstituteSettings", instituteSettingsSchema);
