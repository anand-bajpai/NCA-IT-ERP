import nodemailer from "nodemailer";

let transporter;

export function getTransporter() {
  if (transporter) return transporter;

  transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || "smtp.gmail.com",
    port: Number(process.env.EMAIL_PORT) || 465,
    secure: process.env.EMAIL_SECURE !== "false",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  return transporter;
}

export async function sendMail({ to, subject, html, replyTo, attachments }) {
  const transport = getTransporter();

  return transport.sendMail({
    from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
    to: to || process.env.CONTACT_RECEIVER || process.env.EMAIL_USER,
    subject,
    html,
    replyTo,
    attachments,
  });
}
