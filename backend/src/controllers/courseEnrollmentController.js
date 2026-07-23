import { validationResult } from "express-validator";
import { sendMail } from "../utils/mailer.js";
import { renderEmailTable } from "../utils/emailTemplate.js";

export async function submitCourseEnrollment(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  const { fullName, email, phone, city, courseTitle, message } = req.body;

  try {
    await sendMail({
      subject: `New Course Enrollment — ${courseTitle || "Unknown Course"} — ${fullName}`,
      replyTo: email,
      html: renderEmailTable("New Course Enrollment", [
        { label: "Course", value: courseTitle },
        { label: "Full Name", value: fullName },
        { label: "Email", value: email },
        { label: "Phone", value: phone },
        { label: "City", value: city },
        { label: "Message", value: message },
      ]),
    });

    return res.status(200).json({
      success: true,
      message: "Enrolled successfully! Our counsellor will contact you shortly.",
    });
  } catch (err) {
    console.error("Course enrollment mail error:", err);
    return res.status(500).json({
      success: false,
      message: "Something went wrong while submitting your enrollment. Please try again.",
    });
  }
}
