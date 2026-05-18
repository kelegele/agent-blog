# Creations Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a `/creations` page that showcases mixed creations with rich cards, status filtering, and `Open` / `Read` actions.

**Architecture:** Add a typed local data module, a focused `CreationCard.astro` component, a new `creations.astro` page, and a `Creations` nav link. Filtering is static-link based so the page works without JavaScript and uses query parameters for status state.

**Tech Stack:** Astro 6, TypeScript, scoped Astro CSS, existing `DESIGN.md` and `src/styles/global.css` design tokens.

---

### File Structure

- Create: `src/data/creations.ts`
  - Owns `CreationStatus`, `CreationVisual`, `Creation`, `creationStatuses`, and `creations`.
- Create: `src/components/CreationCard.astro`
  - Renders one creation card with conditional visual and CTA behavior.
- Create: `src/pages/creations.astro`
  - Loads data, reads `status` query, renders header, status filters, grid, and empty state.
- Modify: `src/components/Nav.astro`
  - Adds `Creations` nav entry and active state.
- Create: `docs/superpowers/plans/2026-05-18-creations-page.md`
  - This implementation plan.

### Task 1: Data Model

**Files:**
- Create: `src/data/creations.ts`

- [ ] **Step 1: Write the typed data module**

Create `src/data/creations.ts`:

```ts
export const creationStatuses = ['Live', 'Demo', 'Thoughts'] as const;

export type CreationStatus = (typeof creationStatuses)[number];

export type CreationVisual =
  | {
      kind: 'image';
      src: string;
      alt: string;
    }
  | {
      kind: 'placeholder';
      label: string;
    };

export type Creation = {
  title: string;
  description: string;
  status: CreationStatus;
  tags: string[];
  visual?: CreationVisual;
  openUrl?: string;
  readUrl?: string;
};

export const creations: Creation[] = [
  {
    title: 'AI 离线翻译',
    description: '把 440MB 翻译大模型装进手机，在 macOS 与 Android 端完成本地推理、模型管理和发布验证。',
    status: 'Live',
    tags: ['Flutter', 'llama.cpp', 'GGUF'],
    visual: {
      kind: 'image',
      src: '/blog/geek/ai-offline-translator-macos.png',
      alt: 'AI 离线翻译 macOS 端实机翻译截图',
    },
    openUrl: 'https://kelegele.github.io/ai-offline-translator/',
    readUrl: '/blog/mobile-llm-offline-translator',
  },
  {
    title: 'AI Agent Blog',
    description: '用 Astro 6 和一套 Vercel Blog 风格设计规范，把旧博客迁移成新的 AI 创造力记录站点。',
    status: 'Live',
    tags: ['Astro', 'Vibe Coding', 'Design System'],
    visual: {
      kind: 'image',
      src: '/blog/geek/agent-blog-homepage.webp',
      alt: 'AI Agent Blog 首页截图',
    },
    openUrl: '/',
    readUrl: '/blog/ai-agent-coding',
  },
  {
    title: 'Minecraft nOWorld',
    description: '一个曾经存在的小型 Minecraft 服务器，围绕原版生存、社区协作和长期世界展开。',
    status: 'Demo',
    tags: ['Minecraft', 'Server', 'Community'],
    visual: {
      kind: 'image',
      src: '/blog/geek/mc.webp',
      alt: 'Minecraft 世界截图',
    },
    readUrl: '/blog/minecraft-noworld',
  },
  {
    title: 'Skill craft lessons',
    description: '从零依赖发布博客的 Skill 实践中，总结 Agent 工作流如何降低环境门槛。',
    status: 'Thoughts',
    tags: ['Agent Skill', 'Workflow', 'Writing'],
    visual: {
      kind: 'placeholder',
      label: 'Skill',
    },
    readUrl: '/blog/skill-craft-lessons',
  },
];
```

- [ ] **Step 2: Verify TypeScript syntax through Astro**

Run: `pnpm build`

Expected: Build fails only if the new data module has a syntax or type error. If it succeeds, continue.

### Task 2: Creation Card Component

**Files:**
- Create: `src/components/CreationCard.astro`

- [ ] **Step 1: Create `CreationCard.astro`**

Create `src/components/CreationCard.astro`:

```astro
---
import type { Creation, CreationStatus } from '../data/creations';

interface Props {
  creation: Creation;
}

const { creation } = Astro.props;

const statusClass: Record<CreationStatus, string> = {
  Live: 'is-live',
  Demo: 'is-demo',
  Thoughts: 'is-thoughts',
};

const hasOpen = Boolean(creation.openUrl);
const hasRead = Boolean(creation.readUrl);
const isExternalOpen = creation.openUrl?.startsWith('http');
const isExternalRead = creation.readUrl?.startsWith('http');
---

<article class="creation-card">
  <div class:list={['creation-visual', creation.visual?.kind === 'placeholder' && 'is-placeholder']}>
    {creation.visual?.kind === 'image' ? (
      <img src={creation.visual.src} alt={creation.visual.alt} loading="lazy" />
    ) : (
      <span>{creation.visual?.label ?? 'Creation'}</span>
    )}
  </div>

  <div class="creation-body">
    <div class="creation-heading">
      <h2>{creation.title}</h2>
      <span class:list={['status-pill', statusClass[creation.status]]}>{creation.status}</span>
    </div>

    <p>{creation.description}</p>

    <ul class="tag-list" aria-label={`${creation.title} tags`}>
      {creation.tags.map((tag) => (
        <li>{tag}</li>
      ))}
    </ul>

    {(hasOpen || hasRead) && (
      <div class="creation-actions">
        {hasOpen && (
          <a
            class="action-primary"
            href={creation.openUrl}
            target={isExternalOpen ? '_blank' : undefined}
            rel={isExternalOpen ? 'noopener' : undefined}
          >
            Open
          </a>
        )}
        {hasRead && (
          <a
            class="action-secondary"
            href={creation.readUrl}
            target={isExternalRead ? '_blank' : undefined}
            rel={isExternalRead ? 'noopener' : undefined}
          >
            Read
          </a>
        )}
      </div>
    )}
  </div>
</article>

<style>
  .creation-card {
    overflow: hidden;
    border: 1px solid var(--c-hairline);
    border-radius: var(--r-md);
    background: var(--c-canvas);
    box-shadow: var(--shadow-card);
    transition: border-color 0.2s, box-shadow 0.2s, transform 0.2s;
  }

  .creation-card:hover {
    border-color: var(--c-hairline-strong);
    box-shadow: var(--shadow-card-hover);
    transform: translateY(-2px);
  }

  .creation-visual {
    display: flex;
    align-items: center;
    justify-content: center;
    aspect-ratio: 16 / 9;
    border-bottom: 1px solid var(--c-hairline);
    background: var(--c-canvas-soft);
    color: var(--c-mute);
    font-family: var(--font-mono);
    font-size: 12px;
    line-height: 16px;
  }

  .creation-visual.is-placeholder {
    background: var(--c-canvas-soft-2);
    color: var(--c-ink);
  }

  .creation-visual img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }

  .creation-body {
    padding: var(--s-lg);
  }

  .creation-heading {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: var(--s-md);
    margin-bottom: var(--s-sm);
  }

  h2 {
    color: var(--c-ink);
    font-size: 20px;
    font-weight: 600;
    line-height: 28px;
    letter-spacing: -0.6px;
  }

  p {
    color: var(--c-body);
    font-size: 14px;
    line-height: 20px;
  }

  .status-pill {
    flex-shrink: 0;
    border: 1px solid var(--c-hairline);
    border-radius: var(--r-full);
    padding: 4px 8px;
    font-family: var(--font-mono);
    font-size: 12px;
    line-height: 16px;
  }

  .status-pill.is-live {
    border-color: var(--c-link-bg-soft);
    color: var(--c-link);
  }

  .status-pill.is-demo {
    border-color: var(--c-violet-soft);
    color: var(--c-violet);
  }

  .status-pill.is-thoughts {
    color: var(--c-mute);
  }

  .tag-list {
    display: flex;
    flex-wrap: wrap;
    gap: var(--s-xs);
    margin-top: var(--s-md);
    list-style: none;
  }

  .tag-list li {
    border-radius: var(--r-full);
    background: var(--c-canvas-soft-2);
    color: var(--c-body);
    padding: 4px 8px;
    font-family: var(--font-mono);
    font-size: 12px;
    line-height: 16px;
  }

  .creation-actions {
    display: flex;
    flex-wrap: wrap;
    gap: var(--s-xs);
    margin-top: var(--s-lg);
  }

  .creation-actions a {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-height: 36px;
    border-radius: var(--r-sm);
    padding: 0 var(--s-md);
    font-size: 14px;
    font-weight: 500;
    line-height: 20px;
    text-decoration: none;
  }

  .action-primary {
    background: var(--c-primary);
    color: var(--c-on-primary);
  }

  .action-primary:hover {
    color: var(--c-on-primary);
  }

  .action-secondary {
    border: 1px solid var(--c-hairline);
    background: var(--c-canvas);
    color: var(--c-ink);
  }

  .action-secondary:hover {
    border-color: var(--c-hairline-strong);
    color: var(--c-ink);
  }

  @media (max-width: 640px) {
    .creation-body {
      padding: var(--s-md);
    }
  }
</style>
```

- [ ] **Step 2: Run build**

Run: `pnpm build`

Expected: Build succeeds or fails because the component is not referenced yet but has a syntax issue. Fix syntax before continuing.

### Task 3: Creations Page

**Files:**
- Create: `src/pages/creations.astro`

- [ ] **Step 1: Create `/creations` page**

Create `src/pages/creations.astro`:

```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
import CreationCard from '../components/CreationCard.astro';
import { creations, creationStatuses, type CreationStatus } from '../data/creations';

const selectedStatus = Astro.url.searchParams.get('status');
const activeStatus = creationStatuses.includes(selectedStatus as CreationStatus)
  ? (selectedStatus as CreationStatus)
  : 'All';

const visibleCreations =
  activeStatus === 'All' ? creations : creations.filter((creation) => creation.status === activeStatus);

const filterItems = [
  { label: 'All', href: '/creations' },
  ...creationStatuses.map((status) => ({
    label: status,
    href: `/creations?status=${encodeURIComponent(status)}`,
  })),
];
---

<BaseLayout title="Creations — 可了个乐" description="AI experiments, tools, demos, and thoughts I have built or explored.">
  <section class="creations-hero">
    <div class="creations-hero-inner">
      <p class="eyebrow">AI × Creativity</p>
      <h1>Creations</h1>
      <p class="intro">AI experiments, tools, demos, and thoughts I have built or explored.</p>

      <nav class="status-filter" aria-label="Filter creations by status">
        {filterItems.map((item) => (
          <a href={item.href} class:list={[{ active: item.label === activeStatus }]}>
            {item.label}
          </a>
        ))}
      </nav>
    </div>
  </section>

  <section class="creations-section">
    <div class="creations-grid">
      {visibleCreations.map((creation) => (
        <CreationCard creation={creation} />
      ))}
    </div>

    {visibleCreations.length === 0 && (
      <div class="empty-state">
        <p>No creations found for this status.</p>
        <a href="/creations">View all creations</a>
      </div>
    )}
  </section>
</BaseLayout>

<style>
  .creations-hero {
    border-bottom: 1px solid var(--c-hairline);
  }

  .creations-hero-inner,
  .creations-section {
    max-width: var(--max-width);
    margin: 0 auto;
    padding-right: var(--s-lg);
    padding-left: var(--s-lg);
  }

  .creations-hero-inner {
    padding-top: var(--s-5xl);
    padding-bottom: var(--s-3xl);
  }

  .eyebrow {
    margin-bottom: var(--s-sm);
    color: var(--c-mute);
    font-family: var(--font-mono);
    font-size: 12px;
    line-height: 16px;
  }

  h1 {
    margin-bottom: var(--s-md);
    color: var(--c-ink);
    font-size: 48px;
    font-weight: 600;
    line-height: 48px;
    letter-spacing: -2.4px;
  }

  .intro {
    max-width: 620px;
    color: var(--c-body);
    font-size: 18px;
    line-height: 28px;
  }

  .status-filter {
    display: flex;
    flex-wrap: wrap;
    gap: var(--s-xs);
    margin-top: var(--s-xl);
  }

  .status-filter a {
    display: inline-flex;
    align-items: center;
    min-height: 34px;
    border: 1px solid var(--c-hairline);
    border-radius: var(--r-pill);
    padding: 0 var(--s-md);
    background: var(--c-canvas);
    color: var(--c-body);
    font-size: 14px;
    line-height: 20px;
  }

  .status-filter a:hover {
    border-color: var(--c-hairline-strong);
    color: var(--c-ink);
  }

  .status-filter a.active {
    border-color: var(--c-primary);
    background: var(--c-primary);
    color: var(--c-on-primary);
  }

  .creations-section {
    padding-top: var(--s-3xl);
    padding-bottom: var(--s-4xl);
  }

  .creations-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: var(--s-lg);
  }

  .empty-state {
    border: 1px solid var(--c-hairline);
    border-radius: var(--r-md);
    padding: var(--s-xl);
    background: var(--c-canvas-soft);
    text-align: center;
  }

  .empty-state p {
    margin-bottom: var(--s-md);
    color: var(--c-body);
  }

  .empty-state a {
    display: inline-flex;
    align-items: center;
    min-height: 36px;
    border-radius: var(--r-sm);
    padding: 0 var(--s-md);
    background: var(--c-primary);
    color: var(--c-on-primary);
    font-size: 14px;
    font-weight: 500;
  }

  .empty-state a:hover {
    color: var(--c-on-primary);
  }

  @media (max-width: 760px) {
    .creations-grid {
      grid-template-columns: 1fr;
    }
  }

  @media (max-width: 640px) {
    .creations-hero-inner,
    .creations-section {
      padding-right: var(--s-md);
      padding-left: var(--s-md);
    }

    .creations-hero-inner {
      padding-top: var(--s-3xl);
      padding-bottom: var(--s-xl);
    }

    h1 {
      font-size: 40px;
      line-height: 48px;
      letter-spacing: -1.6px;
    }

    .intro {
      font-size: 16px;
      line-height: 24px;
    }
  }
</style>
```

- [ ] **Step 2: Run build**

Run: `pnpm build`

Expected: Build succeeds and generates `/creations/index.html`.

### Task 4: Navigation

**Files:**
- Modify: `src/components/Nav.astro`

- [ ] **Step 1: Add `Creations` nav link**

In `src/components/Nav.astro`, add this link after `Blog`:

```astro
<a href="/creations" class:list={[{ active: currentPath === '/creations/' }]}>Creations</a>
```

The nav link block should become:

```astro
<div class="nav-links">
  <a href="/" class:list={[{ active: currentPath === '/' }]}>Blog</a>
  <a href="/creations" class:list={[{ active: currentPath === '/creations/' }]}>Creations</a>
  <a href="/about" class:list={[{ active: currentPath === '/about/' }]}>About</a>
  <a href="https://github.com/kelegele" target="_blank" rel="noopener">GitHub<svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12L12 4M12 4H6M12 4v6"/></svg></a>
  <ThemeToggle />
</div>
```

- [ ] **Step 2: Run build**

Run: `pnpm build`

Expected: Build succeeds.

### Task 5: Browser Verification

**Files:**
- Verify only.

- [ ] **Step 1: Start dev server**

Run: `pnpm dev -- --host 127.0.0.1`

Expected: Astro dev server prints a localhost URL.

- [ ] **Step 2: Open `/creations`**

Open the dev server URL plus `/creations`.

Expected:

- Page title reads `Creations`.
- Nav has `Creations` active.
- Four creation cards render.
- `Open` appears only when `openUrl` exists.
- `Read` appears when `readUrl` exists.
- Status filters appear as `All`, `Live`, `Demo`, `Thoughts`.

- [ ] **Step 3: Verify status query**

Open `/creations?status=Thoughts`.

Expected:

- `Thoughts` filter is active.
- Only the `Skill craft lessons` card renders.

- [ ] **Step 4: Verify responsive layout**

Check desktop width and mobile width.

Expected:

- Desktop grid uses two columns.
- Mobile grid uses one column.
- Text does not overflow buttons, cards, nav, or filter pills.

- [ ] **Step 5: Verify dark theme**

Use the existing theme toggle.

Expected:

- Cards, filters, buttons, status pills, and empty state remain styled.
- No raw browser default elements appear.

### Task 6: Final Checks

**Files:**
- Verify only.

- [ ] **Step 1: Run production build**

Run: `pnpm build`

Expected: Build succeeds.

- [ ] **Step 2: Check git diff**

Run: `git diff -- src/data/creations.ts src/components/CreationCard.astro src/pages/creations.astro src/components/Nav.astro`

Expected:

- Diff only includes the planned feature files.
- Component styles use existing CSS custom properties.
- No raw hex colors were added in component styles.

- [ ] **Step 3: Commit implementation**

Run:

```bash
git add src/data/creations.ts src/components/CreationCard.astro src/pages/creations.astro src/components/Nav.astro docs/superpowers/plans/2026-05-18-creations-page.md
git commit -m "feat: add creations page"
```
