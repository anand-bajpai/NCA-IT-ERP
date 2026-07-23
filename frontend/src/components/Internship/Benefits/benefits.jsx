import "./Benefits.css";

const benefits = [
"Live Industry Projects",
"Internship Certificate",
"Letter of Recommendation",
"Placement Assistance",
"Resume Building",
"Mock Interviews",
"Expert Mentorship",
"PPO Opportunities"
];

const Benefits = () => {
  return (
    <section className="benefits">

      <div className="benefits-container">

        <span className="section-tag">
          WHY CHOOSE US
        </span>

        <h2>Internship Benefits</h2>

        <div className="benefits-grid">

          {benefits.map((item,index)=>(
            <div className="benefit-card" key={index}>
              {item}
            </div>
          ))}

        </div>

      </div>
    </section>
  );
};

export default Benefits;