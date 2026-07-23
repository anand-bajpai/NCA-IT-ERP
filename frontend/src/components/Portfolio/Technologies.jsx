import ourTech from "../../assets/images/portfolio/ourtech.png";

const techs = [
  "React",
  "Node.js",
  "MongoDB",
  "AWS",
  "Docker",
  "Python",
  "Java",
  "Firebase",
];

const Technologies = () => {
  return (
    <section className="technology-section">
      <div className="section-content">
        <h2>Technologies and Platforms We Work With</h2>

        <div className="technology-grid">
          {techs.map((tech, index) => (
            <div key={index} className="technology-card">
              {tech}
            </div>
          ))}
        </div>
      </div>

      <div className="section-image">
        <img src={ourTech} alt="" />
      </div>
    </section>
  );
};

export default Technologies;