import multer from "multer";
import path from "path";
import fs from "fs";

const UPLOAD_DIR = path.resolve("uploads/students/documents");
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const ALLOWED_MIME = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
];

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    cb(null, unique);
  },
});

const fileFilter = (req, file, cb) => {
  if (ALLOWED_MIME.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Only PDF, JPG, PNG or WEBP files are allowed for admission documents."));
  }
};

// Handles the admission form's combined upload: one photo + up to 5
// supporting documents (Aadhar, marksheets, ID proof, etc.) in one request.
export const admissionUpload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      const dir =
        file.fieldname === "photo" ? path.resolve("uploads/students") : UPLOAD_DIR;
      fs.mkdirSync(dir, { recursive: true });
      cb(null, dir);
    },
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname);
      const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
      cb(null, unique);
    },
  }),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB per file
  fileFilter: (req, file, cb) => {
    if (file.fieldname === "photo") {
      const PHOTO_MIME = ["image/jpeg", "image/png", "image/webp"];
      if (PHOTO_MIME.includes(file.mimetype)) return cb(null, true);
      return cb(new Error("Only JPG, PNG or WEBP images are allowed for the admission photo."));
    }
    return fileFilter(req, file, cb);
  },
}).fields([
  { name: "photo", maxCount: 1 },
  { name: "documents", maxCount: 5 },
]);
