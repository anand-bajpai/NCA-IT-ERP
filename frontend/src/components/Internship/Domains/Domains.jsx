import "./Domains.css";
import { Link } from "react-router-dom";
import mern from "../../../assets/images/Internship/mern.png";
import python from "../../../assets/images/Internship/python.png";
import ai from "../../../assets/images/Internship/ai.png";
import cyber from "../../../assets/images/Internship/cyber.png";
import java from "../../../assets/images/Internship/java.png";
import cloud from "../../../assets/images/Internship/cloud.png";
import {
  FaCode,
  FaPython,
  FaRobot,
  FaShieldAlt,
  FaJava,
  FaCloud
} from "react-icons/fa";

const domains = [
  {
    icon:<FaCode />,
    title:"MERN Stack Development",
    duration:"2 Months"
  },
  {
    icon:<FaPython />,
    title:"Python Development",
    duration:"2 Months"
  },
  {
    icon:<FaRobot />,
    title:"Artificial Intelligence",
    duration:"3 Months"
  },
  {
    icon:<FaShieldAlt />,
    title:"Cyber Security",
    duration:"3 Months"
  },
  {
    icon:<FaJava />,
    title:"Java Full Stack",
    duration:"2 Months"
  },
  {
    icon:<FaCloud />,
    title:"Cloud Computing",
    duration:"2 Months"
  }
];

const Domains = () => {
  return (
    <section className="domains">

      <div className="domains-container">

        <span className="section-tag">
          WHAT YOU CAN LEARN
        </span>

        <h2>Internship Domains</h2>

        <div className="domains-grid">

          {domains.map((domain,index)=>(
            <div className="domain-card" key={index}>

              <div className="domain-icon">
                {domain.icon}
              </div>

              <h3>{domain.title}</h3>

              <ul>
                <li>{domain.duration}</li>
                <li>Live Projects</li>
                <li>Expert Mentorship</li>
              </ul>

              <Link to={`/internship?domain=${encodeURIComponent(domain.title)}#apply`}>
                Explore →
              </Link>

            </div>
          ))}

        </div>

      </div>
    </section>
  );
};

export default Domains;
