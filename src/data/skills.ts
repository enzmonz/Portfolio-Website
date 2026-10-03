import type { TechIconKey } from '@/components/ui/tech-icons';
import { projects } from './projects';

/**
 * Technical skills, grouped. Edit the lists below; project cross-references
 * ("Used in …") are computed automatically from the stacks in projects.ts.
 */

export interface Skill {
  name: string;
  icon?: TechIconKey;
  /** Extra names that count as this skill when matching project stacks. */
  aliases?: string[];
}

export interface SkillGroup {
  id: string;
  label: string;
  /** Short line describing the group's role in the stack. */
  blurb: string;
  skills: Skill[];
}

export const primaryFocus = {
  label: 'Full-Stack Development',
  description:
    'Web, mobile, APIs, and relational databases.',
};

export const skillGroups: SkillGroup[] = [
  {
    id: 'languages',
    label: 'Languages',
    blurb: 'General-purpose and typed languages',
    skills: [
      { name: 'Python', icon: 'python' },
      { name: 'Java', icon: 'java' },
      { name: 'C', icon: 'c' },
      { name: 'JavaScript', icon: 'javascript' },
      { name: 'TypeScript', icon: 'typescript' },
    ],
  },
  {
    id: 'frontend',
    label: 'Frontend',
    blurb: 'Interfaces for web and mobile',
    skills: [
      { name: 'HTML', icon: 'html' },
      { name: 'CSS', icon: 'css' },
      { name: 'React', icon: 'react', aliases: ['React Native'] },
      { name: 'Astro', icon: 'astro' },
      { name: 'Tailwind CSS', icon: 'tailwind' },
    ],
  },
  {
    id: 'backend',
    label: 'Backend',
    blurb: 'Servers and the APIs they expose',
    skills: [
      { name: 'Node.js', icon: 'node' },
      { name: 'REST API' },
    ],
  },
  {
    id: 'databases',
    label: 'Databases',
    blurb: 'Relational data and schema design',
    skills: [
      { name: 'PostgreSQL', icon: 'postgresql' },
      { name: 'MySQL', icon: 'mysql' },
    ],
  },
  {
    id: 'tools',
    label: 'Tools',
    blurb: 'Everyday workflow',
    skills: [
      { name: 'Git', icon: 'git' },
      { name: 'GitHub', icon: 'github' },
      { name: 'VS Code' },
      { name: 'Figma', icon: 'figma' },
    ],
  },
];

/**
 * Projects whose stack includes this skill (implemented or partial only;
 * planned technologies don't count as "used").
 */
export function projectsUsing(skill: Skill): { slug: string; title: string }[] {
  const names = [skill.name, ...(skill.aliases ?? [])].map((n) => n.toLowerCase());
  return projects
    .filter((p) =>
      p.stack.some((t) => {
        if (t.status === 'planned') return false;
        // "PostgreSQL / MySQL" counts for both engines.
        const parts = t.name.toLowerCase().split('/').map((s) => s.trim());
        return parts.some((part) => names.includes(part));
      }),
    )
    .map((p) => ({ slug: p.slug, title: p.shortTitle }));
}
