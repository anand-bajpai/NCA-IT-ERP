import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import "./Hero.css";
import heroVideo from "../../assets/videos/hero-bg.mp4";

const heroTexts = [
  {
    title: "Transforming Ideas Into Digital Excellence",
    description:
      "NCA IT Solutions helps startups and enterprises build modern web applications and scalable software products.",
  },
  {
    title: "AI Powered Software Solutions",
    description:
      "Leverage Artificial Intelligence to automate processes and accelerate business growth.",
  },
  {
    title: "Custom Web & Mobile Applications",
    description:
      "From startup MVPs to enterprise applications, we build everything you need.",
  },
  {
    title: "Industry Ready Training Programs",
    description:
      "Learn MERN Stack, AI, Cyber Security and modern technologies from experts.",
  },
  {
    title: "Innovate • Connect • Accelerate",
    description:
      "Helping businesses and students achieve digital excellence through technology.",
  },
];

const Counter = ({ target, duration = 2000 }) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let start = 0;
  
    const stepTime = Math.abs(Math.floor(duration / target));
    
  
    const increment = target > 10 ? Math.ceil(target / 50) : 1;

    const timer = setInterval(() => {
      start += increment;
      if (start >= target) {
        setCount(target); // Target hit hote hi exact value set karein
        clearInterval(timer);
      } else {
        setCount(start);
      }
    }, stepTime || 100); // Safe minimum interval 30ms

    return () => clearInterval(timer);
  }, [target, duration]);

  return <>{count}</>;
};


const Hero = () => {
  const [currentText, setCurrentText] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentText((prev) => (prev + 1) % heroTexts.length);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  return (
    <section className="hero">
      {/* Background Video */}
      <video className="hero-video" autoPlay muted loop playsInline>
        <source src={heroVideo} type="video/mp4" />
      </video>

      {/* Overlay */}
      <div className="hero-overlay"></div>

      {/* Hero Content */}
      <div className="hero-content">
        <span className="hero-badge">
          🚀 Empowering Businesses with Technology
        </span>

        <h1 key={currentText} className="hero-title fade" style={{ color: "#ffffff" }}>
          {heroTexts[currentText].title}
        </h1>

        <p key={`desc-${currentText}`} className="hero-description fade"  style={{ color: "#ffffff" }}>
          {heroTexts[currentText].description}
        </p>

        <div className="hero-buttons">
          <Link to="/contact" className="primary-btn">Get Free Consultation</Link>
          <Link to="/portfolio" className="secondary-btn">View Portfolio</Link>
        </div>

        {/* Stats Section: Yahan humne Counter component use kiya hai */}
        <div className="hero-stats">
          <div className="stat">
            <h2><Counter target={33} />+</h2>
            <p  style={{ color: "#ffffff" }}>Projects</p>
          </div>

          <div className="stat">
            <h2  style={{ color: "#ffffff" }}><Counter target={52} />+</h2>
            <p  style={{ color: "#ffffff" }}>Clients</p>
          </div>

          <div className="stat">
            <h2><Counter target={2} />+</h2>
            <p  style={{ color: "#ffffff" }}>Years Experience</p>
          </div>

          <div className="stat">
            <h2><Counter target={12} />+</h2>
            <p  style={{ color: "#ffffff" }}>Experts</p>
          </div>
        </div>

        <div className="scroll-indicator">↓ Scroll Down</div>
      </div>
    </section>
  );
};
export default Hero;