# Creations page design

Date: 2026-05-18

## Goal

Add a `Creations` page to the Astro blog that showcases creations as a mixed portfolio of shipped work, demos, and thought-driven experiments. The page should help visitors quickly understand what has been made, what state each creation is in, and where to open it or read the related article.

The page must follow the existing Vercel Blog-inspired design system in `DESIGN.md` and `src/styles/global.css`.

## Route and navigation

- Route: `/creations`
- Nav label: `Creations`
- Nav behavior:
  - Add a first-class navigation link next to `Blog` and `About`.
  - Mark the link active when `Astro.url.pathname` is `/creations/`.
  - Preserve existing responsive nav behavior and spacing.

## Content model

Use a local typed data module for the first version, not a CMS and not a content collection. The page needs a stable schema without introducing authoring overhead.

Suggested file:

- `src/data/creations.ts`

Creation fields:

```ts
type CreationStatus = 'Live' | 'Demo' | 'Thoughts';

type Creation = {
  title: string;
  description: string;
  status: CreationStatus;
  tags: string[];
  visual?: {
    kind: 'gradient' | 'image' | 'placeholder';
    src?: string;
    alt?: string;
  };
  openUrl?: string;
  readUrl?: string;
};
```

Rules:

- `title`, `description`, `status`, and `tags` are required.
- `openUrl` and `readUrl` are optional, but every creation should have at least one of them.
- `visual` is optional. Cards must still look intentional when no image or gradient is provided.
- External tools, frameworks, libraries, standards, and resources mentioned in related blog posts must still be linked inside those posts per repository rules.

## Status filtering

The page has a compact pill filter row:

- `All`
- `Live`
- `Demo`
- `Thoughts`

Behavior:

- Use URL query state, for example `/creations?status=Live`, if filtering is implemented with client-side script.
- The default view is `All`.
- If JavaScript is unavailable, the page should still render all creations.
- Do not add category filters in the first version.
- Do not add search in the first version.

## Page layout

The page uses a restrained portfolio layout:

1. Header section
   - Title: `Creations`
   - Short sentence describing the collection.
   - Status filter pills below the description.

2. Creation grid
   - Rich project cards in a responsive grid.
   - Desktop: two columns when space allows.
   - Mobile: one column.
   - Cards use `var(--r-md)` or existing card radius tokens.
   - Cards use design-system colors only.
   - Shadows must use existing stacked shadow tokens, not a new heavy drop shadow.

3. Empty state
   - If a selected status has no entries, show a styled empty state using existing typography and color tokens.
   - No default browser-styled buttons or links.

## Creation card

Each card has:

- Visual area at the top.
  - Can be an image, a full-width gradient, or a neutral placeholder.
  - Must not rely on raw unstyled image output.
- Title.
- Status pill.
- Description.
- Tag row.
- CTA row.

CTA behavior:

- Show `Open` when `openUrl` exists.
- Show `Read` when `readUrl` exists.
- If both exist, show both with `Open` as the primary action and `Read` as the secondary action.
- If only one exists, show only that action.
- External links must include safe attributes such as `target="_blank"` and `rel="noopener"` where appropriate.

Status styling:

- `Live`: link-blue accent token.
- `Demo`: violet accent token.
- `Thoughts`: neutral or muted token.
- Styling must use existing CSS custom properties from `src/styles/global.css`.

## Components

Recommended implementation units:

- `src/pages/creations.astro`
  - Loads creation data.
  - Renders page header, filter controls, and grid.

- `src/components/CreationCard.astro`
  - Owns the card markup and styling.
  - Handles conditional visual and CTA rendering.

- `src/data/creations.ts`
  - Owns creation data and TypeScript types.

This keeps the page readable and avoids bloating an existing component.

## Styling constraints

- Use scoped Astro styles for page and card components.
- Use `var(--c-*)`, `var(--s-*)`, `var(--r-*)`, `var(--font-*)`, and existing shadow tokens.
- Do not introduce new raw hex colors in component styles.
- Do not introduce a new design language. Match the current Vercel Blog-inspired surfaces, spacing, typography, and interaction patterns.
- Headlines use sentence case.
- Body text uses normal-weight sans-serif.
- Monospace is reserved for tags, technical labels, or status details.
- The hero mesh gradient may be used only at hero-scale visual weight, not as many small decorative fragments.

## Initial content

Seed the page with creations that map to existing blog posts where possible:

- Mobile LLM offline translator
- Minecraft NoWorld
- AI agent coding
- Skill craft lessons

Exact titles, descriptions, tags, and links should be finalized during implementation by reading the existing post frontmatter and slugs.

## Out of scope

- Creation detail pages.
- CMS integration.
- Content collection migration for creations.
- Category filters.
- Search.
- Analytics events.
- Automated image generation.

## Verification

Before considering implementation complete:

- Run `pnpm build`.
- Inspect `/creations` in a browser at desktop and mobile widths.
- Confirm the page works in light and dark themes.
- Confirm nav active state works for `/creations`.
- Confirm cards do not break when `visual`, `openUrl`, or `readUrl` is missing.
- Confirm no visible element appears with default browser styling.
