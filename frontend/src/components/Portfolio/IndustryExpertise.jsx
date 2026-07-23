import education from "../../assets/images/portfolio/Education.png";
import healthcare from "../../assets/images/portfolio/Healthcare.png";
import ecommerce from "../../assets/images/portfolio/e-commers.jpeg";
const industries = [
  {
    title: "Healthcare",
    image: healthcare,
  },
  {
    title: "Education",
    image: education,
  },
  {
    title: "E-Commerce",
    image: ecommerce,
  },
];

const IndustryExpertise = () => {
  return (
    <section className="industry-section">
      <h2>Our Industry Expertise</h2>

      <div className="industry-grid">
        {industries.map((industry, index) => (
          <div className="industry-card" key={index}>
            <img src={industry.image} alt="" />
            <h3>{industry.title}</h3>
          </div>
        ))}
      </div>
    </section>
  );
};

export default IndustryExpertise;