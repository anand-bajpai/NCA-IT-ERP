import { validationResult } from "express-validator";
import fs from "fs";
import path from "path";
import InstituteSettings from "../models/InstituteSettings.js";
import { invalidateInstituteSettingsCache } from "../utils/instituteSettingsCache.js";

const UPLOAD_DIR = path.resolve("uploads/institute");

// Best-effort delete of a previously-uploaded institute asset (logo,
// favicon, signature, stamp) when it's being replaced or removed. Never
// throws — an orphaned file on disk is harmless, so failures are ignored.
function deleteStoredAsset(storedPath) {
  if (!storedPath || !storedPath.startsWith("/uploads/institute/")) return;
  const filename = path.basename(storedPath);
  const fullPath = path.join(UPLOAD_DIR, filename);
  fs.unlink(fullPath, () => {});
}

// Fields the Super Admin is allowed to set from the settings form.
// (singletonKey/_id/timestamps are never accepted from the client.)
const EDITABLE_FIELDS = [
  "instituteName",
  "shortName",
  "GSTNumber",
  "PANNumber",
  "Address",
  "City",
  "State",
  "Country",
  "Pincode",
  "Phone",
  "AlternatePhone",
  "Email",
  "Website",
  "GoogleMapLink",
  "DirectorName",
  "Facebook",
  "Instagram",
  "LinkedIn",
  "YouTube",
  "Twitter",
  "WhatsApp",
  "SupportEmail",
  "SupportPhone",
  "BankAccountName",
  "BankName",
  "BankAccountNumber",
  "BankIFSC",
  "BankBranch",
  "BankUPIId",
];

// Public-safe subset — never exposes internal ids or PAN/GST unless needed.
const PUBLIC_FIELDS = [
  "instituteName",
  "shortName",
  "logo",
  "favicon",
  "Address",
  "City",
  "State",
  "Country",
  "Pincode",
  "Phone",
  "AlternatePhone",
  "Email",
  "Website",
  "GoogleMapLink",
  "DirectorName",
  "Facebook",
  "Instagram",
  "LinkedIn",
  "YouTube",
  "Twitter",
  "WhatsApp",
  "SupportEmail",
  "SupportPhone",
  "GSTNumber",
];

function pick(obj, fields) {
  const out = {};
  fields.forEach((f) => {
    if (obj[f] !== undefined) out[f] = obj[f];
  });
  return out;
}

// GET /api/admin/settings/institute — Admin (view) & Super Admin (view+edit)
export async function getInstituteSettings(req, res) {
  try {
    const settings = await InstituteSettings.findOrCreate();
    res.json({ success: true, data: settings });
  } catch (err) {
    console.error("Get institute settings error:", err);
    res.status(500).json({ success: false, message: "Could not fetch institute settings." });
  }
}

// PUT /api/admin/settings/institute — Super Admin ONLY
export async function updateInstituteSettings(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  try {
    const payload = pick(req.body, EDITABLE_FIELDS);

    const current = await InstituteSettings.findOrCreate();

    // Uploaded image fields (multer .fields()) — only overwrite if a new
    // file was actually sent with this request. The previous file (if any)
    // is deleted from disk since it's no longer referenced.
    if (req.files?.logo?.[0]) {
      deleteStoredAsset(current.logo);
      payload.logo = `/uploads/institute/${req.files.logo[0].filename}`;
    } else if (req.body.removeLogo === "true" || req.body.removeLogo === true) {
      // Admin explicitly removed the logo — clear it and fall back to the
      // default logo everywhere it's used (certificates, ID cards, receipts).
      deleteStoredAsset(current.logo);
      payload.logo = "";
    }
    if (req.files?.favicon?.[0]) {
      deleteStoredAsset(current.favicon);
      payload.favicon = `/uploads/institute/${req.files.favicon[0].filename}`;
    }
    if (req.files?.AuthorizedSignature?.[0]) {
      deleteStoredAsset(current.AuthorizedSignature);
      payload.AuthorizedSignature = `/uploads/institute/${req.files.AuthorizedSignature[0].filename}`;
    }
    if (req.files?.InstituteStamp?.[0]) {
      deleteStoredAsset(current.InstituteStamp);
      payload.InstituteStamp = `/uploads/institute/${req.files.InstituteStamp[0].filename}`;
    }

    payload.updatedBy = req.admin?._id;

    const settings = await InstituteSettings.findOneAndUpdate(
      { singletonKey: "INSTITUTE_SETTINGS" },
      { $set: payload },
      { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
    );

    invalidateInstituteSettingsCache();

    res.json({ success: true, message: "Institute settings updated successfully.", data: settings });
  } catch (err) {
    console.error("Update institute settings error:", err);
    res.status(500).json({ success: false, message: "Could not update institute settings." });
  }
}

// GET /api/settings/public — no auth. Used by the public website
// (Navbar, Footer, Contact page, certificate verification) and can also
// be consumed by future ID card generation.
export async function getPublicInstituteSettings(req, res) {
  try {
    const settings = await InstituteSettings.findOrCreate();
    res.json({ success: true, data: pick(settings.toObject(), PUBLIC_FIELDS) });
  } catch (err) {
    console.error("Get public institute settings error:", err);
    res.status(500).json({ success: false, message: "Could not fetch institute settings." });
  }
}
