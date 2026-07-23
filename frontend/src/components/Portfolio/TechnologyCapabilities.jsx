import techImage from "../../assets/images/portfolio/tech.png";

const capabilities = [
  "Artificial Intelligence",
  "Cloud Computing",
  "DevOps",
  "Cyber Security",
  "Automation",
  "Data Engineering",
];

const TechnologyCapabilities = () => {
  return (
    <section className="capability-section">
      <div className="section-content">
        <h2>
          Improve and Evolve With Specialized Technology Capabilities
        </h2>

        <div className="capability-grid">
          {capabilities.map((item, index) => (
            <div key={index} className="capability-card">
              {item}
            </div>
          ))}
        </div>
      </div>

      <div className="section-image">
        <img src={techImage} alt="" />
      </div>
    </section>
  );
};

export default TechnologyCapabilities;