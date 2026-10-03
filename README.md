# Enzo Monzon — Portfolio

A personal portfolio website for **Enzo Monzon**, a Computer Science student and software developer from **Pamantasan ng Lungsod ng Maynila (PLM)**.

The portfolio showcases selected projects, experience, technical skills, and software development work through an interactive, pixel-inspired interface.

## ✨ Overview

This portfolio was designed to be more than a traditional personal website. It combines a clean developer-focused layout with a **pixel-inspired visual style**, interactive navigation, subtle animations, and a responsive experience across devices.

### Highlights

* 🎮 Pixel-inspired visual design
* 🌗 Dark and light themes
* 🧑‍💻 Project and experience showcase
* 📱 Responsive layout
* ⚡ Fast static-site architecture
* 🎯 Interactive navigation hub
* 🎮 Built-in FPS aim trainer mini-game
* ♿ Accessibility-conscious interactions
* 🔍 SEO and Open Graph support
* 📦 Optimized project images with AVIF/WebP

## 🛠️ Tech Stack

| Technology             | Purpose                              |
| ---------------------- | ------------------------------------ |
| **Astro 7**            | Static site framework                |
| **TypeScript**         | Application logic and interactivity  |
| **Tailwind CSS 4**     | Styling and responsive design        |
| **Vanilla TypeScript** | Client-side interactions             |
| **HTML & CSS**         | Semantic structure and visual system |

### Typography

* **Pixelify Sans** — Display / pixel-inspired typography
* **Inter** — Body text
* **JetBrains Mono** — Code and technical elements

## 🚀 Getting Started

Clone the repository and install the dependencies:

```bash
git clone <repository-url>
cd <repository-folder>
npm install
```

Start the development server:

```bash
npm run dev
```

The website will be available at:

```text
http://localhost:4321
```

Build the production version:

```bash
npm run build
```

Preview the production build:

```bash
npm run preview
```

## 📁 Project Structure

```text
src/
├── components/
│   ├── NavigationCore/     # Interactive navigation hub
│   ├── ProfilePhoto/       # Hero profile photo
│   ├── AimTrainer/         # FPS aim trainer mini-game
│   ├── projects/           # Project showcase sections
│   ├── project-detail/     # Project case-study components
│   ├── visuals/            # Diagrams and visual components
│   └── ui/                 # Reusable UI components
│
├── data/                   # Portfolio content
│
├── layouts/
│   └── Layout.astro        # Global layout, SEO and theme setup
│
├── lib/                    # Utility functions
├── pages/                  # Website routes
├── scripts/
│   └── site.ts             # Client-side interactions
└── styles/
    └── global.css          # Design system and global styles

public/
└── images/                 # Public images and assets
```

## ✏️ Updating the Portfolio

Most portfolio content is separated from the UI and can be edited inside `src/data/`.

| Content                | File                     |
| ---------------------- | ------------------------ |
| Social links           | `src/data/socials.ts`    |
| Site information & SEO | `src/data/site.ts`       |
| Projects               | `src/data/projects.ts`   |
| Experience             | `src/data/experience.ts` |
| Technical profile      | `src/data/skills.ts`     |
| Navigation             | `src/data/navigation.ts` |

This makes it possible to update the portfolio without modifying the individual page components.

## 🖼️ Profile Photo

To add the profile photo displayed in the hero section, place your image at:

```text
src/assets/profile.jpg
```

A **4:5 portrait image** with a width of at least **800px** is recommended. Astro generates responsive WebP and JPEG versions at build time.

The portfolio automatically uses the image when it is available.

## 🎨 Themes

The portfolio supports both **dark and light themes**.

The design system is controlled through CSS variables in:

```text
src/styles/global.css
```

Core design tokens include:

```text
--background
--surface
--surface-elevated
--text
--text-muted
--accent
--accent-glow
--border
```

The default theme uses a dark interface with green accents, while the light theme uses a warmer visual palette.

## 🎮 Mini Game

The portfolio includes a small **FPS aim trainer** available at:

```text
/mini-game
```

It is built with plain TypeScript and HTML Canvas.

Features include:

* Target shooting
* Score tracking
* Personal bests
* Local browser storage
* Touch-device detection

Personal best scores are stored locally in the visitor's browser using `localStorage`.

## 📂 Adding Projects

Project information is managed through:

```text
src/data/projects.ts
```

Project screenshots can be placed inside:

```text
src/assets/projects/<project>/
```

For example:

```text
src/assets/projects/sellbytes/home.png
```

The build process automatically optimizes supported project images for the website.

Projects can also specify their current status, such as:

* `Deployed`
* `In Development`
* `Academic Project`
* `Concept`
* `Design Project`

Technology entries can also indicate whether a technology is:

* `implemented`
* `partial`
* `planned`

This helps keep the portfolio accurate about what has actually been built.

## 📱 Responsive & Accessible

The portfolio was built with accessibility and performance in mind.

It includes:

* Semantic HTML landmarks
* Skip navigation
* Visible focus states
* Keyboard-friendly dialogs
* Reduced-motion support
* Responsive layouts
* Fine-pointer detection for cursor effects
* Native browser dialogs
* Optimized images
* Self-hosted fonts

Animations and interactive effects are reduced or disabled when the visitor has enabled `prefers-reduced-motion`.

## ⚡ Performance

The site is built as a lightweight static website using Astro.

Client-side JavaScript is kept intentionally small, with most of the site remaining functional without JavaScript.

Images are optimized during the build process, and fonts are self-hosted to improve loading performance and reduce layout shifts.

## 📸 Social Preview

The repository includes an Open Graph image at:

```text
public/og.png
```

This image is used when the portfolio is shared on platforms that support Open Graph previews.

## 📄 License

This repository contains the source code for my personal portfolio.

You are welcome to explore the code and use it as a reference for learning and inspiration. Please do not present the portfolio, branding, personal information, or project work as your own.

---

### Built by Enzo Monzon

**Computer Science Student · Software Developer · Builder**


