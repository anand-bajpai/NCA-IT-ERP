import ai from "../assets/images/portfolio/ai.jpeg";
import aws from "../assets/images/portfolio/aws.jpeg";
import ecommerce from "../assets/images/portfolio/e-commers.jpeg";
import food from "../assets/images/portfolio/food.jpeg";
import hospital from "../assets/images/portfolio/hospital.jpeg";
import school from "../assets/images/portfolio/School-dashboard .jpeg";

export const portfolioData = [
  {
    id:1,
    category:"Healthcare",
    title:"Hospital Management System",
    image:hospital,
    description:
      "Complete healthcare ERP platform for hospitals and clinics.",
    technologies:[
      "React",
      "Node.js",
      "MongoDB",
      "AWS"
    ]
  },

  {
    id:2,
    category:"Education",
    title:"School Management Dashboard",
    image:school,
    description:
      "Modern ERP solution for schools and institutions.",
    technologies:[
      "React",
      "Express",
      "MongoDB"
    ]
  },

  {
    id:3,
    category:"Retail",
    title:"E-Commerce Platform",
    image:ecommerce,
    description:
      "Enterprise grade ecommerce management platform.",
    technologies:[
      "React",
      "Node.js",
      "MongoDB"
    ]
  },

  {
    id:4,
    category:"AI",
    title:"AI Recruitment Assistant",
    image:ai,
    description:
      "AI based candidate screening and hiring automation.",
    technologies:[
      "Python",
      "FastAPI",
      "OpenAI"
    ]
  },

  {
    id:5,
    category:"Cloud",
    title:"AWS Infrastructure Platform",
    image:aws,
    description:
      "Scalable cloud infrastructure solution.",
    technologies:[
      "AWS",
      "Docker",
      "Linux"
    ]
  },

  {
    id:6,
    category:"Mobile",
    title:"Food Delivery App",
    image:food,
    description:
      "Cross-platform food ordering ecosystem.",
    technologies:[
      "React Native",
      "Firebase"
    ]
  }
];