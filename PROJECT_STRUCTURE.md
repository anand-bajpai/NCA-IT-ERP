# NCA IT Solution — Project Structure Guide

Yeh document isliye hai taaki jab bhi koi cheez change karni ho, aapko pata ho
**exactly kaunsi file kholni hai** — poora code khangalna na pade.

---

## 📁 Top-Level Structure

```
NCA-IT-Solution-website-main/
├── frontend/     → Website (React + Vite) — jo user ko dikhta hai
└── backend/      → Server (Express + MongoDB) — forms save to DB and email you
```

---

## ⚡ Sabse Common Changes — Yahan Jaayein

| Aapko yeh change karna hai... | Yeh file kholein |
|---|---|
| Phone number, email, address, hours | `frontend/src/config/siteConfig.js` |
| Social media links (Instagram, LinkedIn, Facebook, WhatsApp) | `frontend/src/config/siteConfig.js` |
| Navbar ke menu items (Home, About, Services...) | `frontend/src/data/navLinks.js` |
| Logo text ("NCA IT SOLUTIONS") | `frontend/src/components/Navbar/Navbar.jsx` |
| Navbar/TopBar ka design (colors, spacing) | `frontend/src/components/Navbar/Navbar.css` + `TopBar.css` |
| Home page ka hero banner (heading, text) | `frontend/src/components/Hero/Hero.jsx` |
| Services list (titles, descriptions, icons) | `frontend/src/data/Services.js` + `frontend/src/components/Services/services.jsx` |
| Courses list | `frontend/src/data/courses.js` |
| Course full detail page (syllabus, benefits, rating) | `frontend/src/components/Courses/CourseDetail.jsx` (data comes from `data/courses.js`) |
| Service "Learn More" popup content | `frontend/src/data/Services.js` (fields: `deliverables`, `technologies`, `idealFor`) |
| MongoDB connection string | `backend/.env` → `MONGODB_URI` |
| Saved form submissions dekhna hai | `backend/.env` → `ADMIN_API_KEY` set karo, phir `backend/README.md` me "Viewing saved submissions" dekho |
| Where course-enrollment emails go | `backend/.env` → `CONTACT_RECEIVER` (same inbox as other forms) |
| Portfolio projects | `frontend/src/data/portfolio.js` |
| FAQ questions/answers | `frontend/src/data/faq.js` |
| Testimonials | `frontend/src/data/testmonials.js` |
| Internship domains (MERN, Python, AI...) | `frontend/src/data/internship.js` |
| Certificates list | `frontend/src/data/certificates.js` |
| Contact page form fields | `frontend/src/components/Contact/Contact.jsx` |
| Footer links/columns | `frontend/src/components/Footer/Footer.jsx` |
| Website ka overall color theme | `frontend/src/styles/variables.css` |
| Page title / SEO description (per page) | Har page ke andar `<SEO title=... description=... />` — e.g. `frontend/src/pages/Home.jsx` |
| Email kis address pe aaye (backend) | `backend/.env` → `CONTACT_RECEIVER` |
| Gmail se email bhejne ki setting | `backend/.env` → `EMAIL_USER`, `EMAIL_PASS` |

---

## 🗂️ Full Folder Tree

```
frontend/
├── index.html                     → Page <title>, meta tags (default SEO)
├── package.json                   → Installed libraries
├── public/
│   ├── favicon.svg
│   ├── robots.txt                 → Search engines ko crawl karne ki permission
│   └── sitemap.xml                → Saare page URLs (Google ke liye)
│
└── src/
    ├── main.jsx                   → App ka entry point (rarely edit karna padega)
    ├── App.jsx                    → Saare Routes/Pages yahan register hote hain
    │
    ├── config/
    │   └── siteConfig.js          → ⭐ Phone, email, address, social links — SAB YAHAN
    │
    ├── data/                      → ⭐ Website ka saara TEXT CONTENT yahan (edit karna asaan)
    │   ├── navLinks.js            → Navbar menu items
    │   ├── Services.js            → Services list
    │   ├── courses.js              → Courses list
    │   ├── portfolio.js           → Portfolio projects
    │   ├── faq.js                 → FAQ
    │   ├── testmonials.js         → Testimonials
    │   ├── internship.js          → Internship domains
    │   ├── certificates.js        → Certificates
    │   └── heroSlides.js          → Hero banner slides (agar slider hai)
    │
    ├── pages/                     → Har route/page ka wrapper (SEO + section imports)
    │   ├── Home.jsx
    │   ├── About.jsx
    │   ├── Services.jsx
    │   ├── Courses.jsx
    │   ├── Portfolio.jsx
    │   ├── Internship.jsx
    │   ├── Certificates.jsx
    │   ├── Contact.jsx
    │   └── NotFound.jsx           → 404 page
    │
    ├── layouts/
    │   └── MainLayout.jsx         → Navbar + Footer + WhatsApp button ka wrapper
    │                                 (har page ke upar-neeche yehi lagta hai)
    │
    ├── components/                → Actual UI banane wale components (design + logic)
    │   ├── Navbar/
    │   │   ├── Navbar.jsx         → Menu, logo, dropdown, mobile menu
    │   │   ├── Navbar.css
    │   │   ├── TopBar.jsx         → Sabse upar wali dark strip (address/hours/phone)
    │   │   └── TopBar.css
    │   ├── Hero/                  → Home page ka pehla banner section
    │   ├── About/                 → About section
    │   ├── Services/              → Services cards section
    │   ├── Courses/               → Courses cards section
    │   ├── Portfolio/             → Portfolio ke kai chote components
    │   ├── Internship/            → Internship page ke sections (Hero, Domains, Form...)
    │   ├── Certificate/           → Certificates section
    │   ├── Contact/               → Contact form + info
    │   ├── Footer/                → Footer (links, social icons, scroll-to-top button)
    │   ├── FAQ/                   → FAQ accordion
    │   ├── FloatingWhatsApp/      → Bottom-right floating WhatsApp button
    │   ├── ScrollToTop/           → Page change pe top scroll karne wala logic
    │   ├── Modal/                 → Reusable popup (Service details, Course enroll form)
    │   ├── EnrollmentForm/        → Course enrollment form (used in modal + course detail page)
    │   └── SEO/                   → Reusable SEO/meta-tag component
    │
    ├── assets/
    │   ├── images/                → Saari images (logo, services, courses, portfolio...)
    │   └── videos/                → Hero background video
    │
    ├── styles/
    │   ├── variables.css          → ⭐ Colors, fonts (global theme yahan se control hota hai)
    │   ├── global.css             → Global base styling
    │   ├── reset.css              → Browser default styles reset
    │   └── responsive.css         → Common responsive rules
    │
    ├── hooks/                     → Custom React hooks (counter animation, scroll detect)
    └── utils/                     → Chhoti helper functions/constants

backend/
└── src/
    ├── server.js                  → Server start yahan se hota hai (DB connect bhi yahin se)
    ├── config/
    │   └── db.js                  → MongoDB connection (resilient — DB fail ho to bhi server chalta rehta hai)
    ├── models/                    → MongoDB collections ka structure
    │   ├── Contact.js
    │   ├── InternshipApplication.js
    │   └── CourseEnrollment.js
    ├── routes/
    │   ├── contactRoutes.js       → POST /api/contact + GET (admin) saved enquiries
    │   ├── internshipRoutes.js    → POST /api/internship-application + GET (admin)
    │   └── courseEnrollmentRoutes.js → POST /api/course-enrollment + GET (admin)
    ├── controllers/
    │   ├── contactController.js   → DB me save + email dono
    │   ├── internshipController.js→ DB me save + resume attach karke email
    │   └── courseEnrollmentController.js → DB me save + email
    ├── middleware/
    │   ├── upload.js              → Resume file upload rules (size/type limit)
    │   └── requireAdminKey.js     → GET (admin) endpoints ko x-admin-key se protect karta hai
    └── utils/
        ├── mailer.js              → Nodemailer (Gmail) setup
        └── emailTemplate.js       → Email ka HTML design
```

---

## 🧭 Kaise Dhoondein — Quick Rule of Thumb

1. **Sirf text/content change karna hai?** → `src/data/` folder me jaao.
2. **Design/color/spacing change karna hai?** → us component ki `.css` file me jaao
   (e.g. Navbar design ke liye `Navbar.css`).
3. **Kaunsa section kis page pe hai, yeh dekhna hai?** → `src/pages/` ki
   respective file kholo (e.g. `Home.jsx` dekhega ki Home page pe Hero, About,
   Services, Courses, Contact, FAQ is order me lage hain).
4. **Phone/email/social link har jagah change karna hai?** → Sirf ek file:
   `src/config/siteConfig.js` — poori site update ho jayegi.
5. **Email kahin nahi ja raha?** → `backend/.env` check karo (`EMAIL_USER`, `EMAIL_PASS`).
6. **Data database me save nahi ho raha?** → `backend/.env` me `MONGODB_URI` check karo,
   aur server start karte waqt terminal me `✅ MongoDB connected` dikhna chahiye.

---

## ⚠️ Do's and Don'ts

- ✅ `src/data/*.js` aur `src/config/siteConfig.js` — yeh safely edit kar sakte ho,
  yeh sirf text/links hote hain, tootne ka risk kam hai.
- ⚠️ `src/components/**/*.jsx` — yeh JSX/logic hai, edit karte waqt bracket
  `{ }` aur quotes `" "` sambhal ke edit karna, warna build fail ho sakta hai.
- ⚠️ File/folder ka **naam case-sensitive** hai (e.g. `Services.js` aur
  `services.js` alag hain) — isi wajah se pehle ek bada bug aaya tha. Naya file
  add karte waqt import path ka case bilkul file ke naam jaisa hi rakhna.

---

## 🔐 Admin Panel (Phase 1 — Live)

**Access:** `/admin/login` → Dashboard at `/admin/dashboard`

**Setup (one-time):**
1. Set `MONGODB_URI` in `backend/.env` (MongoDB Atlas free tier works — see backend/README.md).
2. Set `JWT_SECRET` to any long random string in `backend/.env`.
3. Set `ADMIN_NAME`, `ADMIN_EMAIL`, `ADMIN_PASSWORD` in `backend/.env`.
4. Run `cd backend && npm run create-admin` — this creates your first admin login.
5. Start backend + frontend, go to `/admin/login`, log in with that email/password.

**What's live in Phase 1:**
- Secure JWT login (httpOnly cookie), protected routes on frontend
- Dashboard with real stat cards + Monthly Admissions / Course-wise charts
- Full Student CRUD — add/edit/delete, photo upload, search, filters, pagination

**Sidebar items marked "Soon"** (Certificates, Internships, Clients, Fee Receipts,
ID Cards, Course Enrollments, Contact Forms, Newsletter, Settings) are placeholders
for the next phases — not built yet, so they're visible but disabled.

**Key files:**
```
frontend/src/admin/          → Entire admin panel (separate from public site)
backend/src/models/Admin.js  → Admin login schema (bcrypt-hashed password)
backend/src/models/Student.js→ Student schema
backend/src/middleware/authenticateAdmin.js → JWT guard for all /api/admin/* routes
backend/src/scripts/createAdmin.js → CLI script to create your first admin
```
