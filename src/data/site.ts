import portrait from '@/assets/profile.jpg';

/**
 * Global site settings and copy that appears in more than one place.
 * Contact links live in `socials.ts`.
 */
export const site = {
  name: 'Enzo Monzon',
  initials: 'EM',
  title: 'Software Developer',
  positioning: ['Computer Science Student', 'Full-Stack Development', 'Technology'],
  school: {
    name: 'Pamantasan ng Lungsod ng Maynila',
    short: 'PLM',
    program: 'Computer Science',
  },
  tagline:
    'I build web and mobile apps that make everyday work simpler.',
  /**
   * Imported hero portrait, optimized into responsive images at build time.
   * Replace src/assets/profile.jpg to update it.
   */
  profilePhoto: {
    src: portrait,
    alt: 'Portrait of Enzo Monzon',
  },
  /** Shown as the availability pill in the hero. Set to null to hide it. */
  availability: 'Open to internships & collaborations' as string | null,

  seo: {
    title: 'Enzo Monzon — Software Developer',
    description:
      'Portfolio of Enzo Monzon, a Computer Science student and software developer focused on full-stack development, software engineering, and technology-driven solutions.',
    ogImage: '/og.png',
    locale: 'en_US',
  },

  /**
   * When true, missing details (dates, descriptions, links) render as clearly
   * marked dashed "to be added" slots. Set to false to hide them entirely
   * once the site is public and you'd rather show nothing than a placeholder.
   */
  showPlaceholders: false,

  copyrightYear: 2026,
} as const;
