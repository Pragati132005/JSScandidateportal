import re
from typing import Dict

# Explicit, documented alias dictionary for known equivalent skill names
KNOWN_ALIASES: Dict[str, str] = {
    # JavaScript / TypeScript / Node
    "js": "javascript",
    "javascript": "javascript",
    "ts": "typescript",
    "typescript": "typescript",
    "react": "react",
    "reactjs": "react",
    "react.js": "react",
    "node": "node.js",
    "nodejs": "node.js",
    "node.js": "node.js",
    "vue": "vue.js",
    "vuejs": "vue.js",
    "vue.js": "vue.js",
    "angular": "angular",
    "angularjs": "angular",
    "angular.js": "angular",

    # Python
    "py": "python",
    "python": "python",
    "python3": "python",
    "python 3": "python",
    "py3": "python",

    # Languages & Programming
    "c": "c",
    "cpp": "c++",
    "c++": "c++",
    "c/c++": "c++",
    "c#": "c#",
    "csharp": "c#",
    "golang": "golang",
    "go": "golang",
    "coding": "coding & programming",
    "programming": "coding & programming",
    "coding & programming": "coding & programming",
    "coding and programming": "coding & programming",
    "coding / programming": "coding & programming",
    "programming languages": "coding & programming",
    "programming language": "coding & programming",

    # Web & Frontend
    "html": "html",
    "html5": "html",
    "css": "css",
    "css3": "css",

    # Databases
    "postgres": "postgresql",
    "postgresql": "postgresql",
    "postgre sql": "postgresql",
    "postgres sql": "postgresql",
    "psql": "postgresql",
    "mysql": "mysql",
    "sql": "sql",
    "sql & relational databases": "sql",
    "sql and relational databases": "sql",
    "sql / relational databases": "sql",
    "sql & databases": "sql",
    "sql and databases": "sql",
    "relational databases": "sql",
    "relational database": "sql",
    "relational database management": "sql",
    "rdbms": "sql",
    "mongodb": "mongodb",
    "mongo": "mongodb",

    # APIs & Web Services
    "rest": "rest api",
    "rest api": "rest api",
    "rest apis": "rest api",
    "restful": "rest api",
    "restful api": "rest api",
    "restful apis": "rest api",

    # Operating Systems
    "linux": "linux",
    "linux basics": "linux",
    "linux os": "linux",
    "linux fundamentals": "linux",
    "linux / operating systems": "linux",
    "linux/operating systems": "linux",
    "linux & operating systems": "linux",
    "linux and operating systems": "linux",
    "operating systems / linux": "linux",
    "unix": "unix",
    "bash": "shell scripting",
    "shell": "shell scripting",
    "shell scripting": "shell scripting",

    # Networking
    "networking": "computer networks",
    "networking fundamentals": "computer networks",
    "computer networks": "computer networks",
    "computer networking": "computer networks",
    "network fundamentals": "computer networks",
    "networking & protocols": "computer networks",
    "networking and protocols": "computer networks",
    "network protocols": "computer networks",
    "networking protocols": "computer networks",
    "tcp/ip": "computer networks",
    "tcp/udp": "computer networks",

    # Object-Oriented Design
    "object-oriented design": "object-oriented design",
    "object oriented design": "object-oriented design",
    "object-oriented design & solid": "object-oriented design",
    "object oriented design & solid": "object-oriented design",
    "object-oriented design & patterns": "object-oriented design",
    "ood": "object-oriented design",
    "oop": "object-oriented design",

    # Operating Systems & Systems
    "operating systems": "operating systems",
    "operating system": "operating systems",
    "os": "operating systems",
    "operating systems fundamentals": "operating systems",
    "os fundamentals": "operating systems",

    # Data Structures & Algorithms
    "data structures & algorithms": "data structures & algorithms",
    "data structures and algorithms": "data structures & algorithms",
    "dsa": "data structures & algorithms",
    "data structures": "data structures & algorithms",
    "algorithms": "data structures & algorithms",

    # Cloud & DevOps
    "k8s": "kubernetes",
    "kubernetes": "kubernetes",
    "aws": "aws",
    "amazon web services": "aws",
    "gcp": "google cloud",
    "google cloud platform": "google cloud",
    "google cloud": "google cloud",
    "docker": "docker",
    "ci/cd": "ci/cd",
    "cicd": "ci/cd",
    "ci cd": "ci/cd",
    "ci/cd & devops": "ci/cd",
    "ci/cd and devops": "ci/cd",
    "devops": "ci/cd",

    # Office & Tools
    "excel": "excel",
    "ms excel": "excel",
    "microsoft excel": "excel",
    "ticketing tools": "ticketing tools",
    "ticketing systems": "ticketing tools",
    "ticketing": "ticketing tools",
    "exposure to ticketing tools": "ticketing tools",
    "ticketing & incident management systems": "ticketing tools",
    "ticketing and incident management systems": "ticketing tools",
    "incident management": "ticketing tools",

    # Professional & General Skills
    "software engineering": "software engineering",
    "software development": "software engineering",
    "swe": "software engineering",
    "software engineering practices": "software engineering",
    "software engineering fundamentals": "software engineering",
    "swe practices": "software engineering",
    "testing & code quality": "software engineering",
    "testing and code quality": "software engineering",
    "code quality": "software engineering",
    "testing": "software engineering",
    "unit testing": "software engineering",
    "problem solving": "aptitude and problem solving",
    "problem-solving": "aptitude and problem solving",
    "aptitude": "aptitude and problem solving",
    "aptitude and problem solving": "aptitude and problem solving",
    "communication": "communication",
    "communication skills": "communication",
    "technical communication": "communication",
    "communication & collaboration": "communication",
    "communication and collaboration": "communication",
    "cross-functional collaboration": "communication",
    "cross functional collaboration": "communication",
    "collaboration": "communication",

    # System Design & Distributed Systems
    "system design": "system design",
    "system design & scalability": "system design",
    "system design and scalability": "system design",
    "distributed systems": "distributed systems",
    "distributed system": "distributed systems",
    "distributed systems architecture": "distributed systems",

    # Machine Learning / AI
    "ml": "machine learning",
    "machine learning": "machine learning",
    "ai": "artificial intelligence",
    "artificial intelligence": "artificial intelligence",

    # Version Control (Note: git is distinct from github/gitlab)
    "git": "git",
    "github": "github",
    "gitlab": "gitlab",
}


def normalize_skill_name(name: str) -> str:
    """
    Normalizes a skill name for deterministic, case-insensitive comparison.

    Pipeline:
    1. Strip leading and trailing whitespace.
    2. Lowercase all characters.
    3. Collapse multiple whitespace characters into a single space.
    4. Remove parenthetical descriptions (e.g. 'SQL (basic)' -> 'sql').
    5. Resolve known aliases via KNOWN_ALIASES.

    Does NOT equate distinct skills (e.g., Java != JavaScript, Git != GitHub, C != C++).
    """
    if not name or not isinstance(name, str):
        return ""

    raw = name.strip().lower()
    # Normalize internal whitespace
    raw = re.sub(r"\s+", " ", raw)

    # Check direct alias match first
    if raw in KNOWN_ALIASES:
        return KNOWN_ALIASES[raw]

    # Strip harmless parenthetical annotations, e.g. "sql (basic)" -> "sql"
    without_parens = re.sub(r"\s*\([^)]*\)", "", raw).strip()
    without_parens = re.sub(r"\s+", " ", without_parens)
    if without_parens in KNOWN_ALIASES:
        return KNOWN_ALIASES[without_parens]

    # If the string was purely parenthetical (e.g. "(basic)"), return empty string
    if re.match(r"^\([^)]*\)$", raw):
        return ""

    return without_parens if without_parens else raw
