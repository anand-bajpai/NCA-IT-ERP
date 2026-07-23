import SEO from "../components/SEO/SEO";
import Courses from "../components/Courses/Courses";

const CoursesPage = () => {
  return (
    <>
      <SEO
        title="Courses"
        description="Industry-oriented courses in MERN Stack, Python, AI, Cyber Security, Java Full Stack and Cloud Computing at NCA IT Solution, Noida."
        path="/courses"
      />
      <Courses />
    </>
  );
};

export default CoursesPage;
