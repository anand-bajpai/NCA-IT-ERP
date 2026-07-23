import SEO from "../components/SEO/SEO";
import ServicesSection from "../components/Services/services";

const Services = () => {
  return (
    <>
      <SEO
        title="Our Services"
        description="Web development, mobile app development, AI solutions, cyber security, data science and cloud solutions — delivered by NCA IT Solution."
        path="/services"
      />
      <ServicesSection />
    </>
  );
};

export default Services;
