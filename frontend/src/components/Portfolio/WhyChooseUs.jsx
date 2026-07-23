import whyImage from "../../assets/images/portfolio/WhyBusinesses.png";

const reasons = [
  "Experienced Team",
  "Agile Development",
  "Security First",
  "Modern Tech Stack",
  "Fast Delivery",
  "24/7 Support",
];

const WhyChooseUs = () => {
  return (
    <section className="why-section">
      <div className="section-image">
        <img src={whyImage} alt="" />
      </div>

      <div className="section-content">
        <h2>Why Businesses Choose NCA IT Solutions</h2>

        <div className="reason-grid">
          {reasons.map((item, index) => (
            <div className="reason-card" key={index}>
              {item}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default WhyChooseUs;