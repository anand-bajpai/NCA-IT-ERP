import successImage from "../../assets/images/portfolio/SuccessStories.png";

const SuccessStories = () => {
  const stats = [
    { number: "500+", title: "Projects Delivered" },
    { number: "100+", title: "Clients Served" },
    { number: "1000+", title: "Students Trained" },
    { number: "10+", title: "Years Experience" },
  ];

  return (
    <section className="success-section">
      <div className="section-image">
        <img src={successImage} alt="" />
      </div>

      <div className="section-content">
        <h2>Success Stories</h2>

        <div className="stats-grid">
          {stats.map((item, index) => (
            <div className="stat-card" key={index}>
              <h3>{item.number}</h3>
              <p>{item.title}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default SuccessStories;