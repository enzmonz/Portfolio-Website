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
  /** Brand mark; otherwise a monogram is drawn. */
  logo?: 'cinnabyte' | 'aws-haribon' | 'v-tech-solutions';
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
      'Co-creating products and guiding technical decisions at a software startup.',
    details: [
      'Building storefronts, internal tools, and mobile booking apps.',
      'Designing REST APIs and planning legacy system modernization.',
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
    logo: 'aws-haribon',
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
      'Supported enterprise application development alongside senior engineers.',
    details: [
      'Wrote Java code and helped troubleshoot and deploy applications.',
      'Automated data processing and routine tasks with Python.',
    ],
    tech: ['Java', 'Python'],
    logo: 'v-tech-solutions',
    monogram: 'VT',
    url: null,
  },
];
