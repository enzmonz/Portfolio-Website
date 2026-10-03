import type { TechIconKey } from '@/components/ui/tech-icons';

type Fallback = 'braces' | 'code' | 'database' | 'credit-card' | 'layers';

/** Maps a technology name (as written in the data files) to a brand mark or a generic icon. */
const BY_NAME: Record<string, { brand?: TechIconKey; fallback?: Fallback }> = {
  python: { brand: 'python' },
  java: { brand: 'java' },
  c: { brand: 'c' },
  javascript: { brand: 'javascript' },
  typescript: { brand: 'typescript' },
  html: { brand: 'html' },
  css: { brand: 'css' },
  react: { brand: 'react' },
  'react native': { brand: 'react' },
  astro: { brand: 'astro' },
  'tailwind css': { brand: 'tailwind' },
  'node.js': { brand: 'node' },
  postgresql: { brand: 'postgresql' },
  'postgresql / mysql': { brand: 'postgresql' },
  mysql: { brand: 'mysql' },
  git: { brand: 'git' },
  github: { brand: 'github' },
  figma: { brand: 'figma' },
  expo: { brand: 'expo' },
  supabase: { brand: 'supabase' },
  stripe: { brand: 'stripe' },
  zod: { brand: 'zod' },
  docker: { brand: 'docker' },
  'rest api': { fallback: 'braces' },
  'vs code': { fallback: 'code' },
  sql: { fallback: 'database' },
  'payments api': { fallback: 'credit-card' },
};

export function techIconFor(name: string): { brand?: TechIconKey; fallback: Fallback } {
  const hit = BY_NAME[name.trim().toLowerCase()];
  return { brand: hit?.brand, fallback: hit?.fallback ?? 'layers' };
}
