import "./Stats.css";
import {
  FaUsers,
  FaGraduationCap,
  FaBriefcase,
  FaUserTie
} from "react-icons/fa";

const stats = [
  {
    icon:<FaUsers />,
    value:"1247+",
    label:"Students Trained"
  },
  {
    icon:<FaGraduationCap />,
    value:"638+",
    label:"Internships Completed"
  },
  {
    icon:<FaBriefcase />,
    value:"412+",
    label:"Successful Placements"
  },
  {
    icon:<FaUserTie />,
    value:"56+",
    label:"Industry Mentors"
  }
];

const Stats = () => {
  return (
    <section className="stats">

      <div className="stats-container">

        <h2>Our Impact in Numbers</h2>

        <div className="stats-grid">

          {stats.map((stat,index)=>(
            <div className="stat-card" key={index}>

              <div className="stat-icon">
                {stat.icon}
              </div>

              <h3>{stat.value}</h3>

              <p>{stat.label}</p>

            </div>
          ))}

        </div>

      </div>
    </section>
  );
};

export default Stats;