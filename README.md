# NCA IT Solution — Website

A full-stack website: **React (Vite) frontend** + **Express backend** that
emails contact enquiries and internship applications straight to your inbox.

```
NCA-IT-Solution-website-main/
├── frontend/   → React website (Vite)
└── backend/    → Express API (emails via Nodemailer)
```

## Quick Start

### 1. Backend (do this first, so forms actually send email)
```bash
cd backend
npm install
cp .env.example .env      # then edit .env — see backend/README.md
npm run dev
```
Runs on `http://localhost:5000`.

### 2. Frontend
```bash
cd frontend
npm install
cp .env.example .env      # VITE_API_URL=http://localhost:5000 (default is fine locally)
npm run dev
```
Runs on `http://localhost:5173`.

---

## What was fixed / added in this pass

### Critical bug fix
Several imports referenced files with the **wrong letter case**
(e.g. `Services.css` vs actual `services.css`, `internship/hero.png` vs
actual `Internship/hero.png`). This works by accident on Windows/macOS
(case-insensitive file systems) but **fails a production build on any Linux
server** (Vercel, Netlify, Render, etc. all build on Linux) — this was almost
certainly why the site looked/behaved broken. All import paths were corrected
and a full production build now completes successfully.

### Navbar & header
- Added a **desktop-only top utility bar** (address, hours, Registration
  Form / Enquiry buttons, phone, LinkedIn/Instagram/Facebook) matching the
  reference screenshot.
- Rebuilt the **Services** nav item into a working dropdown submenu.
- Added quick-access **WhatsApp / Instagram / LinkedIn** icons directly in
  the navbar (desktop) and as a clean icon row in the mobile menu.
- Added a pulsing **floating WhatsApp button** visible on every page.
- Removed two dead/duplicate files (`MobileMenu.jsx`, `mobilMenu.jsx`) that
  weren't used anywhere.

### Working forms → real emails (new backend)
- `POST /api/contact` — the Contact page form now actually sends an email.
- `POST /api/internship-application` — the internship application form now
  submits (with resume file attached, PDF/DOC, 5MB max) and emails the team.
- Both forms have loading states, success/error messages, and validation.

### SEO
- Per-page `<title>`, meta description, canonical URL, Open Graph & Twitter
  card tags via `react-helmet-async`.
- `LocalBusiness` JSON-LD structured data on the homepage (helps Google
  Maps / local search show your address, hours, phone).
- `robots.txt` and `sitemap.xml` added.
- **Action needed from you:** replace `https://www.ncaitsolution.com` in
  `index.html`, `sitemap.xml`, and `src/components/SEO/SEO.jsx` with your
  real domain once you have one, and add a real `og-image.jpg` (1200x630)
  to `frontend/public/`.

### Code organization
- Centralized all contact info & social links in
  `frontend/src/config/siteConfig.js` — update your real Instagram/LinkedIn/
  Facebook URLs there **once** and every component picks it up.
- Consolidated the duplicated `navLinks` data into a single file.
- Converted footer's plain `<a>` internal links to React Router `<Link>`
  (faster navigation, no full page reloads).

## Still TODO / recommended next steps
- **Real social media URLs**: currently placeholders (`#`) in `siteConfig.js`
  — add your actual LinkedIn/Instagram/Facebook page links.
- **Image optimization**: several images in `assets/` are 1-2MB PNGs; converting
  to compressed WebP would meaningfully improve page-load speed (a real SEO
  ranking factor).
- **Domain & hosting**: once you have a live domain, update it in the SEO
  files listed above and deploy the backend somewhere it can stay running
  (Render/Railway/a VPS) — deploying only the frontend won't send emails.
