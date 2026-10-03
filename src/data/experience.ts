/**
 * Experience timeline. Most recent first.
 *
 * Missing details are `null` (or empty arrays). They render as clearly marked
 * "to be added" slots, or are hidden entirely when `site.showPlaceholders` is false.
 * Fill them in here; no component changes needed.
 */

export interface ExperienceEntry {
  id: string;
  org: string;
  role: string;
  status: 'Current' | 'Former';
  /** e.g. "Jan 2026 — Present · Remote". */
  period: string | null;
  /** One or two sentences. */
  summary: string | null;
  /** Hint shown inside the placeholder when `summary` is null. */
  summaryPlaceholder?: string;
  /** Responsibilities / contributions. */
  details: string[];
  detailsPlaceholder?: string;
  tech: string[];
  techPlaceholder?: string;
  /** Project slugs (from projects.ts) shown as evidence for this role. */
  projects?: string[];
  /** Brand mark: 'cinnabyte' uses the Cinnabyte mascot; otherwise a monogram is drawn. */
  logo?: 'cinnabyte';
  monogram: string;
  url?: string | null;
}

export const experience: ExperienceEntry[] = [
  {
    id: 'cinnabyte',
    org: 'Cinnabyte',
    role: 'Associate Founder · Software Engineer',
    status: 'Current',
    period: 'Sep 2026 — Present · Remote',
    summary:
      'As an Associate Founder of Cinnabyte, I lead the design and development of custom software solutions, turning complex ideas into functional, production-ready systems. My work bridges full-stack engineering, system architecture, and intuitive UI/UX design, driven by start-up leadership and co-creation.',
    details: [
      'Product development: building e-commerce platforms, SaaS dashboards, and mobile booking applications from the ground up.',
      'System architecture: designing reliable REST API infrastructure and mapping out legacy system modernizations.',
      'Business solutions: creating internal operations tools designed to streamline daily workflows and improve business efficiency.',
    ],
    tech: ['React', 'React Native', 'TypeScript', 'Node.js', 'PostgreSQL', 'Astro'],
    projects: ['cinnabytehq', 'sellbytes', 'mobile-booking'],
    logo: 'cinnabyte',
    monogram: 'CB',
    url: null,
  },
  {
    id: 'aws-ai-ml',
    org: 'AWS Student Builder Group — Haribon',
    role: 'AI - Machine Learning Associate',
    status: 'Current',
    period: 'Sep 2026 · Manila, Philippines · Hybrid',
    summary: null,
    summaryPlaceholder: 'Details about the AI - Machine Learning Associate role to be added',
    details: [],
    tech: ['Machine Learning'],
    monogram: 'AI',
    url: null,
  },
  {
    id: 'v-tech-solutions',
    org: 'V-Tech Solutions',
    role: 'Software Engineer Intern',
    status: 'Former',
    period: 'Jul 2026 — Sep 2026 · Remote',
    summary:
      'Contributed to the development of scalable enterprise applications by writing clean, maintainable Java code, working closely with senior engineers to troubleshoot and deploy reliable software solutions.',
    details: [
      'Wrote clean, maintainable Java code for enterprise applications.',
      'Integrated Python-based tools to automate data processing pipelines and routine operational tasks.',
      'Worked with senior engineers to troubleshoot and deploy software solutions.',
    ],
    tech: ['Java', 'Python'],
    monogram: 'VT',
    url: null,
  },
];
