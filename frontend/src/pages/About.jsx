import SEO from "../components/SEO/SEO";
import AboutSection from "../components/About/About";

const About = () => {
  return (
    <>
      <SEO
        title="About Us"
        description="Learn about NCA IT Solution — our mission, team, and journey delivering software development services and IT training programs from Noida."
        path="/about"
      />
      <AboutSection />
    </>
  );
};

export default About;
