import type { ImageMetadata } from 'astro';

/**
 * Resolves project image paths (as written in `src/data/projects.ts`) to
 * optimizable image assets. Any png/jpg/webp/avif dropped into
 * `src/assets/projects/` becomes available by its relative path.
 */
const files = import.meta.glob<{ default: ImageMetadata }>('/src/assets/projects/**/*.{png,jpg,jpeg,webp,avif}', {
  eager: true,
});

export function projectImage(path: string): ImageMetadata {
  const key = `/src/assets/projects/${path.replace(/^\/+/, '')}`;
  const mod = files[key];
  if (!mod) {
    throw new Error(
      `Project image not found: "${path}". Put the file in src/assets/projects/ and reference it relative to that folder.`,
    );
  }
  return mod.default;
}
