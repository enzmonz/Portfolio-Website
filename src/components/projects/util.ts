import type { Project, ProjectImage } from '@/data/projects';

/** URL of a project's case study page. */
export const caseStudyHref = (project: Project): string => `/projects/${project.slug}`;

/** Heading id for a showcase card (used by aria-labelledby). */
export const cardHeadingId = (project: Project): string => `${project.slug}-title`;

/**
 * Screens for a product composition, picked from the project's images:
 * the hero (a dark/light pair when one exists, so it follows the site theme),
 * the remaining desktop shots in data order, and the first phone shot.
 */
export function pickScreens(project: Project): {
  hero: ProjectImage[];
  others: ProjectImage[];
  phone: ProjectImage | undefined;
} {
  const desktop = project.images.filter((image) => image.kind === 'desktop');
  const themed = desktop.filter((image) => image.theme);
  const hero = themed.length ? themed : desktop.slice(0, 1);
  return {
    hero,
    others: desktop.filter((image) => !hero.includes(image)),
    phone: project.images.find((image) => image.kind === 'mobile'),
  };
}

/** Find a project image by its path inside src/assets/projects/. */
export const findImage = (project: Project, src: string): ProjectImage | undefined =>
  project.images.find((image) => image.src === src);

/** The first `count` sentences of a paragraph. Compact excerpts only; the case study has the full text. */
export function leadSentences(text: string, count: number): string {
  const sentences = text.match(/[^.!?]+[.!?]+(?=\s|$)/g);
  if (!sentences || sentences.length <= count) return text;
  return sentences.slice(0, count).join('').trim();
}
