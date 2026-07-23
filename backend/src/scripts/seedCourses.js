// Run with: npm run seed-courses
//
// Course Enrollment Module — one-time migration that copies the institute's
// existing course catalog (previously hard-coded in
// frontend/src/data/courses.js) into the database, so the Admin Panel and
// public website both read from the same live Course collection from now
// on. Existing courses are preserved exactly as they were — nothing is
// removed or overwritten:
//   - Matched by `slug`. If a course with that slug already exists in the
//     DB (e.g. you already added it from the Admin Panel, or ran this
//     script before), it is left untouched.
//   - Safe to run multiple times.
//
// Course images referenced below are expected at
// backend/uploads/courses/<file> (already copied from the frontend assets
// for this migration) and are served at /uploads/courses/<file>.

import dotenv from "dotenv";
import mongoose from "mongoose";
import Course from "../models/Course.js";

dotenv.config();

const existingCourses = [
  {
    slug: "mern-stack-development",
    title: "MERN Stack Development",
    image: "/uploads/courses/MERN.png",
    duration: "6 Months",
    level: "Beginner to Advanced",
    students: "500+ Students",
    originalPrice: 25000,
    discountPrice: 14999,
    discount: 40,
    rating: 4.8,
    totalRatings: 312,
    totalLectures: 120,
    about:
      "Become a job-ready Full Stack Developer by mastering MongoDB, Express.js, React and Node.js — the same stack used by top product companies.",
    syllabus: [
      "HTML, CSS, JavaScript (ES6+) Fundamentals",
      "React.js — Components, Hooks, State Management",
      "Node.js & Express.js — REST API Development",
      "MongoDB — Database Design & Aggregation",
      "Authentication (JWT) & Authorization",
      "Deployment (Vercel, Render, MongoDB Atlas)",
      "2 Real-World Capstone Projects",
    ],
    benefits: [
      "Live doubt-clearing sessions with mentors",
      "Real-world project portfolio for your resume",
      "Certificate of completion",
      "Placement & interview preparation support",
      "Lifetime access to recorded sessions",
    ],
    upskills: [
      "Build & deploy full stack web applications independently",
      "Write clean, scalable REST APIs",
      "Work confidently with Git/GitHub in a team",
      "Crack technical interview rounds for MERN roles",
    ],
  },
  {
    slug: "python-development",
    title: "Python Development",
    image: "/uploads/courses/python.png",
    duration: "4 Months",
    level: "Beginner",
    students: "400+ Students",
    originalPrice: 25000,
    discountPrice: 14999,
    discount: 40,
    rating: 4.7,
    totalRatings: 268,
    totalLectures: 90,
    about:
      "Learn Python from scratch and move into real applications — automation, web development with Django/Flask, and data handling.",
    syllabus: [
      "Python Basics — Syntax, Data Types, OOP",
      "File Handling & Exception Handling",
      "Django / Flask Web Framework",
      "Working with APIs & Databases (SQL/NoSQL)",
      "Automation Scripting",
      "1 Real-World Project",
    ],
    benefits: [
      "Beginner-friendly, no prior coding needed",
      "Hands-on assignments after every module",
      "Certificate of completion",
      "Doubt support via WhatsApp community",
    ],
    upskills: [
      "Write clean, production-style Python code",
      "Build a working web app using Django/Flask",
      "Automate everyday repetitive tasks with scripts",
    ],
  },
  {
    slug: "artificial-intelligence",
    title: "Artificial Intelligence",
    image: "/uploads/courses/AI.png",
    duration: "6 Months",
    level: "Intermediate",
    students: "250+ Students",
    originalPrice: 25000,
    discountPrice: 14999,
    discount: 40,
    rating: 4.9,
    totalRatings: 180,
    totalLectures: 110,
    about:
      "Dive into Machine Learning and AI — from core math foundations to building and deploying real ML/AI models.",
    syllabus: [
      "Python for Data Science (NumPy, Pandas)",
      "Statistics & Math Foundations for ML",
      "Machine Learning Algorithms (Regression, Classification, Clustering)",
      "Deep Learning with TensorFlow/PyTorch",
      "Natural Language Processing basics",
      "Model Deployment (Flask/FastAPI)",
      "Capstone AI Project",
    ],
    benefits: [
      "Project-based learning with real datasets",
      "Certificate of completion",
      "Resume & portfolio building guidance",
      "Access to GPU-based practice notebooks",
    ],
    upskills: [
      "Build and train ML models from scratch",
      "Understand and apply deep learning architectures",
      "Deploy an AI model as a usable API",
    ],
  },
  {
    slug: "cyber-security",
    title: "Cyber Security",
    image: "/uploads/courses/CYBER.png",
    duration: "5 Months",
    level: "Beginner to Advanced",
    students: "300+ Students",
    originalPrice: 25000,
    discountPrice: 14999,
    discount: 40,
    rating: 4.7,
    totalRatings: 205,
    totalLectures: 95,
    about:
      "Learn ethical hacking, network security and vulnerability assessment through hands-on labs and real attack simulations.",
    syllabus: [
      "Networking & Security Fundamentals",
      "Ethical Hacking Basics (Reconnaissance, Scanning)",
      "Web Application Security (OWASP Top 10)",
      "Penetration Testing Tools (Burp Suite, Nmap, Metasploit)",
      "Cryptography Basics",
      "Capstone Security Audit Project",
    ],
    benefits: [
      "Hands-on virtual lab access",
      "Certificate of completion",
      "Guidance for CEH/security certifications",
      "Interview preparation for security roles",
    ],
    upskills: [
      "Perform basic penetration testing",
      "Identify and fix common web vulnerabilities",
      "Understand secure network configuration",
    ],
  },
  {
    slug: "java-full-stack",
    title: "Java Full Stack",
    image: "/uploads/courses/JAVA.png",
    duration: "6 Months",
    level: "Intermediate",
    students: "350+ Students",
    originalPrice: 25000,
    discountPrice: 14999,
    discount: 40,
    rating: 4.6,
    totalRatings: 224,
    totalLectures: 115,
    about:
      "Master Java, Spring Boot and front-end fundamentals to become an enterprise-ready Full Stack Java Developer.",
    syllabus: [
      "Core Java & OOP Concepts",
      "Spring Boot & Spring MVC",
      "REST API Development",
      "Hibernate & JPA (Database Layer)",
      "HTML/CSS/JavaScript for Frontend",
      "Capstone Enterprise Project",
    ],
    benefits: [
      "Enterprise-style project experience",
      "Certificate of completion",
      "Placement & interview preparation support",
      "Mentor-led doubt sessions",
    ],
    upskills: [
      "Build production-grade REST APIs with Spring Boot",
      "Work with relational databases via Hibernate/JPA",
      "Understand enterprise Java project architecture",
    ],
  },
  {
    slug: "cloud-computing",
    title: "Cloud Computing",
    image: "/uploads/courses/CLOUD.png",
    duration: "4 Months",
    level: "Intermediate",
    students: "200+ Students",
    originalPrice: 25000,
    discountPrice: 14999,
    discount: 40,
    rating: 4.6,
    totalRatings: 142,
    totalLectures: 80,
    about:
      "Learn to design, deploy and manage scalable applications on AWS/Azure with real cloud infrastructure practice.",
    syllabus: [
      "Cloud Computing Fundamentals",
      "AWS Core Services (EC2, S3, RDS, IAM)",
      "Docker & Containerization",
      "CI/CD Pipelines",
      "Cloud Cost Optimization & Security Basics",
      "Capstone Cloud Deployment Project",
    ],
    benefits: [
      "Hands-on labs on real AWS/Azure environments",
      "Certificate of completion",
      "Guidance for AWS certification exams",
      "Resume building for cloud/devops roles",
    ],
    upskills: [
      "Deploy and manage applications on the cloud",
      "Set up CI/CD pipelines for automated deployment",
      "Understand cloud architecture and cost optimization",
    ],
  },
  {
    slug: "mobile-app-development",
    title: "Mobile App Development",
    image: "/uploads/courses/MOBILE.png",
    duration: "5 Months",
    level: "Intermediate",
    students: "180+ Students",
    originalPrice: 25000,
    discountPrice: 14999,
    discount: 40,
    rating: 4.5,
    totalRatings: 96,
    totalLectures: 85,
    about:
      "Build cross-platform Android & iOS apps with a single codebase using React Native, from UI design to app store deployment.",
    syllabus: [
      "React Native Fundamentals",
      "Navigation & State Management",
      "Working with APIs & Local Storage",
      "Push Notifications & Firebase Integration",
      "App Store / Play Store Deployment",
      "Capstone Mobile App Project",
    ],
    benefits: [
      "Real device testing guidance",
      "Certificate of completion",
      "App publishing walkthrough",
      "Doubt support via mentor sessions",
    ],
    upskills: [
      "Build and publish a cross-platform mobile app",
      "Integrate real-time features (push notifications, APIs)",
      "Understand mobile app architecture and performance",
    ],
  },
  {
    slug: "corporate-training",
    title: "Corporate Training",
    image: "/uploads/courses/COMPANY-BANNER.png",
    duration: "Custom",
    level: "Professional",
    students: "100+ Companies",
    originalPrice: 25000,
    discountPrice: 14999,
    discount: 40,
    rating: 4.8,
    totalRatings: 54,
    totalLectures: 0,
    about:
      "Customized corporate training programs designed around your team's tech stack, skill gaps and business goals.",
    syllabus: [
      "Skill-gap assessment for your team",
      "Custom curriculum design (web, AI, cloud, security etc.)",
      "Hands-on workshops with real company use cases",
      "Progress tracking & completion reports",
    ],
    benefits: [
      "Fully customized to your organization's needs",
      "Flexible online/offline/hybrid delivery",
      "Certificates for all participating employees",
      "Post-training support",
    ],
    upskills: [
      "Upgrade your team's technical capability",
      "Reduce onboarding/ramp-up time for new tech stacks",
      "Improve delivery speed and code quality",
    ],
  },
];

async function run() {
  const { MONGODB_URI } = process.env;

  if (!MONGODB_URI) {
    console.error("❌ MONGODB_URI is not set in backend/.env");
    process.exit(1);
  }

  await mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 8000 });
  console.log("Connected to MongoDB");

  let created = 0;
  let skipped = 0;

  // eslint-disable-next-line no-restricted-syntax
  for (const courseData of existingCourses) {
    // eslint-disable-next-line no-await-in-loop
    const existing = await Course.findOne({ slug: courseData.slug });
    if (existing) {
      console.log(`⏭️  "${courseData.title}" already exists — skipped (kept as-is).`);
      skipped += 1;
      continue;
    }

    // eslint-disable-next-line no-await-in-loop
    await Course.create(courseData);
    console.log(`✅ Added "${courseData.title}"`);
    created += 1;
  }

  console.log(`\nDone. ${created} course(s) added, ${skipped} already existed and were left untouched.`);

  await mongoose.disconnect();
  process.exit(0);
}

run().catch((err) => {
  console.error("Failed to seed courses:", err.message);
  process.exit(1);
});
