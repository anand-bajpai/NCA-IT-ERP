export const navLinks = [
  { title: "Home", path: "/" },
  { title: "About", path: "/about" },
  {
    title: "Services",
    path: "/services",
    children: [
      { title: "Web Development", path: "/services#web-development" },
      { title: "Mobile App Development", path: "/services#mobile-app-development" },
      { title: "AI Solutions", path: "/services#ai-solutions" },
      { title: "Cyber Security", path: "/services#cyber-security" },
      { title: "Data Science", path: "/services#data-science" },
      { title: "Cloud Solutions", path: "/services#cloud-solutions" },
    ],
  },
  { title: "Courses", path: "/courses" },
  { title: "Portfolio", path: "/portfolio" },
  { title: "Internship", path: "/internship" },
  { title: "Certificate Verification", path: "/certificate-verification" },
  { title: "Contact", path: "/contact" },
];

export default navLinks;
