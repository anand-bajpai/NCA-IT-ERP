import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import "./NotFound.css";

const NotFound = () => {
  return (
    <div className="not-found">
      <Helmet>
        <title>Page Not Found | NCA IT Solution</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      <h1>404</h1>
      <p>Sorry, the page you're looking for doesn't exist.</p>
      <Link to="/" className="not-found-link">
        Back to Home
      </Link>
    </div>
  );
};

export default NotFound;
