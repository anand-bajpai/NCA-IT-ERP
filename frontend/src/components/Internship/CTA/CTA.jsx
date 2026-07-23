import { Link } from "react-router-dom";
import "./CTA.css";

const CTA = () => {
  return (
    <section className="internship-cta">

      <div className="cta-container">

        <div>
          <h2>
            Ready to Start Your Career Journey?
          </h2>

          <p>
            Join thousands of students who trusted us.
          </p>
        </div>

        <Link to="/internship#apply" className="cta-btn">
          Apply Now →
        </Link>

      </div>

    </section>
  );
};

export default CTA;
