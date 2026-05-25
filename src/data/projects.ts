export type ProjectCategory = 'Web Development' | 'Data Analytics' | 'AI / ML';

export type Project = {
  id: string;
  title: string;
  subtitle?: string;
  category: ProjectCategory;
  summary: string;
  description: string;
  tech: string[];
  image: string;
  imageBg?: string; // optional CSS background for the image container (use when the asset is designed for a specific backdrop)
  accent: string; // tailwind gradient utility class
  links: {
    github?: string;
    demo?: string;
  };
};

export const projects: Project[] = [
  {
    id: 'smarthire-ai',
    title: 'SmartHire AI',
    subtitle: 'AI-Powered Recruitment & Candidate Management Platform',
    category: 'AI / ML',
    summary:
      'AI recruitment platform automating screening, résumé parsing and matching.',
    description:
      'A modern recruitment platform that streamlines hiring workflows with AI-powered candidate screening, resume analysis, intelligent matching, and real-time recruitment management. Recruiters manage applicants, track hiring pipelines, and automate candidate evaluations through advanced AI integrations — all behind a premium, fully responsive UI.',
    tech: ['React', 'Next.js', 'TypeScript', 'PostgreSQL', 'AI Model APIs'],
    image: '/assets/projects/smarthire-ai.png',
    accent: 'from-accent-500 to-pink-500',
    links: { github: 'https://github.com/RajaFarazTariq' },
  },
  {
    id: 'erp-textile',
    title: 'ERP System',
    subtitle: 'Textile Recycling Management System',
    category: 'Web Development',
    summary:
      'Full-stack ERP/CRM managing workflows across multiple departments.',
    description:
      'End-to-end ERP that coordinates procurement, production, and dispatch for a textile recycling operation. Implemented authentication, role-based access control, modular Django services, and a responsive React frontend that field staff actually enjoy using.',
    tech: ['Django', 'React.js', 'PostgreSQL', 'REST API', 'RBAC'],
    image: '/assets/projects/erp-crm.png',
    accent: 'from-accent-500 to-violet-600',
    links: { github: 'https://github.com/RajaFarazTariq' },
  },
  {
    id: 'ai-canvas',
    title: 'Veltrix',
    subtitle: 'AI Real-Time Canvas App',
    category: 'Web Development',
    summary:
      'Collaborative canvas where natural-language prompts become live shapes.',
    description:
      'Multi-user canvas that converts plain-English prompts into structured JSON via LLM APIs and renders them on a shared Konva surface. Real-time sync over Socket.io keeps every collaborator in lockstep with sub-100ms updates.',
    tech: ['React', 'React Konva', 'Socket.io', 'Zustand', 'LLM APIs'],
    image: '/assets/projects/ai-canvas.png',
    accent: 'from-cyan-500 to-violet-600',
    links: { github: 'https://github.com/RajaFarazTariq' },
  },
  {
    id: 'bi-dashboard',
    title: 'Company-Wide BI Dashboard',
    category: 'Data Analytics',
    summary:
      'Zoho Analytics dashboards giving leadership visibility into KPIs.',
    description:
      'Built and maintained a portfolio of dashboards in Zoho Analytics that consolidate sales, ops, and HR data into a single source of truth. Stakeholders moved from weekly status decks to live, drilldown-friendly views.',
    tech: ['Zoho Analytics', 'Python', 'SQL', 'Pandas'],
    image: '/assets/projects/bi-dashboard.png',
    accent: 'from-violet-600 to-pink-500',
    links: {},
  },
  {
    id: 'etl-automation',
    title: 'Python ETL & Automation',
    category: 'Data Analytics',
    summary:
      'Pipelines and automation that cut manual reporting effort dramatically.',
    description:
      'Python-based ETL pipelines moving data between operational systems, plus automation scripts replacing repetitive spreadsheet work. Significantly reduced reporting effort and eliminated copy-paste errors across teams.',
    tech: ['Python', 'Pandas', 'NumPy', 'ETL', 'Schedulers'],
    image: '/assets/projects/etl-automation.svg',
    imageBg: '#0b0f1e',
    accent: 'from-sky-500 to-violet-700',
    links: { github: 'https://github.com/RajaFarazTariq' },
  },
  {
    id: 'virtual-proctor',
    title: 'Monitrix',
    subtitle: 'Online Virtual Proctor',
    category: 'AI / ML',
    summary:
      'AI exam proctoring that detects suspicious behaviour in real time.',
    description:
      'A proctoring engine that fuses face detection, gaze tracking, and object detection to flag suspicious activity during online exams. Multiple computer-vision models orchestrated to run in real time on commodity hardware.',
    tech: ['Python', 'OpenCV', 'DeepFace', 'YOLOv9', 'Mediapipe'],
    image: '/assets/projects/virtual-proctor.png',
    accent: 'from-cyan-600 to-violet-600',
    links: { github: 'https://github.com/RajaFarazTariq' },
  },
  {
    id: 'office-monitoring',
    title: 'OpsVision',
    subtitle: 'AI Office Monitoring System',
    category: 'AI / ML',
    summary:
      'Computer-vision pipeline tracking activity and movement in an office.',
    description:
      'Real-time office monitoring built on OpenCV and YOLOv9 with the SORT tracker for stable identities across frames. Generates activity metrics that feed straight into a Zoho dashboard.',
    tech: ['Python', 'OpenCV', 'YOLOv9', 'SORT', 'Computer Vision'],
    image: '/assets/projects/office-monitoring.png?v=2',
    accent: 'from-violet-700 to-accent-600',
    links: { github: 'https://github.com/RajaFarazTariq' },
  },
];
