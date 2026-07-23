// ============================================================
// CENTRAL SITE CONFIG
// Update phone / email / address / social links in ONE place.
// Every component (TopBar, Navbar, Footer, Contact, Floating
// buttons) reads from here, so you never have to hunt through
// the codebase again to change a phone number or a social URL.
// ============================================================

export const siteConfig = {
  companyName: "NCA IT Solution",
  tagline: "Web Development & App Development",

  phone: "+918287584509",
  phoneDisplay: "08287584509",

  email: "ncaitsolutionnoida@gmail.com",

  address: {
    line1: "Iconic Corenthum Tower, Floor No - 7, Office No - 705",
    line2: "Electronic City Metro Station, Noida Sector 62",
    full: "Iconic Corenthum Tower, Floor 7, Office No-705A, Near Electronic City Metro Station, Sector 62, Noida, Uttar Pradesh 201309",
  },

  hours: "Opening : 9 AM to 6 PM (Sunday Close)",

  // TODO: replace "#" with your real profile URLs
  social: {
    whatsapp: "https://wa.me/918287584509",
    linkedin: "#", // e.g. https://www.linkedin.com/company/nca-it-solution
    instagram: "#", // e.g. https://www.instagram.com/ncaitsolution
    facebook: "#", // e.g. https://www.facebook.com/ncaitsolution
    youtube: "#",
  },

  links: {
    registrationForm: "/internship#apply",
    enquiry: "/contact",
  },

  // Base URL of the backend API. Set VITE_API_URL in an .env file
  // when deploying (e.g. https://api.ncaitsolution.com).
  apiBaseUrl: import.meta.env.VITE_API_URL || "http://localhost:5000",
};

export default siteConfig;
