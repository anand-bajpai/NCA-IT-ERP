import { validationResult } from "express-validator";
import { sendMail } from "../utils/mailer.js";
import { renderEmailTable } from "../utils/emailTemplate.js";
import { getInstituteInfo } from "../utils/instituteSettingsCache.js";
import Enquiry from "../models/Enquiry.js";

export async function submitContact(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  const {
    fullName,
    email,
    phone,
    inquiryType,
    contactMethod,
    budget,
    message,
  } = req.body;

  try {
    // Best-effort: log this enquiry in the Admin Panel. Never blocks or
    // changes the response if it fails, so the public form keeps working
    // exactly as before.
    Enquiry.create({ fullName, email, phone, inquiryType, contactMethod, budget, message }).catch(
      (err) => console.error("Enquiry save error:", err)
    );

    const institute = await getInstituteInfo();

    await sendMail({
      to: institute.SupportEmail || undefined,
      subject: `New Website Enquiry — ${inquiryType || "General"} — ${fullName}`,
      replyTo: email,
      html: renderEmailTable(
        "New Contact / Enquiry Submission",
        [
          { label: "Full Name", value: fullName },
          { label: "Email", value: email },
          { label: "Phone", value: phone },
          { label: "Inquiry Type", value: inquiryType },
          { label: "Preferred Contact Method", value: contactMethod },
          { label: "Budget Range", value: budget },
          { label: "Message", value: message },
        ],
        institute.instituteName
      ),
    });

    return res.status(200).json({
      success: true,
      message: "Thank you! Your message has been sent. Our team will contact you soon.",
    });
  } catch (err) {
    console.error("Contact mail error:", err);
    return res.status(500).json({
      success: false,
      message: "Something went wrong while sending your message. Please try again or WhatsApp us.",
    });
  }
}
