import { socials, type SocialKey } from '@/data/socials';

/** True for empty values and anything still using the `YOUR_*` placeholder convention. */
export function isPlaceholder(value: string | null | undefined): boolean {
  if (!value) return true;
  const v = value.trim();
  return v === '' || v === '#' || /^YOUR_/i.test(v) || /\bplaceholder\b/i.test(v);
}

export interface ResolvedLink {
  label: string;
  href: string | null;
  external: boolean;
  /** Present when the value is missing — rendered as a disabled control with this hint. */
  missing?: string;
}

const LABELS: Record<SocialKey, string> = {
  email: 'Email',
  github: 'GitHub',
  linkedin: 'LinkedIn',
};

export function socialLink(key: SocialKey): ResolvedLink {
  const value = socials[key];
  const label = LABELS[key];
  if (isPlaceholder(value)) {
    return { label, href: null, external: false, missing: `${label} link not added yet` };
  }
  if (key === 'email') {
    return { label, href: `mailto:${value}`, external: false };
  }
  return { label, href: value, external: true };
}

/** Resolve an optional project/demo URL into a link or a disabled placeholder. */
export function optionalLink(label: string, url: string | null | undefined, missingHint: string): ResolvedLink {
  if (isPlaceholder(url)) return { label, href: null, external: false, missing: missingHint };
  return { label, href: url as string, external: /^https?:\/\//.test(url as string) };
}
