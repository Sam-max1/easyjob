// lib/presets.ts
// Pre-filled demo configurations for one-click template evaluation

export interface Preset {
  id: string;
  label: string;
  shortLabel: string;
  userName: string;
  targetCompany: string;
  recruiterName: string;
  jobDescription: string;
  rawResumeText: string;
}

export const PRESETS: Preset[] = [
  {
    id: "bootcamp-smart-contract",
    label: "Demo 1: Bootcamp Grad — Smart Contract",
    shortLabel: "Bootcamp — Smart Contract",
    userName: "Alex Rivera",
    targetCompany: "ChainForge Labs",
    recruiterName: "Sarah Mitchell",
    jobDescription: `Senior Solidity Smart Contract Engineer — ChainForge Labs

We are seeking a highly skilled Solidity engineer to architect and deploy production-grade DeFi smart contracts on Ethereum and EVM-compatible chains.

Required Skills & Stack:
- 3+ years Solidity development (v0.8.x)
- Deep understanding of ERC-20, ERC-721, ERC-1155 token standards
- OpenZeppelin contracts library expertise
- Hardhat or Foundry testing framework proficiency
- Gas optimization techniques (storage packing, calldata vs memory)
- Smart contract security: reentrancy guards, access control, upgradeable proxy patterns (UUPS, Transparent)
- Experience with Chainlink oracles and VRF
- Ethers.js / Viem for frontend contract interaction
- Knowledge of MEV, flash loan attack vectors, and mitigation strategies
- Audit experience or familiarity with formal verification tools (Certora, Echidna)

Responsibilities:
- Design, implement, test, and deploy complex DeFi protocol contracts
- Write comprehensive Hardhat test suites with 100% branch coverage
- Perform internal security reviews and collaborate with external auditors
- Optimize contract gas consumption for mainnet deployment
- Document all ABIs, natspec comments, and deployment scripts

Preferred:
- Published audit reports
- Contributions to major DeFi protocols (Uniswap, Aave, Compound forks)
- Experience with Layer 2 deployments (Arbitrum, Optimism, Base)`,
    rawResumeText: `Alex Rivera
alex@example.com | github.com/alexrivera | linkedin.com/in/alexrivera

EDUCATION
Blockchain Development Bootcamp — 16 weeks intensive
ConsenSys Academy, 2023 | Graduated with Distinction

B.S. Computer Science — California State University, 2022
GPA: 3.6 | Relevant coursework: Data Structures, Algorithms, Distributed Systems

PROJECTS
DeFi Yield Aggregator (Personal Project)
- Built a Solidity smart contract aggregating yield from Aave and Compound
- Implemented ERC-4626 tokenized vault standard
- Wrote Hardhat test suite covering 20+ scenarios
- Deployed to Goerli testnet with Etherscan verification

NFT Marketplace (Bootcamp Capstone)
- Full-stack NFT marketplace with ERC-721 and ERC-1155 support
- Used OpenZeppelin AccessControl for role-based permissions
- Integrated Chainlink Price Feeds for ETH/USD conversion
- Frontend with ethers.js and React

TECHNICAL SKILLS
Languages: Solidity (v0.8.x), JavaScript, TypeScript, Python
Frameworks: Hardhat, Truffle, React, Node.js
Tools: OpenZeppelin, Chainlink, Ethers.js, Metamask, IPFS
Databases: PostgreSQL, MongoDB

WORK EXPERIENCE
Junior Software Developer — TechStart Inc., 2022–2023
- Built REST APIs with Node.js and Express
- Implemented unit tests with Jest achieving 85% coverage
- Deployed microservices to AWS EC2`,
  },
  {
    id: "junior-nodejs-backend",
    label: "Demo 2: Junior Dev — Node.js Backend",
    shortLabel: "Junior Dev — Node.js",
    userName: "Jordan Kim",
    targetCompany: "Streamline API",
    recruiterName: "Marcus Chen",
    jobDescription: `Backend Engineer (Node.js) — Streamline API

We are a high-growth SaaS company seeking a backend engineer to build and scale our core API infrastructure.

Required Skills & Stack:
- 2+ years Node.js backend development
- TypeScript (strict mode)
- REST API design and implementation (OpenAPI/Swagger documentation)
- PostgreSQL — complex queries, indexing strategies, query optimization
- Redis for caching and session management
- Docker containerization and docker-compose
- CI/CD pipelines (GitHub Actions, CircleCI)
- Authentication: JWT, OAuth2, API key management
- Message queues: RabbitMQ or AWS SQS
- AWS services: EC2, RDS, S3, Lambda

Responsibilities:
- Design and implement scalable RESTful APIs serving 10M+ requests/day
- Write comprehensive integration and unit tests (Jest, Supertest)
- Optimize database queries and implement appropriate caching strategies
- Participate in code reviews and architecture discussions
- Monitor production systems and respond to on-call incidents

Nice to Have:
- GraphQL API experience
- Kubernetes/Helm experience
- Experience with event-driven architectures`,
    rawResumeText: `Jordan Kim
jordan@example.com | github.com/jordankim | linkedin.com/in/jordankim

EDUCATION
B.S. Computer Science — University of Washington, 2024
GPA: 3.8 | Dean's List 4 semesters

INTERNSHIP EXPERIENCE
Backend Engineering Intern — DataFlow Inc., Summer 2023
- Built 3 new REST API endpoints using Node.js and Express
- Wrote unit tests with Jest, achieving 78% code coverage
- Helped migrate legacy MySQL queries to PostgreSQL with proper indexing
- Set up basic Docker container for development environment

Software Engineering Intern — StartupXYZ, Summer 2022
- Implemented user authentication with JWT tokens
- Built admin dashboard with CRUD operations for user management

PROJECTS
Task Management API (Personal)
- RESTful API built with Node.js, TypeScript, Express
- PostgreSQL database with Sequelize ORM
- JWT authentication with refresh token rotation
- Deployed to AWS EC2 with Nginx reverse proxy
- Basic Redis caching for frequently queried endpoints

TECHNICAL SKILLS
Languages: JavaScript, TypeScript, Python, SQL
Runtime: Node.js (Express, Fastify)
Databases: PostgreSQL, MySQL, Redis (basic)
Tools: Docker, Git, AWS (EC2, S3), Jest
APIs: REST, basic GraphQL`,
  },
  {
    id: "cc-python-data-engineer",
    label: "Demo 3: CC Grad — Python Data Engineer",
    shortLabel: "CC Grad — Python Data",
    userName: "Sam Okonkwo",
    targetCompany: "DataPulse Analytics",
    recruiterName: "Priya Sharma",
    jobDescription: `Data Engineer (Python) — DataPulse Analytics

We are building the next generation of real-time analytics infrastructure and need a Data Engineer to design, build, and maintain our data pipelines.

Required Skills & Stack:
- 2+ years Python data engineering experience
- Apache Spark (PySpark) for large-scale data processing
- Apache Airflow for workflow orchestration and DAG management
- Data warehouse: Snowflake or BigQuery (SQL proficiency required)
- Streaming: Apache Kafka or AWS Kinesis
- Data lake: Delta Lake or Apache Iceberg on S3/GCS
- ETL/ELT pipeline design and implementation
- dbt (data build tool) for transformation layer
- Docker and Kubernetes for containerized pipeline deployment
- Data quality frameworks: Great Expectations or Soda
- Data modeling: star schema, slowly changing dimensions

Responsibilities:
- Design and implement batch and streaming data pipelines processing 50TB/day
- Build and maintain Airflow DAGs for complex workflow orchestration
- Collaborate with data scientists to productionize ML feature pipelines
- Implement data quality checks and monitoring alerting
- Optimize Spark jobs for performance and cost efficiency

Preferred:
- Experience with Databricks platform
- MLflow for ML experiment tracking
- Familiarity with DataOps and CI/CD for data pipelines`,
    rawResumeText: `Sam Okonkwo
sam@example.com | github.com/samokonkwo | linkedin.com/in/samokonkwo

EDUCATION
A.S. Computer Information Systems — City College of San Francisco, 2023
GPA: 3.9 | Honors Program

Online Certifications:
- Google Professional Data Engineer Certificate, 2024
- AWS Certified Cloud Practitioner, 2023
- dbt Fundamentals (dbt Labs), 2024

PROJECTS
Retail Sales Analytics Pipeline (Personal)
- Built an ETL pipeline processing 500K daily sales records using Python and PySpark
- Orchestrated with Apache Airflow (3 DAGs, 12 tasks)
- Stored processed data in Snowflake data warehouse
- Built dbt models for dimensional data modeling (star schema)
- Implemented data quality checks using Great Expectations

Real-time Streaming Dashboard
- Consumed Kafka topics with Python Kafka consumer
- Processed and aggregated streaming events with PySpark Structured Streaming
- Visualized metrics in a Streamlit dashboard

TECHNICAL SKILLS
Languages: Python (Pandas, PySpark), SQL, Bash
Data Tools: Apache Airflow, Apache Spark, Apache Kafka, dbt, Great Expectations
Cloud: AWS (S3, Glue, Redshift), Google Cloud (BigQuery, GCS), Snowflake
Containerization: Docker, basic Kubernetes
Visualization: Streamlit, basic Tableau

WORK EXPERIENCE
Data Analyst — Community College Research Office, 2022–2023
- Built automated Python scripts to process enrollment data
- Created SQL reports for institutional research
- Maintained Excel-based dashboards for department heads`,
  },
];
