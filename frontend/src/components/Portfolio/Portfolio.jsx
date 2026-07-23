import "./Portfolio.css";

import HeroShowcase from "./HeroShowcase";
import SuccessStories from "./SuccessStories";
import IndustryExpertise from "./IndustryExpertise";
import Solutions from "./Solutions";
import ITInitiative from "./ITInitiative";
import TechnologyCapabilities from "./TechnologyCapabilities";
import WhyChooseUs from "./WhyChooseUs";
import Technologies from "./Technologies";

const Portfolio = () => {
  return (
    <div className="portfolio-page">
      <HeroShowcase />
      <SuccessStories />
      <IndustryExpertise />
      <Solutions />
      <ITInitiative />
      <TechnologyCapabilities />
      <WhyChooseUs />
      <Technologies />
    </div>
  );
};

export default Portfolio;