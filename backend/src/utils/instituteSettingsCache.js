import InstituteSettings from "../models/InstituteSettings.js";

// Lightweight in-memory cache so every fee receipt / email / certificate
// render doesn't have to hit MongoDB. Invalidated instantly whenever the
// Super Admin saves the settings form (see instituteSettingsController.js).
let cached = null;
let cachedAt = 0;
const TTL_MS = 60 * 1000; // safety net in case invalidateInstituteSettingsCache() is ever missed

export function invalidateInstituteSettingsCache() {
  cached = null;
  cachedAt = 0;
}

// Returns the settings document as a plain object, merged with fallback
// defaults so every field is always safe to read even before the Super
// Admin has filled the form in.
export async function getInstituteSettingsCached() {
  const now = Date.now();
  if (cached && now - cachedAt < TTL_MS) return cached;

  try {
    const doc = await InstituteSettings.findOrCreate();
    cached = doc.toObject();
    cachedAt = now;
    return cached;
  } catch (err) {
    console.error("Could not load institute settings, using fallback defaults:", err.message);
    return {};
  }
}

// Fallback defaults — used ONLY for fields the admin hasn't set yet, so
// existing documents (fee receipts, emails) never render blank/broken.
export const INSTITUTE_FALLBACK = {
  instituteName: "NCA IT Solution",
  shortName: "NCA IT Solution",
  Address:
    "Iconic Corenthum Tower, Floor 7, Office No-705A, Near Electronic City Metro Station, Sector 62, Noida, Uttar Pradesh 201309",
  Phone: "+91 8287584509",
  Email: "ncaitsolutionnoida@gmail.com",
  Website: process.env.INSTITUTE_WEBSITE || "",
  GSTNumber: process.env.INSTITUTE_GST_NUMBER || "",
};

// Merges the saved settings over the fallback defaults, field by field,
// treating empty strings the same as "not set".
export async function getInstituteInfo() {
  const settings = await getInstituteSettingsCached();
  const merged = { ...INSTITUTE_FALLBACK };
  for (const key of Object.keys(INSTITUTE_FALLBACK)) {
    if (settings[key]) merged[key] = settings[key];
  }
  // Pass through everything else (logo, socials, signature, stamp, etc.)
  return { ...settings, ...merged };
}
