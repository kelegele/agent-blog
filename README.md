# agent-blog

A personal blog built with [Astro 6](https://astro.build), deployed on Vercel.

## Quick Start

```bash
pnpm install
pnpm dev       # Start dev server
pnpm build     # Build static site
pnpm preview   # Preview production build
```

## Blog Publish Skill

This repo ships with a **blog-publish skill** — an agent skill that lets you generate and publish blog posts from any project you're working on.

### How it works

1. You're working in any project → tell your agent "写篇博客" / "blog this"
2. Agent collects project context (git log, README, key files)
3. Collaborates with you on angle and outline
4. Writes a Markdown article with correct frontmatter (`draft: true`)
5. You review → agent publishes (`draft: false` + push)
6. Vercel auto-deploys

### Install

```bash
# Claude Code
npx skills add kelegele/agent-blog -a claude-code

# Codex
npx skills add kelegele/agent-blog -a codex

# Other agents (copies to ~/.agents/skills/)
npx skills add kelegele/agent-blog

# List available skills
npx skills add kelegele/agent-blog --list
```

### Trigger Phrases

Any of these will activate the skill:

- `写篇博客` / `写篇文章` / `发博文` / `发一篇博文` / `新文章`
- `blog this` / `blog it` / `publish blog` / `blog this project`
- `把项目写成文章` / `post article` / `new blog post`

### Access Tiers

The skill automatically picks the best way to connect to the blog repo:

| Tier | Requires | Best for |
|------|----------|----------|
| 1 — Local clone | git + local repo path | Your own machine (fastest) |
| 2 — Temp clone | git + GitHub auth | Any machine with git configured |
| 3 — Pure REST API | `GITHUB_TOKEN` env var | Zero-dependency environments |

Permission is verified at startup — the skill will guide you through setup if needed.

### Prerequisites

One of:
- A local clone of this repo (set `AGENT_BLOG_PATH` to speed up detection)
- Git with GitHub auth (SSH key, credential helper, or `gh auth login`)
- A [GitHub PAT](https://github.com/settings/tokens/new?scopes=repo&description=blog-publish-skill) with `repo` scope, set as `GITHUB_TOKEN`

## Project Structure

```
agent-blog/
├── src/
│   ├── components/     # Reusable Astro components
│   ├── content/blog/   # Blog posts (Markdown + frontmatter)
│   ├── layouts/        # Page layouts
│   ├── pages/          # File-based routing
│   └── styles/         # Global CSS (design tokens)
├── public/             # Static assets
├── skill/              # Agent skill definition
└── astro.config.mjs    # Astro configuration
```

## Content Schema

Every post in `src/content/blog/` must include:

```yaml
---
title: string
description: string
date: YYYY-MM-DD
category: string
categorySlug: string
draft: boolean
---
```

Draft posts (`draft: true`) are filtered from production but available in dev mode.

## License

MIT
