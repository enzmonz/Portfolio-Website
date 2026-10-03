/**
 * Contact + social links — the ONLY place these values live.
 *
 * Anything still set to a `YOUR_*` placeholder is rendered as a disabled
 * "link not added yet" control instead of a broken link.
 */
export const socials = {
  /** Plain email address. Rendered as a mailto: link. */
  email: 'monzonmarcusenzo@gmail.com',
  /**
   * Full GitHub profile URL, e.g. "https://github.com/username".
   * (Your project repositories live under github.com/enzmonz — paste that here if it's your profile.)
   */
  github: 'https://github.com/enzmonz',
  /** Public LinkedIn profile URL. */
  linkedin: 'https://www.linkedin.com/in/enzmonz/',
} as const;

export type SocialKey = keyof typeof socials;
