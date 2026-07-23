import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { FaStar, FaCheckCircle, FaClock, FaBookOpen, FaUserGraduate } from "react-icons/fa";

import { usePublicCourse } from "../../hooks/usePublicCourse";
import { resolveCourseImage } from "../../utils/resolveCourseImage";
import Modal from "../Modal/Modal";
import EnrollmentForm from "../EnrollmentForm/EnrollmentForm";
import "./CourseDetail.css";

const CourseDetail = () => {
  const { slug } = useParams();
  const [showEnroll, setShowEnroll] = useState(false);

  const { course, loading, notFound } = usePublicCourse(slug);

  if (notFound) {
    return (
      <section className="course-detail-notfound">
        <h2>Course not found</h2>
        <Link to="/courses">← Back to all courses</Link>
      </section>
    );
  }

  if (!course) {
    return loading ? null : (
      <section className="course-detail-notfound">
        <h2>Course not found</h2>
        <Link to="/courses">← Back to all courses</Link>
      </section>
    );
  }

  return (
    <section className="course-detail">
      <div className="course-detail-container">

        {/* Left: Main content */}
        <div className="course-detail-main">

          <Link to="/courses" className="back-link">← Back to all courses</Link>

          <span className="course-level">{course.level}</span>
          <h1>{course.title}</h1>

          <div className="course-detail-meta">
            <span className="rating">
              <FaStar className="star-icon" /> {course.rating}
              <span className="rating-count"> ({course.totalRatings} ratings)</span>
            </span>
            <span><FaUserGraduate /> {course.students}</span>
            <span><FaClock /> {course.duration}</span>
            {course.totalLectures > 0 && (
              <span><FaBookOpen /> {course.totalLectures} Lectures</span>
            )}
          </div>

          <img src={resolveCourseImage(course.image)} alt={course.title} className="course-detail-image" />

          <h2>About this course</h2>
          <p className="course-about">{course.about}</p>

          <h2>Syllabus / What you'll learn</h2>
          <ul className="course-list">
            {course.syllabus.map((item, i) => (
              <li key={i}><FaCheckCircle className="check-icon" /> {item}</li>
            ))}
          </ul>

          <h2>Benefits you get</h2>
          <ul className="course-list">
            {course.benefits.map((item, i) => (
              <li key={i}><FaCheckCircle className="check-icon" /> {item}</li>
            ))}
          </ul>

          <h2>What you'll be able to do (Upskilling)</h2>
          <ul className="course-list">
            {course.upskills.map((item, i) => (
              <li key={i}><FaCheckCircle className="check-icon" /> {item}</li>
            ))}
          </ul>

        </div>

        {/* Right: Sticky enroll card */}
        <div className="course-detail-sidebar">
          <div className="enroll-card">

            <div className="enroll-price">
              <span className="new-price">₹{course.discountPrice}</span>
              <span className="old-price">₹{course.originalPrice}</span>
              <span className="discount-badge">{course.discount}% OFF</span>
            </div>

            <button className="enroll-card-btn" onClick={() => setShowEnroll(true)}>
              Enroll Now
            </button>

            <ul className="enroll-card-info">
              <li><FaClock /> Duration: {course.duration}</li>
              <li><FaUserGraduate /> Level: {course.level}</li>
              {course.totalLectures > 0 && (
                <li><FaBookOpen /> {course.totalLectures} Lectures</li>
              )}
              <li><FaStar /> Rated {course.rating} / 5</li>
            </ul>

            <a
              href="https://wa.me/918287584509"
              target="_blank"
              rel="noreferrer"
              className="enroll-whatsapp-link"
            >
              Have questions? Chat on WhatsApp
            </a>
          </div>
        </div>

      </div>

      <Modal isOpen={showEnroll} onClose={() => setShowEnroll(false)}>
        <EnrollmentForm
          courseTitle={course.title}
          onSuccess={() => setShowEnroll(false)}
        />
      </Modal>
    </section>
  );
};

export default CourseDetail;
