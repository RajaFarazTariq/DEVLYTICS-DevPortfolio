export type PillarKey = 'web' | 'data' | 'ai';

export type Pillar = {
  key: PillarKey;
  name: string;
  description: string;
  bullets: string[];
  stack: string[];
};

export type ExperienceItem = {
  id: string;
  type: 'work' | 'education';
  role: string;
  company: string;
  period: string;
  location?: string;
  summary?: string;
  pillars?: Pillar[];
  bullets?: string[];
  stack?: string[];
};

export const experience: ExperienceItem[] = [
  {
    id: 'engineering',
    type: 'work',
    role: 'Software Engineer · Data Analyst · AI Builder',
    company: 'Independent · Contract',
    period: '2022 — Present',
    location: 'Islamabad, Pakistan',
    summary:
      'A multi-disciplinary engineer shipping production software end-to-end — the interfaces users touch, the data pipelines that fuel them, and the AI systems that make them intelligent.',
    pillars: [
      {
        key: 'web',
        name: 'Web Development',
        description: 'Full-stack applications, end-to-end.',
        bullets: [
          'Designed and shipped an end-to-end ERP/CRM for a textile recycling business — procurement through dispatch.',
          'Built a real-time collaborative canvas that turns natural-language prompts into structured shapes via LLM APIs and WebSockets.',
          'Architected REST APIs, React frontends and real-time systems across multiple full-stack projects.',
        ],
        stack: [
          'React',
          'TypeScript',
          'Django',
          'Node.js',
          'PostgreSQL',
          'Socket.io',
        ],
      },
      {
        key: 'data',
        name: 'Data Analytics',
        description: 'Turning operational data into decisions.',
        bullets: [
          'Owned BI for the organisation — Zoho Analytics dashboards backed by Python ETL pipelines.',
          'Replaced spreadsheet workflows with Python automation, eliminating recurring copy-paste errors.',
          'Authored scheduled ETL pipelines with logging and retries to move data between operational systems.',
        ],
        stack: ['Python', 'Pandas', 'NumPy', 'SQL', 'Zoho Analytics'],
      },
      {
        key: 'ai',
        name: 'AI / Machine Learning',
        description: 'Computer vision and LLM integration.',
        bullets: [
          'Built an online proctoring system fusing face detection, gaze tracking and object detection for live exam monitoring.',
          'Delivered an AI office-monitoring pipeline (YOLOv9 + SORT) producing activity metrics consumed by a BI dashboard.',
          'Integrated LLM APIs (Groq, LLaMA, Gemini) into production product flows.',
        ],
        stack: ['Python', 'OpenCV', 'YOLOv9', 'Mediapipe', 'LLM APIs'],
      },
    ],
  },
  {
    id: 'bscs',
    type: 'education',
    role: 'BS Computer Science',
    company: 'Virtual University of Pakistan',
    period: 'Graduated',
    bullets: [
      'Built a strong foundation across software engineering, algorithms, databases, operating systems and computer networks.',
      'Coursework spanned web development, data structures and applied software engineering — the groundwork for the production systems I ship today.',
    ],
    stack: [
      'Software Engineering',
      'Algorithms & DSA',
      'Databases',
      'Operating Systems',
      'Computer Networks',
    ],
  },
];
