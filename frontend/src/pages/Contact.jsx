import SEO from "../components/SEO/SEO";
import Contact from "../components/Contact/Contact";

const ContactPage = () => {
  return (
    <>
      <SEO
        title="Contact Us"
        description="Get in touch with NCA IT Solution, Sector 62 Noida. Call, WhatsApp or send us an enquiry for project development, training or internship queries."
        path="/contact"
      />
      <Contact />
    </>
  );
};

export default ContactPage;
