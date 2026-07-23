# NCA IT Solution — Backend API

Simple Express API that powers three forms on the website — every submission
is emailed straight to your inbox using Nodemailer. No database required.

1. **Contact / Enquiry form** → `POST /api/contact`
2. **Internship application (with resume upload)** → `POST /api/internship-application`
3. **Course enrollment form** → `POST /api/course-enrollment`

## 1. Install

```bash
cd backend
npm install
```

## 2. Configure environment variables

```bash
cp .env.example .env
```

Then edit `.env`:

- `EMAIL_USER` — the Gmail address that sends notification emails.
- `EMAIL_PASS` — a Gmail **App Password** (not your normal password):
  1. Google Account → **Security** → turn on **2-Step Verification**.
  2. Go to **App Passwords**, create one for "Mail", copy the 16-character code.
  3. Paste it as `EMAIL_PASS`.
- `CONTACT_RECEIVER` — the inbox that should receive enquiries/applications.
- `CLIENT_ORIGIN` — your frontend URL (e.g. `http://localhost:5173` in dev,
  your real domain in production). Comma-separate multiple origins if needed.

## 3. Run

```bash
npm run dev     # auto-restarts on file changes
# or
npm start
```

Server starts on `http://localhost:5000` by default.
Health check: `GET http://localhost:5000/api/health`

## API Reference

### POST `/api/contact`
```json
{
  "fullName": "John Doe",
  "email": "john@example.com",
  "phone": "9876543210",
  "inquiryType": "Project Development",
  "contactMethod": "WhatsApp",
  "budget": "₹20,000 - ₹50,000",
  "message": "I need a website for my business."
}
```

### POST `/api/internship-application`
`multipart/form-data` (so a resume file can be attached):
```
fullName, email, phone, college, branch, year, domain, duration, mode, message, resume (file)
```

### POST `/api/course-enrollment`
```json
{
  "fullName": "Jane Doe",
  "email": "jane@example.com",
  "phone": "9876543210",
  "city": "Noida",
  "courseTitle": "MERN Stack Development",
  "message": "Want to know the batch timings"
}
```

## Notes

- Requests are rate-limited (20 requests / 15 minutes per IP) to prevent spam.
- Resumes are limited to 5MB and must be PDF or Word documents.
- No database is used — every submission goes directly to your inbox as an
  email. If you ever want a searchable record of all past submissions later,
  a database (MongoDB, Postgres, etc.) can be added on top of this without
  touching the frontend.

## Deployment

Any Node host works (Render, Railway, a VPS, etc.). Make sure to:
- Set the same environment variables on the host.
- Set `CLIENT_ORIGIN` to your real website domain.
- Point the frontend's `VITE_API_URL` to this backend's public URL.
