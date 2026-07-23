import { useParams } from "react-router-dom";
import SEO from "../components/SEO/SEO";
import CourseDetail from "../components/Courses/CourseDetail";
import { usePublicCourse } from "../hooks/usePublicCourse";

const CourseDetailPage = () => {
  const { slug } = useParams();
  const { course } = usePublicCourse(slug);

  return (
    <>
      <SEO
        title={course ? course.title : "Course Details"}
        description={
          course
            ? `${course.about} Duration: ${course.duration}. Rated ${course.rating}/5 by ${course.totalRatings}+ students.`
            : "Explore detailed course information at NCA IT Solution."
        }
        path={`/courses/${slug}`}
      />
      <CourseDetail />
    </>
  );
};

export default CourseDetailPage;
