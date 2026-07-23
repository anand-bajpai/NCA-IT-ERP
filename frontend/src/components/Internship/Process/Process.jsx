import "./Process.css";
import {
  FaFileSignature,
  FaFileAlt,
  FaPhoneAlt,
  FaComments,
  FaRocket,
  FaCertificate
} from "react-icons/fa";

const processData = [
  {
    icon: <FaFileSignature />,
    title: "Apply Online",
    desc: "Submit your application details."
  },
  {
    icon: <FaFileAlt />,
    title: "Resume Review",
    desc: "Our team reviews your profile."
  },
  {
    icon: <FaPhoneAlt />,
    title: "Screening Call",
    desc: "Shortlisted candidates are contacted."
  },
  {
    icon: <FaComments />,
    title: "Technical Discussion",
    desc: "Basic technical evaluation."
  },
  {
    icon: <FaRocket />,
    title: "Internship Starts",
    desc: "Start working on real projects."
  },
  {
    icon: <FaCertificate />,
    title: "Certificate Issued",
    desc: "Receive certificate after completion."
  }
];

const Process = () => {
  return (
    <section className="process">
      <div className="process-container">

        <span className="section-tag">
          HOW IT WORKS
        </span>

        <h2>Internship Selection Process</h2>

        <div className="process-grid">

          {processData.map((item, index) => (
            <div className="process-card" key={index}>

              <div className="process-icon">
                {item.icon}
              </div>

              <span className="step-number">
                {index + 1}
              </span>

              <h3>{item.title}</h3>

              <p>{item.desc}</p>

            </div>
          ))}

        </div>

      </div>
    </section>
  );
};

export default Process;