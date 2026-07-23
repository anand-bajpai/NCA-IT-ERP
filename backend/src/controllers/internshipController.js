import { validationResult } from "express-validator";
import { sendMail } from "../utils/mailer.js";
import { renderEmailTable } from "../utils/emailTemplate.js";
import Enquiry from "../models/Enquiry.js";

export async function submitInternshipApplication(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  const {
    fullName,
    email,
    phone,
    college,
    branch,
    year,
    domain,
    duration,
    mode,
    message,
  } = req.body;

  const resume = req.file;

  try {
    // Best-effort: log this application in the Admin Panel's Enquiries list
    // (same collection the public Contact form already saves into). Never
    // blocks or changes the response if it fails.
    const detailLines = [
      college && `College/University: ${college}`,
      branch && `Branch/Stream: ${branch}`,
      year && `Current Year: ${year}`,
      duration && `Preferred Duration: ${duration}`,
      mode && `Mode: ${mode}`,
      resume && `Resume Attached: Yes (${resume.originalname})`,
      message && `Message: ${message}`,
    ].filter(Boolean).join("\n");

    Enquiry.create({
      fullName,
      email,
      phone,
      course: domain,
      inquiryType: "Internship",
      source: "Website",
      message: detailLines,
    }).catch((err) => console.error("Internship enquiry save error:", err));

    await sendMail({
      subject: `New Internship Application — ${domain || "General"} — ${fullName}`,
      replyTo: email,
      html: renderEmailTable("New Internship Application", [
        { label: "Full Name", value: fullName },
        { label: "Email", value: email },
        { label: "Phone", value: phone },
        { label: "College / University", value: college },
        { label: "Branch / Stream", value: branch },
        { label: "Current Year", value: year },
        { label: "Domain", value: domain },
        { label: "Preferred Duration", value: duration },
        { label: "Mode", value: mode },
        { label: "Message", value: message },
        { label: "Resume Attached", value: resume ? "Yes (see attachment)" : "No" },
      ]),
      attachments: resume
        ? [
            {
              filename: resume.originalname,
              content: resume.buffer,
              contentType: resume.mimetype,
            },
          ]
        : [],
    });

    return res.status(200).json({
      success: true,
      message: "Application submitted successfully! Our team will reach out to you soon.",
    });
  } catch (err) {
    console.error("Internship mail error:", err);
    return res.status(500).json({
      success: false,
      message: "Something went wrong while submitting your application. Please try again.",
    });
  }
}
