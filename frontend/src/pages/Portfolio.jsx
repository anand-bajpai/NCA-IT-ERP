import SEO from "../components/SEO/SEO";
import Portfolio from "../components/Portfolio/Portfolio";

const PortfolioPage = () => {
  return (
    <>
      <SEO
        title="Portfolio"
        description="Explore projects delivered by NCA IT Solution — e-commerce platforms, healthcare dashboards, school management systems and more."
        path="/portfolio"
      />
      <Portfolio />
    </>
  );
};

export default PortfolioPage;
