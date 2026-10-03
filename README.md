# Enzo Monzon — Portfolio

Personal portfolio of **Enzo Monzon**, Software Developer and Computer Science student at Pamantasan ng Lungsod ng Maynila.

It is built with **Astro 7**, **TypeScript** and **Tailwind CSS 4**. It is a static site and uses no UI framework. Interactivity comes from a few kilobytes of vanilla TypeScript, and every page works without JavaScript.

```bash
npm install
npm run dev       # http://localhost:4321
npm run build     # type-checks (astro check), then builds to dist/
npm run preview   # serve the production build
```

## Editing content

All content lives in `src/data/`. You never need to touch a component to update the site.

| What | File |
| --- | --- |
| Email, GitHub, LinkedIn | `src/data/socials.ts` |
| Name, tagline, availability line, SEO text, placeholder visibility | `src/data/site.ts` |
| Projects: copy, stack, status, links, screenshots | `src/data/projects.ts` |
| Experience timeline | `src/data/experience.ts` |
| Technical profile (shown inside About) | `src/data/skills.ts` |
| Profile photo | put your portrait at `public/images/profile.jpg` (path set in `site.ts`) |
| Navigation order | `src/data/navigation.ts` |
| Canonical domain (SEO, sitemap, robots) | `SITE_URL` in `astro.config.mjs`, or the `SITE_URL` env var |

### Profile photo

The hero shows a framed placeholder until `public/images/profile.jpg` exists. Add the file, rebuild, and the photo replaces the placeholder automatically. A 4:5 portrait at least 800px wide works best.

### Theme

Both themes are defined in `src/styles/global.css` with one canonical set of variables:

- `--background`
- `--surface`
- `--surface-elevated`
- `--text`
- `--text-muted`
- `--accent`
- `--accent-glow`
- `--border`

Dark (green accent) is the default. Light is a warm red theme.

The display font is Pixelify Sans. Body text uses Inter, and code uses JetBrains Mono.

### Mini game

`/mini-game` is a canvas FPS aim trainer, written in plain TypeScript in `src/components/AimTrainer/`.

- Personal bests are stored in the visitor's `localStorage`.
- Phones and other touch devices see a short note instead of the arena.

### Placeholders

Anything not known yet is either `null` or a `YOUR_*` value:

- **Links** still set to `YOUR_EMAIL`, `YOUR_LINKEDIN` and so on render as disabled buttons, never as broken links.
- **Missing details**, such as experience dates and descriptions, render as dashed "to be added" slots.
- To hide every placeholder slot at once (for example, before sharing the site publicly), set `showPlaceholders: false` in `src/data/site.ts`.

### Project screenshots

Put images in `src/assets/projects/<project>/` and reference them in `projects.ts` by path, for example `src: 'sellbytes/home.png'`. They are resized and converted to AVIF/WebP at build time.

- A screenshot that exists in both themes can be listed twice with `theme: 'dark'` and `theme: 'light'`. The site shows the one that matches its own theme.
- Projects without screenshots list `imagePlaceholders`. Remove an entry once its image is added.

### Project status and technologies

Every technology in a project's `stack` has a `status`:

- `implemented` (the default)
- `partial`
- `planned`

Planned and partial items are labelled as such everywhere they appear. Keep them honest: only mark something `implemented` when the code really has it. The `status` field accepts `In Development`, `Concept`, `Academic Project`, `Deployed` and `Design Project`.

## Structure

```text
src/
├── components/        Page sections (Hero, Projects, About, Experience, Contact, …)
│   ├── NavigationCore/  The glowing navigation core and its hub
│   ├── ProfilePhoto/    Hero portrait frame (placeholder until the photo exists)
│   ├── AimTrainer/      Mini game (canvas)
│   ├── projects/      The four project showcase presentations
│   ├── project-detail/  Case-study page building blocks
│   ├── visuals/       Architecture diagrams, flow rails, ERD, phone mockup
│   └── ui/            Buttons, chips, icons, frames, image helpers
├── data/              ← all editable content
├── layouts/Layout.astro   SEO, Open Graph, theme bootstrapping, fonts
├── lib/               Small helpers (links, images, tech icons)
├── pages/             index, projects/[slug], mini-game, 404, robots.txt
├── scripts/site.ts    Scroll reveal, navigation core, theme transition, cursor + magnetic effects
└── styles/global.css  Design tokens (dark + light), utilities, motion
```

## Assets

- `public/og.png` is the 1200×630 social preview. It is rendered from `scripts/og/og.html`. Open that file in Chrome or Edge at 1200×630 and take a screenshot, or run headless Edge/Chrome with `--screenshot --window-size=1200,630`.
- `node scripts/generate-icons.mjs` regenerates `favicon.ico`, `apple-touch-icon.png` and the manifest icons from `public/favicon.svg`.
- Technology marks come from [Simple Icons](https://simpleicons.org) (CC0) and are stored as path data in `src/components/ui/tech-icons.ts`.

## Accessibility and performance notes

- The site uses semantic landmarks, a skip link and visible focus states. The navigation hub and the lightbox are native `<dialog>` elements, so they get focus trapping and Esc to close for free.
- The cursor ring, tilt and magnetic effects only run with a fine pointer, and only when motion is allowed.
- All motion respects `prefers-reduced-motion`.
- Page transitions use native cross-document View Transitions, which add no JavaScript.
- Fonts are self-hosted and preloaded, with metric-matched fallbacks to avoid layout shift.
