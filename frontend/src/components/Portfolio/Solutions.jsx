import solutionImage from "../../assets/images/portfolio/SolutionWe.png";

const solutions = [
  "ERP Solutions",
  "CRM Systems",
  "AI Solutions",
  "Cloud Solutions",
  "Mobile Applications",
  "Web Applications",
];

const Solutions = () => {
  return (
    <section className="solution-section">
      <div className="section-content">
        <h2>Solutions We Deliver</h2>

        <div className="solution-grid">
          {solutions.map((item, index) => (
            <div key={index} className="solution-card">
              {item}
            </div>
          ))}
        </div>
      </div>

      <div className="section-image">
        <img src={solutionImage} alt="" />
      </div>
    </section>
  );
};

export default Solutions;