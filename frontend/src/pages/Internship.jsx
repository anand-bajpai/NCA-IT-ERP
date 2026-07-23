import SEO from "../components/SEO/SEO";
import Internship from "../components/Internship/Internship";

const InternshipPage = () => {
  return (
    <>
      <SEO
        title="Internship Programs"
        description="Apply for hands-on internships in MERN Stack, Python, AI and Cyber Security with certification and placement guidance at NCA IT Solution."
        path="/internship"
      />
      <Internship />
    </>
  );
};

export default InternshipPage;
