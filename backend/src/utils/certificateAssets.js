import fs from "fs";
import path from "path";

const MIME_BY_EXT = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
};

// Reads a file from disk and returns it as a base64 data URL, so the
// certificate HTML/PDF never depends on a network fetch for its images
// (logo, watermark, signature, stamp, photo) — it just works, every time,
// including inside the headless PDF renderer.
export function fileToDataUrl(absPath) {
  try {
    if (!absPath || !fs.existsSync(absPath)) return "";
    const ext = path.extname(absPath).toLowerCase();
    const mime = MIME_BY_EXT[ext] || "application/octet-stream";
    const buf = fs.readFileSync(absPath);
    return `data:${mime};base64,${buf.toString("base64")}`;
  } catch (err) {
    console.error("fileToDataUrl error:", err.message);
    return "";
  }
}

// Resolves a stored "/uploads/xxx" (or full URL) reference — as saved on
// Student/Certificate/InstituteSettings documents — to an absolute path
// under the local uploads root.
export function resolveUploadPath(relativeOrUrl) {
  if (!relativeOrUrl) return "";
  const clean = relativeOrUrl.replace(/^https?:\/\/[^/]+/, "").replace(/^\/?uploads\//, "");
  return path.resolve("uploads", clean);
}

// Convenience: stored path/URL -> base64 data URL (or "" if missing).
export function storedRefToDataUrl(relativeOrUrl) {
  return fileToDataUrl(resolveUploadPath(relativeOrUrl));
}
