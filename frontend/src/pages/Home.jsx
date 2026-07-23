import SEO from "../components/SEO/SEO";
import Hero from "../components/Hero/Hero";
import AboutSection from "../components/About/About";
import Services from "../components/Services/services";
import Courses from "../components/Courses/Courses";
import ConsultationCTA from "../components/ConsultationCTA/ConsultationCTA";
import Portfolio from "../components/Portfolio/Portfolio";
import Contact from "../components/Contact/Contact";
import Internship from "../components/Internship/Internship";
import FAQ from "../components/FAQ/FAQ";
import siteConfig from "../config/siteConfig";

const localBusinessSchema = {
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  name: siteConfig.companyName,
  description:
    "Custom software development, web & mobile app development, AI and cloud solutions, and IT internship programs.",
  telephone: siteConfig.phone,
  email: siteConfig.email,
  address: {
    "@type": "PostalAddress",
    streetAddress: siteConfig.address.line1,
    addressLocality: "Noida",
    addressRegion: "Uttar Pradesh",
    postalCode: "201309",
    addressCountry: "IN",
  },
  openingHours: "Mo-Sa 08:00-18:00",
  sameAs: [siteConfig.social.linkedin, siteConfig.social.instagram, siteConfig.social.facebook].filter(
    (l) => l && l !== "#"
  ),
};

const Home = () => {
  return (
    <>
      <SEO
        title="Home"
        description="NCA IT Solution, Noida — custom web & mobile app development, AI & cloud solutions, cyber security, and industry-ready internship programs."
        path="/"
        schema={localBusinessSchema}
      />
      <Hero />
      <AboutSection />
      <Services />
      <Courses />
      <ConsultationCTA />
      <Contact />
      <FAQ />
    </>
  );
};

export default Home;
