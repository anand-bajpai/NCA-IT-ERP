import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import "./About.css";

import aboutImage from "../../assets/images/about/about-image.png";
import coding from "../../assets/images/about/coding.jpg";
import teamDiscussion from "../../assets/images/about/Team-discussion.jpg";
import training from "../../assets/images/about/training-session.jpg";

const aboutImages = [
  coding,
  teamDiscussion,
  training,
  aboutImage,
];

const About = () => {
  const [currentImage, setCurrentImage] = useState(0);
  const { pathname } = useLocation();
  const isOnAboutPage = pathname === "/about";

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImage(
        (prev) => (prev + 1) % aboutImages.length
      );
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  return (
    <section className="about">
      <div className="about-container">

        {/* Left Side Image Slider */}
        <div className="about-image">
          <img
            src={aboutImages[currentImage]}
            alt="About NCA IT Solutions"
            className="about-slider-image"
          />
        </div>

        {/* Right Side Content */}
        <div className="about-content">

          <span className="section-tag">
            ABOUT US
          </span>

          <h2>
            Empowering Businesses Through
            <br />
            Technology & Innovation
          </h2>

          <p>
            NCA IT Solutions provides software development,
            AI solutions, internship programs, and corporate
            training to help businesses and students grow in
            the digital era.
          </p>

          <div className="about-features">
            <div>✅ Expert Development Team</div>
            <div>✅ AI Powered Solutions</div>
            <div>✅ Industry Ready Training</div>
            <div>✅ Real World Projects</div>
          </div>

          <Link to={isOnAboutPage ? "/contact" : "/about"} className="about-btn">
            {isOnAboutPage ? "Talk to Us" : "Learn More"}
          </Link>

        </div>

      </div>
    </section>
  );
};

export default About;