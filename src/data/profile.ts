export const profile = {
  brand: 'Devlytics',
  name: 'Raja Faraz Tariq',
  tagline: 'Architecting the Future of Digital Intelligence',
  role: 'Full-Stack Developer · Data Analyst · AI Builder',
  roles: [
    'Full-Stack Developer',
    'Data Analyst',
    'AI / Computer-Vision Engineer',
    'Automation & ETL Specialist',
  ],
  summary:
    'Full-Stack Developer building scalable web applications, real-time systems, and AI-powered solutions with React.js and Python. Specialized in automation, data pipelines, and computer vision.',
  location: 'Islamabad, Pakistan',
  email: 'thisismefaraz@gmail.com',
  phone: '+92 334 1214546',
  socials: {
    github: 'https://github.com/RajaFarazTariq',
    linkedin: 'https://linkedin.com/in/faraz-tariq-915aa4220',
    instagram: 'https://instagram.com/itx_rajafaraz',
    email: 'mailto:thisismefaraz@gmail.com',
  },
  stats: [
    { label: 'Projects Shipped', value: 20, suffix: '+' },
    { label: 'Years Experience', value: 3, suffix: '+' },
    { label: 'Production Systems', value: 8, suffix: '' },
  ],
};

export type Profile = typeof profile;
