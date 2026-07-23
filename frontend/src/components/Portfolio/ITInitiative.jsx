import secureImage from "../../assets/images/portfolio/SecuretheSuccess.png";
const steps = [
  "Requirement Analysis",
  "Planning",
  "Development",
  "Testing",
  "Deployment",
  "Maintenance",
];

const ITInitiative = () => {
  return (
    <section className="initiative-section">
      <div className="section-image">
        <img src={secureImage} alt="" />
      </div>

      <div className="section-content">
        <h2>Secure the Success of Your IT Initiative</h2>

        <div className="timeline">
          {steps.map((step, index) => (
            <div key={index} className="timeline-item">
              {step}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ITInitiative;