import type { JDExtractionResponse } from '../features/profile-builder/services/jdAnalyzerService';

export const OFFICIAL_SAMPLE_JDS: JDExtractionResponse[] = [
  {
    "source_file": "Accenture - Senior Cloud & DevOps Engineer.txt",
    "company": "Accenture plc",
    "role": "Senior DevOps Architect",
    "skills": [
      {
        "skill_name": "Kubernetes",
        "category_code": "CLOUD",
        "confidence": "high",
        "evidence": "Experience orchestrating Kubernetes and Docker containerized systems."
      },
      {
        "skill_name": "Terraform",
        "category_code": "CLOUD",
        "confidence": "high",
        "evidence": "Strong proficiency with Terraform, AWS CloudFormation, or Ansible for IaC."
      },
      {
        "skill_name": "Docker",
        "category_code": "CLOUD",
        "confidence": "high",
        "evidence": "Hands-on experience orchestrating Kubernetes and Docker containerized systems."
      },
      {
        "skill_name": "Python",
        "category_code": "COD",
        "confidence": "high",
        "evidence": "Production expertise in Python and Shell scripting for system automation."
      },
      {
        "skill_name": "Computer Networks",
        "category_code": "NETW",
        "confidence": "high",
        "evidence": "Deep understanding of Computer Networking: TCP/IP, DNS, SSL/TLS certificates."
      },
      {
        "skill_name": "SQL & Databases",
        "category_code": "SQL",
        "confidence": "high",
        "evidence": "Hands-on experience configuring PostgreSQL or MySQL databases, query performance tuning."
      },
      {
        "skill_name": "CI/CD & DevOps",
        "category_code": "SWE",
        "confidence": "high",
        "evidence": "Architect zero-downtime CI/CD pipelines and implement infrastructure as code."
      }
    ]
  },
  {
    "source_file": "Google LLC - Data Scientist.pdf",
    "company": "Google LLC",
    "role": "Data Scientist",
    "skills": [
      {
        "skill_name": "SQL",
        "category_code": "SQL",
        "evidence": "Write efficient, production-grade SQL against very large datasets, including schema design and query optimization",
        "confidence": "high"
      },
      {
        "skill_name": "Database Schema Design & Query Optimization",
        "category_code": "SQL",
        "evidence": "writing and optimizing complex queries, understanding indexing, and designing a schema for event or telemetry data",
        "confidence": "high"
      },
      {
        "skill_name": "Experiment Design & A/B Testing",
        "category_code": "APTI",
        "evidence": "Design and run experiments (A/B tests) and interpret their results rigorously",
        "confidence": "high"
      },
      {
        "skill_name": "Quantitative & Analytical Reasoning",
        "category_code": "APTI",
        "evidence": "Solid quantitative and analytical reasoning \u2014 comfortable interpreting experiment results, probability, and metrics under ambiguity",
        "confidence": "high"
      },
      {
        "skill_name": "Machine Learning Foundations",
        "category_code": "AI",
        "evidence": "Foundational machine learning knowledge: bias-variance tradeoff, regression vs. classification, how gradient descent works, and how to recognize overfitting",
        "confidence": "high"
      },
      {
        "skill_name": "Predictive Modeling",
        "category_code": "AI",
        "evidence": "Build and evaluate predictive models, applying sound statistical judgment",
        "confidence": "high"
      },
      {
        "skill_name": "Technical Communication & Stakeholder Presentation",
        "category_code": "COMM",
        "evidence": "Present findings clearly to both technical and non-technical stakeholders",
        "confidence": "high"
      },
      {
        "skill_name": "BI and Visualization Tools",
        "category_code": "OTHER",
        "evidence": "Experience with a BI/visualization tool; exposure to experimentation platforms; a portfolio of applied data projects.",
        "confidence": "medium"
      }
    ]
  },
  {
    "source_file": "Google LLC - Software Engineer.pdf",
    "company": "Google LLC",
    "role": "Software Engineer (SWE)",
    "skills": [
      {
        "skill_name": "Data Structures & Algorithms",
        "category_code": "DSA",
        "evidence": "Strong grasp of data structures and algorithms, and the ability to reason about time and space complexity",
        "confidence": "high"
      },
      {
        "skill_name": "Coding & Programming",
        "category_code": "COD",
        "evidence": "Hands-on programming ability \u2014 you can turn a problem statement into working, efficient code quickly",
        "confidence": "high"
      },
      {
        "skill_name": "Operating Systems",
        "category_code": "OS",
        "evidence": "Working knowledge of operating systems fundamentals (processes, threads, virtual memory)",
        "confidence": "high"
      },
      {
        "skill_name": "Networking & Protocols",
        "category_code": "NETW",
        "evidence": "Core networking concepts (TCP/UDP, HTTP, how a web request actually travels)",
        "confidence": "high"
      },
      {
        "skill_name": "Object-Oriented Design",
        "category_code": "OOD",
        "evidence": "Experience or coursework in object-oriented design and common design patterns",
        "confidence": "high"
      },
      {
        "skill_name": "System Design & Scalability",
        "category_code": "SYSD",
        "evidence": "Comfort reasoning about system design at scale \u2014 able to sketch how a large distributed system",
        "confidence": "high"
      },
      {
        "skill_name": "Software Engineering Practices",
        "category_code": "SWE",
        "evidence": "Solid software engineering fundamentals: testing strategy, code review habits, awareness of technical debt, and basic CI/CD concepts",
        "confidence": "high"
      },
      {
        "skill_name": "Communication",
        "category_code": "COMM",
        "evidence": "Clear written and verbal communication \u2014 able to explain a technical tradeoff",
        "confidence": "high"
      },
      {
        "skill_name": "Distributed Systems",
        "category_code": "SYSD",
        "evidence": "Design, develop, test, and maintain large-scale distributed systems",
        "confidence": "high"
      },
      {
        "skill_name": "Cross-Functional Collaboration",
        "category_code": "COMM",
        "evidence": "Collaborate closely with cross-functional partners across product, design, and SRE",
        "confidence": "high"
      }
    ]
  },
  {
    "source_file": "Microsoft - Data Analyst.pdf",
    "company": "Microsoft Corporation",
    "role": "Data Analyst",
    "skills": [
      {
        "skill_name": "SQL",
        "category_code": "SQL",
        "evidence": "Write and optimize SQL queries against large production datasets",
        "confidence": "high"
      },
      {
        "skill_name": "Schema Design",
        "category_code": "SQL",
        "evidence": "Design schemas for telemetry and usage data, and know when to normalize vs. denormalize",
        "confidence": "high"
      },
      {
        "skill_name": "Database Query Optimization",
        "category_code": "SQL",
        "evidence": "index-aware query optimization",
        "confidence": "high"
      },
      {
        "skill_name": "Dashboard Development",
        "category_code": "OTHER",
        "evidence": "Build dashboards and reporting that stakeholders actually use",
        "confidence": "high"
      },
      {
        "skill_name": "Data Analysis & Anomaly Detection",
        "category_code": "APTI",
        "evidence": "Detect and explain anomalies in usage or business metrics",
        "confidence": "high"
      },
      {
        "skill_name": "Stakeholder Communication",
        "category_code": "COMM",
        "evidence": "Communicate insights clearly to non-technical stakeholders and defend your methodology",
        "confidence": "high"
      },
      {
        "skill_name": "Quantitative Reasoning",
        "category_code": "APTI",
        "evidence": "Solid quantitative reasoning \u2014 interpreting trends, sampling, probability, and reasoning with data tables under ambiguity",
        "confidence": "high"
      },
      {
        "skill_name": "Applied Statistics & Machine Learning Literacy",
        "category_code": "AI",
        "evidence": "Basic applied statistics/ML literacy: regression vs. classification, what overfitting means, and how to sanity-check a model's output",
        "confidence": "high"
      },
      {
        "skill_name": "Power BI",
        "category_code": "OTHER",
        "evidence": "Experience with a visualization tool (Power BI or similar)",
        "confidence": "medium"
      }
    ]
  },
  {
    "source_file": "Microsoft - Software Engineer.pdf",
    "company": "Microsoft Corporation",
    "role": "Software Engineer",
    "skills": [
      {
        "skill_name": "Data Structures & Algorithms",
        "category_code": "DSA",
        "evidence": "Strong data structures and algorithms fundamentals \u2014 hash maps, trees, and complexity analysis",
        "confidence": "high"
      },
      {
        "skill_name": "Operating Systems",
        "category_code": "OS",
        "evidence": "Working knowledge of operating systems (process scheduling, virtual memory, concurrency primitives)",
        "confidence": "high"
      },
      {
        "skill_name": "Networking & Protocols",
        "category_code": "NETW",
        "evidence": "core networking (REST APIs, timeouts, request lifecycle)",
        "confidence": "high"
      },
      {
        "skill_name": "System Design",
        "category_code": "SYSD",
        "evidence": "Ability to design at the system level \u2014 sketch a cloud-based storage or notification service and reason about scalability and fault tolerance",
        "confidence": "high"
      },
      {
        "skill_name": "Object-Oriented Design & SOLID",
        "category_code": "OOD",
        "evidence": "Understanding of object-oriented design and SOLID principles, and how to design software that's easy to extend",
        "confidence": "high"
      },
      {
        "skill_name": "Software Engineering Practices",
        "category_code": "SWE",
        "evidence": "Software engineering maturity \u2014 clean code habits, a real testing strategy, and comfort talking about technical debt honestly",
        "confidence": "high"
      },
      {
        "skill_name": "Communication & Collaboration",
        "category_code": "COMM",
        "evidence": "Strong communication \u2014 able to describe a hard problem you solved and how you collaborate across teams",
        "confidence": "high"
      },
      {
        "skill_name": "Cloud Infrastructure",
        "category_code": "CLOUD",
        "evidence": "Exposure to cloud infrastructure (Azure or similar)",
        "confidence": "medium"
      },
      {
        "skill_name": "Agile Methodologies",
        "category_code": "SWE",
        "evidence": "Participate in Agile ceremonies and design reviews with your team",
        "confidence": "high"
      }
    ]
  },
  {
    "source_file": "Oracle - Application Support Analyst.pdf",
    "company": "Oracle Financial Services Software",
    "role": "Application Support Analyst",
    "skills": [
      {
        "skill_name": "SQL",
        "category_code": "SQL",
        "evidence": "Query production databases to diagnose issues; Comfort with basic SQL \u2014 simple SELECT/WHERE queries and an understanding of primary keys",
        "confidence": "high"
      },
      {
        "skill_name": "Linux Fundamentals",
        "category_code": "OS",
        "evidence": "Operating systems and Linux fundamentals \u2014 basic command-line usage, what a log file is, batch vs. real-time processing",
        "confidence": "high"
      },
      {
        "skill_name": "Networking",
        "category_code": "NETW",
        "evidence": "Basic networking knowledge \u2014 what an IP address is, client-server architecture fundamentals, and what \u201clatency\u201d means in practice",
        "confidence": "high"
      },
      {
        "skill_name": "Logical Reasoning & Problem Solving",
        "category_code": "APTI",
        "evidence": "Strong quantitative and logical reasoning \u2014 data interpretation from tables, arithmetic, and structured problem-solving",
        "confidence": "high"
      },
      {
        "skill_name": "Communication & Client Management",
        "category_code": "COMM",
        "evidence": "Communicate clearly and calmly with clients during incidents; able to explain a technical issue to a non-technical client",
        "confidence": "high"
      },
      {
        "skill_name": "Ticketing & Incident Management Systems",
        "category_code": "SWE",
        "evidence": "Prior exposure to a ticketing/incident system",
        "confidence": "medium"
      }
    ]
  },
  {
    "source_file": "Oracle - Associate Software Engineer.pdf",
    "company": "Oracle Financial Services Software",
    "role": "Associate Software Engineer",
    "skills": [
      {
        "skill_name": "Programming Fundamentals",
        "category_code": "COD",
        "evidence": "Solid programming fundamentals \u2014 able to read and predict the output of code, and solve basic string/array manipulation problems confidently",
        "confidence": "high"
      },
      {
        "skill_name": "SQL & Relational Databases",
        "category_code": "SQL",
        "evidence": "Practical SQL knowledge \u2014 correct SELECT/WHERE syntax, understanding of DELETE vs. TRUNCATE, and comfort writing simple queries against a relational schema",
        "confidence": "high"
      },
      {
        "skill_name": "Data Structures",
        "category_code": "DSA",
        "evidence": "Core data structures knowledge \u2014 arrays vs. linked lists, when to use a stack or a queue, and basic algorithmic problem-solving",
        "confidence": "high"
      },
      {
        "skill_name": "Object-Oriented Programming",
        "category_code": "OOD",
        "evidence": "Object-oriented programming fundamentals \u2014 inheritance, polymorphism, abstract classes vs. interfaces, explained with real examples",
        "confidence": "high"
      },
      {
        "skill_name": "Operating Systems Basics",
        "category_code": "OS",
        "evidence": "Operating systems basics \u2014 what a process is, fundamentals of multithreading and memory management",
        "confidence": "high"
      },
      {
        "skill_name": "Quantitative & Logical Aptitude",
        "category_code": "APTI",
        "evidence": "Strong quantitative aptitude \u2014 time-and-work, ratios, percentages, and logical/seating-arrangement style reasoning",
        "confidence": "high"
      },
      {
        "skill_name": "Communication & Collaboration",
        "category_code": "COMM",
        "evidence": "Clear communication and a collaborative attitude \u2014 comfortable explaining your final-year project and working under deadline pressure",
        "confidence": "high"
      },
      {
        "skill_name": "Agile & SDLC",
        "category_code": "SWE",
        "evidence": "Awareness of the software development lifecycle and the difference between Agile and Waterfall, and why documentation matters",
        "confidence": "high"
      },
      {
        "skill_name": "Unit Testing",
        "category_code": "SWE",
        "evidence": "Perform unit testing and collaborate closely with QA",
        "confidence": "high"
      },
      {
        "skill_name": "Banking & Financial Systems",
        "category_code": "OTHER",
        "evidence": "Coursework or a project in banking/financial systems",
        "confidence": "medium"
      }
    ]
  }
];

export const DEFAULT_ACTIVE_JD: JDExtractionResponse = OFFICIAL_SAMPLE_JDS[0];
