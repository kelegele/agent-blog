# Repository Guidelines

## Project Structure & Module Organization

```
agent-blog/
├── src/
│   ├── components/    # Reusable Astro components (Nav, Footer, ArticleCard, ThemeToggle)
│   ├── content/blog/  # Blog posts as Markdown files with frontmatter
│   ├── layouts/       # Page layouts (BaseLayout, BlogPost)
│   ├── pages/         # File-based routing (index, about, blog/[…slug])
│   └── styles/        # Global CSS (design tokens in :root / [data-theme="dark"])
├── public/            # Static assets (favicon, images)
└── astro.config.mjs   # Astro configuration
```

This is a static blog built with **Astro 6** (zero JS frameworks). Content is managed through Astro Content Collections defined in `src/content.config.ts`.

## Build, Test, and Development Commands

Uses **pnpm** as the package manager (Node ≥ 22.12.0 required).

- `pnpm dev` — Start the dev server with hot reload.
- `pnpm build` — Build the static site to `dist/`.
- `pnpm preview` — Preview the production build locally.

There is no test framework configured.

## Coding Style & Naming Conventions

- **Astro components**: PascalCase filenames (e.g., `ArticleCard.astro`).
- **Pages**: kebab-case filenames (e.g., `about.astro`).
- **CSS**: Scoped `<style>` blocks per component. Global design tokens are CSS custom properties defined in `src/styles/global.css`. Use `var(--c-*)` tokens for all colors.
- **TypeScript**: Strict mode enabled (`astro/tsconfigs/strict`). Use `// @ts-check` in `.mjs` config files.
- **Content files**: kebab-case Markdown filenames in `src/content/blog/`.

## Blog Post Frontmatter Schema

Every Markdown file in `src/content/blog/` must include this frontmatter:

```yaml
---
title: string        # Post title (required)
description: string  # Short description (required)
date: YYYY-MM-DD     # Publication date, coerced to Date (required)
category: string     # Category label (required)
draft: boolean       # If true, excluded from production build (default: false)
---
```

Draft posts (`draft: true`) are filtered out on the index page but remain available in dev mode.

## Theming

Light/dark theme is controlled via `data-theme` attribute on `<html>`. Toggle logic lives in `ThemeToggle.astro` with persistence in `localStorage`. When adding new colors, define matching light and dark variants in `global.css`.

## Commit & Pull Request Guidelines

- Use concise, descriptive commit messages (English or Chinese are both acceptable).
- Keep PRs focused on a single concern.
- Run `pnpm build` before submitting to verify no build errors.

## UI/UX Design Rules

- **All frontend UI/UX MUST strictly follow the design specification in `DESIGN.md`.** This includes: color tokens, typography scales, rounded corners, spacing, shadows, and component patterns.
- Never introduce colors, fonts, or styles that are not defined in `DESIGN.md`. Use CSS custom properties (`var(--c-*)`, `var(--font-*)`, etc.) defined in `src/styles/global.css` for all styling.
- Typography: Headlines use `--font-sans` at weight 600 with negative letter-spacing. Body text uses weight 400. Monospace is reserved for code, captions, and technical labels only.
- Gradients: The brand mesh gradient (`--g-hero`) lives at hero scale only — never miniaturize or reduce to a single color.
- Shadows: Use stacked shadows (multiple small offsets with inset hairline rings) rather than single heavy drop shadows.
- Headlines are sentence-case, never all-caps.
- Button/pill rounding: `--r-pill` (100px) for marketing CTAs, `--r-full` for nav buttons. Do not mix scales on the same surface.

## Project History

- **Predecessor project**: `blog.kelegele.com (archived as `github.com/kelegele/blog-2019-archived`)` at `/Users/fh/Projects/blog.kelegele.com` (Vuepress + vuepress-theme-hope).
- The logo assets (`logo.png`, `logo-black-bg.png`) and favicon are sourced from this predecessor project.
- The old blog's Vercel comment system (Giscus on `kelegele/blog-comment`) and other integrations may be ported later.

## Design Reference
- **Nav design reference**: https://vercel.com/blog — mobile nav collapses brand name, reduces gap/padding, and replaces long link text with icons at small viewports. Follow this pattern for responsive nav behavior.

## Design Enforcement Rules

- **All frontend UI/UX MUST strictly conform to the design specification in `DESIGN.md` and `src/styles/global.css`.** No raw/unstyled components allowed. Every visible element must have explicit, intentional styling.
- **Reference site: [vercel.com/blog](https://vercel.com/blog).** All component design decisions (nav, category tabs, article cards, post layout, copy buttons, typography, spacing, color) must reference and match the Vercel Blog aesthetic.
- **Zero tolerance for unstyled or default-browser-styled components.** Any component that ships with browser defaults (raw buttons, unstyled links, default form elements, bare text) is a critical bug — treat it as a broken build.
- Before implementing any new UI component, study the equivalent component on vercel.com/blog first. Match its layout, spacing, typography scale, color tokens, and interaction patterns.

## External Reference Linking

Every blog post **must** add hyperlinks to any third-party tools, frameworks, libraries, standards, or external resources mentioned in the article. This applies to both new articles and edits.

**Examples:**
- Mention "Astro" → link to `https://astro.build`
- Mention "GitHub API" → link to `https://docs.github.com/en/rest`
- Mention "Vercel" → link to `https://vercel.com`
- Mention a paper or spec → link to the original source

**Rules:**
- First mention of a term gets the link; subsequent mentions do not need to be linked.
- Use meaningful link text, not bare URLs: `[Astro](https://astro.build)` not `<https://astro.build>`.
- This rule exists for SEO (outbound authority links signal topic relevance) and reader experience (clickable references).
- The skill must validate this in its format-checking phase.
