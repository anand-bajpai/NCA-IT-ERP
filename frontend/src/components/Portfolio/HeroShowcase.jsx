import heroImage from "../../assets/images/portfolio/HeroShowcase.png";

const HeroShowcase = () => {
  return (
    <section className="hero-showcase">
      <div className="hero-content">
        <span className="section-tag">SUCCESS STORIES</span>

        <h1>
          Software Consulting
          <br />
          and Development
        </h1>

        <p>
          Delivering project success no matter what industry you're in.
        </p>

        <div className="industry-buttons">
          <button>Healthcare</button>
          <button>Education</button>
          <button>Retail</button>
          <button>AI</button>
          <button>Cloud</button>
        </div>
      </div>

      <div className="hero-image">
        <img src={heroImage} alt="Hero Showcase" />
      </div>
    </section>
  );
};

export default HeroShowcase;