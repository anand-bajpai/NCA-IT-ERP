import { useState } from "react";
import { Link } from "react-router-dom";
import { FaStar } from "react-icons/fa";
import "./Courses.css";
import { usePublicCourses } from "../../hooks/usePublicCourses";
import { resolveCourseImage } from "../../utils/resolveCourseImage";
import Modal from "../Modal/Modal";
import EnrollmentForm from "../EnrollmentForm/EnrollmentForm";

const Courses = () => {
  const [enrollCourse, setEnrollCourse] = useState(null);
  const { courses } = usePublicCourses();

  return (
    <section className="courses">
      <div className="courses-container">

        {/* Header */}
        <div className="courses-header">
          <span className="section-tag">
            OUR COURSES
          </span>

          <h2>
            Learn Industry Ready Skills
          </h2>

          <p>
            Explore our professional training programs designed
            to make you industry ready with real world projects
            and expert mentorship.
          </p>
        </div>

        {/* Courses Grid */}
        <div className="courses-grid">

          {courses.map((course) => (
            <div className="course-card" key={course._id || course.id}>

              {/* Course Image */}
              <div className="course-image">
                <img
                  src={resolveCourseImage(course.image)}
                  alt={course.title}
                />
              </div>

              {/* Course Content */}
              <div className="course-content">

                <span className="course-level">
                  {course.level}
                </span>

                <h3>{course.title}</h3>

                <div className="course-rating">
                  <FaStar className="star-icon" />
                  {course.rating} <span>({course.totalRatings})</span>
                </div>

                <div className="course-info">
                  <span>⏳ {course.duration}</span>
                  <span>👨‍🎓 {course.students}</span>
                </div>

                {/* Price */}
                <div className="course-price">
                  <span className="old-price">
                    ₹{course.originalPrice}
                  </span>

                  <span className="new-price">
                    ₹{course.discountPrice}
                  </span>

                  <span className="discount-badge">
                    {course.discount}% OFF
                  </span>
                </div>

                {/* Buttons */}
                <div className="course-buttons">

                  <button
                    className="course-btn enroll-btn"
                    onClick={() => setEnrollCourse(course.title)}
                  >
                    Enroll Now
                  </button>

                  <Link
                    to={`/courses/${course.slug}`}
                    className="course-btn view-btn"
                  >
                    View Course
                  </Link>

                </div>

              </div>
            </div>
          ))}

        </div>
      </div>

      <Modal isOpen={!!enrollCourse} onClose={() => setEnrollCourse(null)}>
        <EnrollmentForm
          courseTitle={enrollCourse}
          onSuccess={() => setEnrollCourse(null)}
        />
      </Modal>
    </section>
  );
};

export default Courses;
