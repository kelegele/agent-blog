---
name: blog-publish
version: 1.4.0
description: |
  Generate and publish blog posts from any project to kelegele/agent-blog. Triggers on:
  "写篇博客", "blog this", "发博文", "publish blog", "把项目写成文章", "写篇文章",
  "blog it", "post article", "新文章", "new blog post", "blog this project",
  "发一篇博文", "写一篇博文", "blog post about this".
  Collects project context, collaborates on outline, writes Markdown with correct
  frontmatter, generates a standalone HTML preview by reading live blog source,
  manages draft/review/publish flow. Pushes to kelegele/agent-blog main branch.
  Vercel auto-deploys on push. Use this skill whenever the user expresses intent
  to write about their current work as a blog post.
---

# blog-publish — Generate & Publish Blog Posts

Turn any project or idea into a polished blog post and publish it to
`kelegele/agent-blog`.

## Blog Repo Reference

| Item | Value |
|------|-------|
| Remote | `https://github.com/kelegele/agent-blog` |
| Branch | `main` |
| Posts dir | `src/content/blog/` |
| Images dir | `public/blog/{categorySlug}/` |
| Auto-deploy | Vercel (push to `main` triggers deploy) |

---

## Access Tiers — Read & Write the Blog Repo

Three tiers, highest available wins.

### Tier 1 — Existing Local Clone (fastest)

**Detection — check in order:**
1. `AGENT_BLOG_PATH` env var
2. `~/Projects/agent-blog`
3. `find ~ -maxdepth 3 -type d -name "agent-blog" 2>/dev/null | head -1`

**Permission check:**
```bash
cd {blog-repo} && git push --dry-run origin main 2>&1
```

Read/write via filesystem + git.

### Tier 2 — Shallow Sparse Clone (~1 MB download)

No local clone, but `git` is available.

```bash
BLOG_TMP=$(mktemp -d)
git clone --depth 1 --filter=blob:none --no-checkout \
  https://github.com/kelegele/agent-blog.git "$BLOG_TMP"
cd "$BLOG_TMP"
git sparse-checkout init --cone
git sparse-checkout set \
  src \
  astro.config.mjs \
  tsconfig.json \
  package.json \
  pnpm-lock.yaml \
  pnpm-workspace.yaml \
  public/favicon.ico \
  public/logo.png \
  public/logo-black-bg.png
git checkout
```

Cleanup: `rm -rf "$BLOG_TMP"` after publish.

### Tier 3 — Pure GitHub REST API (zero local tools)

No git, no pnpm. Requires `curl` + `jq` + `GITHUB_TOKEN` env var (PAT with `repo` scope).
Create at: `https://github.com/settings/tokens/new?scopes=repo&description=blog-publish-skill`

**Permission check:**
```bash
curl -sf -H "Authorization: token $GITHUB_TOKEN" \
  https://api.github.com/repos/kelegele/agent-blog \
  | grep -q '"push":true' && echo "HAS_PUSH" || echo "NO_PUSH"
```

**Operations:**

List posts:
```bash
curl -sf -H "Authorization: token $GITHUB_TOKEN" \
  https://api.github.com/repos/kelegele/agent-blog/contents/src/content/blog \
  | jq -r '.[].name'
```

Read a file:
```bash
curl -sf -H "Authorization: token $GITHUB_TOKEN" \
  "https://api.github.com/repos/kelegele/agent-blog/contents/{path}" \
  | jq -r '.content' | base64 -d
```

Create a file:
```bash
B64=$(printf '%s' "$CONTENT" | base64)
curl -sf -X PUT -H "Authorization: token $GITHUB_TOKEN" \
  "https://api.github.com/repos/kelegele/agent-blog/contents/src/content/blog/{filename}.md" \
  -d "{\"message\":\"post: add {title}\",\"content\":\"$B64\",\"branch\":\"main\"}"
```

Update a file:
```bash
SHA=$(curl -sf -H "Authorization: token $GITHUB_TOKEN" \
  "https://api.github.com/repos/kelegele/agent-blog/contents/src/content/blog/{filename}.md" \
  | jq -r '.sha')
B64=$(printf '%s' "$UPDATED" | base64)
curl -sf -X PUT -H "Authorization: token $GITHUB_TOKEN" \
  "https://api.github.com/repos/kelegele/agent-blog/contents/src/content/blog/{filename}.md" \
  -d "{\"message\":\"post: publish {title}\",\"content\":\"$B64\",\"branch\":\"main\",\"sha\":\"$SHA\"}"
```

Upload an image:
```bash
B64=$(base64 < /path/to/image.webp)
curl -sf -X PUT -H "Authorization: token $GITHUB_TOKEN" \
  "https://api.github.com/repos/kelegele/agent-blog/contents/public/blog/{categorySlug}/{name}.webp" \
  -d "{\"message\":\"post: add image for {title}\",\"content\":\"$B64\",\"branch\":\"main\"}"
```

### Tier Summary

| Tier | Requires | Preview | Read | Write |
|------|----------|:-------:|------|-------|
| 1 — Local clone | git + local path | ✅ | filesystem | git push |
| 2 — Sparse clone | git | ✅ | filesystem | git push |
| 3 — REST API | `GITHUB_TOKEN` + curl + jq | ✅ | API | API |

Always try Tier 1 → 2 → 3. Announce active tier at startup.

---

## Preview — Standalone HTML from Live Source

Every tier generates the preview the same way: **read the blog's actual source files
from the remote repo, assemble a self-contained HTML file, open in browser.**

This ensures the preview always matches the live blog's current design — if the blog's
CSS or layout changes, the preview reflects it automatically. No stale embedded templates.

### Source Files to Read

Read these files from the blog repo (via filesystem for Tier 1/2, via API for Tier 3):

| File | Purpose |
|------|---------|
| `src/styles/global.css` | Design tokens, reset, base styles |
| `src/layouts/BaseLayout.astro` | HTML shell, font imports, theme script |
| `src/layouts/BlogPost.astro` | Article structure, hero, meta, content styles |
| `src/components/Nav.astro` | Navigation bar structure + scoped styles |
| `src/components/Footer.astro` | Footer structure + scoped styles |

### How to Assemble the Preview

1. **Read all 5 source files** listed above from the repo.

2. **Extract the CSS.** From each `.astro` file, pull the content between
   `<style>` and `</style>`. Collect all scoped styles. From `global.css`,
   take the full file.

3. **Extract the HTML structure.** From each component/layout, pull the HTML
   template (the part outside `---` frontmatter and `<style>`/`<script>` blocks).

4. **Build the preview HTML** by combining:
   - `BaseLayout.astro`'s `<head>` (meta, font links, theme script)
   - All CSS (global + scoped from each component) in a single `<style>` block
   - Nav HTML from `Nav.astro`
   - Article HTML following `BlogPost.astro`'s structure, with the Markdown
     content converted to HTML in the `post-content` slot
   - Footer HTML from `Footer.astro`

5. **Convert the Markdown body** to HTML. Use the agent's built-in Markdown
   understanding — headings → `<h2>`/`<h3>`, code blocks → `<pre><code>`,
   images → `<img>`, links → `<a>`, etc.

6. **Save and open:**
   ```bash
   PREVIEW_FILE=$(mktemp --suffix=.html)
   # Write assembled HTML to $PREVIEW_FILE
   open "$PREVIEW_FILE"          # macOS
   xdg-open "$PREVIEW_FILE"      # Linux
   start "$PREVIEW_FILE"         # Windows
   ```

### Scoped Style Handling

Astro components use scoped CSS (e.g. `.post-title` in `BlogPost.astro`). In the
preview HTML, these styles must work without Astro's build-time scoping. Two options:

- **Simple:** Include all scoped `<style>` blocks as-is. Class names like
  `.post`, `.post-hero`, `.post-title`, `.nav`, `.footer` are unique enough
  that they won't conflict across components in a single-page preview.
- **If conflicts occur:** Prefix selectors with component context
  (e.g. `nav .nav-inner`).

In practice, this blog's component classes are already well-namespaced and won't
conflict. Include them as-is.

### Preview Workflow

1. Read live source files from repo
2. Assemble standalone HTML
3. Open in browser
4. User reviews visually
5. If edits needed → update article → regenerate preview → reopen
6. User approves → proceed to publish

After publish, cleanup:
```bash
rm -f "$PREVIEW_FILE"
```

---

## Workflow

Follow these phases **in order**.

### Phase 1 — Detect Access & Check Permissions

Run tier detection (Tier 1 → 2 → 3). Verify push permission.

If all tiers fail, ask the user for one of:
- `GITHUB_TOKEN` env var (Tier 3)
- Git + GitHub auth (Tier 1/2)
- Local clone path via `AGENT_BLOG_PATH` (Tier 1)

Announce active tier. Do not proceed until access is confirmed.

### Phase 2 — Discover the Angle

Ask the user:
- What topic or angle?
- Any specific points to cover?
- What language? (default: match user's input)

If the trigger implies the angle, propose a default and confirm.

**Do NOT start writing yet.**

### Phase 3 — Collect Project Context

From the **current working directory** (user's project), gather at least 3 sources:

- `git log --oneline -20`
- `README.md` / `package.json` — project overview, tech stack
- `AGENTS.md` / `CLAUDE.md` — conventions and context
- Key source files for the chosen angle
- `git diff --stat` — what changed recently

If not a code repo, ask for key points directly. Silently absorb context.

### Phase 4 — Propose Outline

Generate: title, section headings (3–7), summary per section, category, filename.
Present to user. Iterate until approved.

### Phase 5 — Read Existing Categories

**Tier 1/2:**
```bash
grep -rh "^category:" {blog-repo}/src/content/blog/*.md | sort -u
grep -rh "^categorySlug:" {blog-repo}/src/content/blog/*.md | sort -u
```

**Tier 3:** Use "List posts" + "Read file" API calls to scan frontmatter.

**Rules:** Prefer existing categories. New allowed — confirm first.
`category` = display label, `categorySlug` = URL-safe slug.

### Phase 6 — Write the Article

Write full Markdown with frontmatter:

```yaml
---
title: "Post Title"
description: "1–2 sentence description."
date: YYYY-MM-DD
category: "Label"
categorySlug: "slug"
draft: true
---
```

Rules:
- `date`: today, `YYYY-MM-DD`
- `draft`: ALWAYS `true` at this stage
- Match user's language, adapt tone
- 800+ words, proper Markdown, include code/image placeholders
- Filename: kebab-case, no collisions

### Phase 7 — Handle Images

- **Tier 1/2:** Copy to `{blog-repo}/public/blog/{categorySlug}/`
- **Tier 3:** Note paths, upload via API in Phase 10
- Path: `![Alt](/blog/{categorySlug}/image-name.webp)`

### Phase 8 — Generate Preview from Live Source

Read the 5 source files listed in the Preview section. Assemble standalone HTML.
Convert Markdown body to HTML. Save and open in browser.

Wait for user feedback. If edits → Phase 6 → regenerate → Phase 8.

### Phase 9 — User Final Approval

Ask: "Ready to publish?" Wait for explicit confirmation.

**Do NOT proceed until user says yes.**

### Phase 10 — Publish

1. Change `draft: true` → `draft: false`

2. **Tier 1:**
   ```bash
   cd {blog-repo}
   git add src/content/blog/{filename}.md public/blog/{categorySlug}/ 2>/dev/null || true
   git commit -m "post: publish {title}"
   git push origin main
   ```

3. **Tier 2:**
   ```bash
   cd "$BLOG_TMP"
   git add src/content/blog/{filename}.md public/blog/{categorySlug}/ 2>/dev/null || true
   git commit -m "post: publish {title}"
   git push origin main
   rm -rf "$BLOG_TMP"
   ```

4. **Tier 3:** Use "Update file" + "Upload image" API calls.

5. Confirm: "Pushed to `main`. Vercel will auto-deploy."

6. Cleanup: `rm -f "$PREVIEW_FILE"`

**Commit message:** `post: publish {title}`

---

## Error Handling

| Scenario | Action |
|----------|--------|
| All tiers fail | Ask for `GITHUB_TOKEN`, git auth, or local clone |
| Permission denied | Check token/user has push access |
| Filename collision | Append distinguishing word |
| User rejects outline | Iterate, do not write |
| Edits after preview | Phase 6 → regenerate → Phase 8 |
| Push fails (conflict) | Pull/rebase (Tier 1/2) or get latest SHA (Tier 3) |
| Source file read fails | Preview may be degraded — warn user and proceed |
| API rate limit | Wait/retry, or help set up Tier 1/2 |
