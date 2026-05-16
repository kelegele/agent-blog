---
name: blog-publish
version: 1.7.0
description: |
  Generate and publish blog posts from any project to kelegele/agent-blog.
  ZERO DEPENDENCIES — does NOT require Node.js, pnpm, git, or any local build tools.
  Works with only a browser and a GitHub token. Triggers on:
  "写篇博客", "blog this", "发博文", "publish blog", "把项目写成文章", "写篇文章",
  "blog it", "post article", "新文章", "new blog post", "blog this project",
  "发一篇博文", "写一篇博文", "blog post about this", "edit blog post",
  "修改文章", "更新博文", "edit article".
  Collects project context, collaborates on outline, writes Markdown with correct
  frontmatter, validates article format, generates a standalone HTML preview by
  reading live blog source, manages draft/review/publish flow. Pushes to
  kelegele/agent-blog main branch. Vercel auto-deploys on push. Use this skill
  whenever the user expresses intent to write about their current work as a blog post.
---

# blog-publish — Generate & Publish Blog Posts

> **⚠️ DO NOT assume Node.js, pnpm, git, or any build tools are required.**
> This skill has three access tiers. The lowest tier (Tier 3) works with
> **only `curl` + `jq` + a GitHub token**. No git, no Node.js, no pnpm,
> no local clone. Always check what's available and use the highest tier
> that works. NEVER tell the user they must install git/Node/pnpm — they
> are NOT required.

Turn any project or idea into a polished blog post and publish it to
`kelegele/agent-blog`. Also supports editing existing posts.

## Blog Repo Reference

| Item | Value |
|------|-------|
| Remote | `https://github.com/kelegele/agent-blog` |
| Branch | `main` |
| Posts dir | `src/content/blog/` |
| Images dir | `public/blog/{categorySlug}/` |
| Schema | `src/content.config.ts` (source of truth — read it dynamically) |
| Auto-deploy | Vercel (push to `main` triggers deploy) |

## Article Staging Location

Generated articles are saved to a local file for review before publishing.
The staging location depends on the active tier:

| Tier | Article staging path |
|------|---------------------|
| 1 — Local clone | `{blog-repo}/src/content/blog/{filename}.md` |
| 2 — Sparse clone | `{BLOG_TMP}/src/content/blog/{filename}.md` |
| 3 — REST API | `./docs/blog-publish/{filename}.md` (current project directory) |

**Why `./docs/blog-publish/` for Tier 3?** When there's no blog repo clone, the
article needs a local home for editing and preview. The `docs/` directory is a
conventional place for documentation in any project. The subdirectory `blog-publish`
keeps it isolated from the project's own docs. Create it if it doesn't exist:

```bash
mkdir -p ./docs/blog-publish
```

After the article is published (pushed to remote via API), this local copy remains
as a backup. Tell the user they can delete it or keep it.

---

## Schema — Read Dynamically, Never Hardcode

The blog's frontmatter schema is defined in `src/content.config.ts`. **Read this
file at runtime** to get the current schema — do not rely on the snapshot below.

**File location:** `src/content.config.ts`

Known schema as of this writing (may change — always verify):

| Field | Type | Required | Default |
|-------|------|:--------:|---------|
| `title` | `string` | ✅ | — |
| `description` | `string` | ✅ | — |
| `date` | `Date` (coerced) | ✅ | — |
| `category` | `string` | ✅ | — |
| `categorySlug` | `string` | optional | — |
| `draft` | `boolean` | optional | `false` |

If the schema changes in the future (e.g. a `tags` field is added), the agent
will pick it up automatically by reading this file.

---

## Access Tiers — Read & Write the Blog Repo

Three tiers. Always try **Tier 1 → 2 → 3** and use the highest one that works.
**NEVER tell the user they need to install git, Node.js, or pnpm.** If Tier 1
or 2 isn't available, use Tier 3 silently.

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

### Tier 3 — Pure GitHub REST API (ZERO DEPENDENCIES)

**No git, no Node.js, no pnpm, no local tools required.**
Only needs `curl` + `jq` (pre-installed on macOS/Linux) and a GitHub PAT.

**Required:** `GITHUB_TOKEN` or `GH_TOKEN` env var — a GitHub PAT with `repo` scope.
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

| Tier | Requires | Preview | Read | Write | Article staging |
|------|----------|:-------:|------|-------|-----------------|
| 1 — Local clone | git + local path | ✅ | filesystem | git push | `{blog-repo}/src/content/blog/` |
| 2 — Sparse clone | git | ✅ | filesystem | git push | `{BLOG_TMP}/src/content/blog/` |
| 3 — REST API | `GITHUB_TOKEN` + curl + jq | ✅ | API | API | `./docs/blog-publish/` |

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

6. **Save and open** (detect platform automatically):
   ```bash
   PREVIEW_FILE=$(mktemp --suffix=.html)
   # Write assembled HTML to $PREVIEW_FILE
   # Open in browser:
   case "$(uname -s)" in
     Darwin)  open "$PREVIEW_FILE" ;;
     Linux)   xdg-open "$PREVIEW_FILE" ;;
     MINGW*|MSYS*|CYGWIN*) start "$PREVIEW_FILE" ;;
     *)       echo "Preview saved to: $PREVIEW_FILE" ;;
   esac
   ```

### Scoped Style Handling

Astro components use scoped CSS. In the preview HTML, include all scoped `<style>`
blocks as-is. This blog's component classes (`.post`, `.post-hero`, `.nav`, `.footer`)
are already well-namespaced and won't conflict.

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

## Workflow — New Article

Follow these phases **in order**.

### Phase 1 — Detect Access & Check Permissions

Run tier detection (Tier 1 → 2 → 3). Verify push permission.

If all tiers fail:
- First check if `GITHUB_TOKEN` or `GH_TOKEN` is set → Tier 3
- Ask the user to provide a GitHub PAT with `repo` scope if not set
- NEVER ask the user to install git, Node.js, or pnpm — these are optional, not required

Announce active tier and article staging location. Do not proceed until access is confirmed.

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

### Phase 5 — Read Existing Categories & Schema

**Read schema** from `src/content.config.ts` to get the current frontmatter fields.

**Read categories** by scanning frontmatter from all posts:

**Tier 1/2:**
```bash
grep -rh "^category:" {blog-repo}/src/content/blog/*.md | sort -u
grep -rh "^categorySlug:" {blog-repo}/src/content/blog/*.md | sort -u
```

**Tier 3:** Use "List posts" + "Read file" API calls to scan frontmatter.

**Category rules:** Prefer existing categories. New allowed — confirm first.
`category` = display label, `categorySlug` = URL-safe slug.

### Phase 6 — Write the Article

Write full Markdown with frontmatter that matches the schema read in Phase 5.

**Save to staging location** (see Article Staging Location table above):

- **Tier 1/2:** Write to `{blog-repo}/src/content/blog/{filename}.md` (or `{BLOG_TMP}/...`)
- **Tier 3:** Write to `./docs/blog-publish/{filename}.md`

```bash
# Tier 3 staging
mkdir -p ./docs/blog-publish
```

Rules:
- `date`: today, `YYYY-MM-DD`
- `draft`: ALWAYS `true` at this stage
- Match user's language, adapt tone
- 800+ words, proper Markdown, include code/image placeholders
- Filename: kebab-case, no collisions

Tell the user where the article was saved: "Article saved to `{staging_path}`"

### Phase 7 — Handle Images

- **Tier 1/2:** Copy to `{blog-repo}/public/blog/{categorySlug}/`
- **Tier 3:** Copy to `./docs/blog-publish/{categorySlug}/` for local reference, upload via API in Phase 11
- Path: `![Alt](/blog/{categorySlug}/image-name.webp)`

### Phase 8 — Validate Article Format

Before generating the preview, run a **format validation check** on the article.
This acts as a mini CI gate — all checks must pass before proceeding to preview.

**Auto-fix what you can, then report what you fixed. Block on critical errors.**

#### Validation Checklist

Run every check below. Fix issues inline if possible, then report results.

**Frontmatter structure (block if invalid):**

| # | Check | Rule | Auto-fix? |
|---|-------|------|:---------:|
| 1 | `---` fences | File starts with `---` on line 1, closing `---` present | ✅ Add fences |
| 2 | YAML parseable | Content between fences is valid YAML | ❌ Block |
| 3 | No extra fields | Only fields defined in `src/content.config.ts` schema | ✅ Remove extras |

**Frontmatter fields (block if missing required, auto-fix optional):**

| # | Check | Rule | Auto-fix? |
|---|-------|------|:---------:|
| 4 | `title` present | Non-empty string | ❌ Block |
| 5 | `description` present | Non-empty string, 1–3 sentences | ❌ Block |
| 6 | `date` present & valid | `YYYY-MM-DD` format, must be a real date | ✅ Default to today |
| 7 | `category` present | Non-empty string | ❌ Block |
| 8 | `categorySlug` present | Non-empty, lowercase, hyphenated | ✅ Derive from `category` |
| 9 | `draft` is `true` | Must be boolean `true` at this stage | ✅ Set to `true` |

**Content quality (WARN — non-blocking but fix if possible):**

| # | Check | Rule | Auto-fix? |
|---|-------|------|:---------:|
| 10 | Body length | ≥ 400 words (warn if < 800, allow user override) | ❌ Warn |
| 11 | Headings | At least one `##` heading in body | ❌ Warn |
| 12 | Unclosed code blocks | Every opening ``` has a closing ``` | ✅ Close them |
| 13 | Empty sections | No heading followed by zero content before next heading | ❌ Warn |
| 14 | Image paths | All `![]()` paths start with `/blog/` or are external URLs | ✅ Fix paths |

**Filename (block if invalid):**

| # | Check | Rule | Auto-fix? |
|---|-------|------|:---------:|
| 15 | kebab-case | Only `a-z0-9-`, no spaces, underscores, or uppercase | ✅ Convert |
| 16 | No collision | Filename doesn't already exist in `src/content/blog/` | ✅ Append suffix |
| 17 | `.md` extension | Filename ends with `.md` | ✅ Append |

**Reporting format:**

```
✅ Format validation passed (or)
⚠️ Format validation: {N} issues found and auto-fixed (list them)
🚫 Format validation: {N} critical issues require attention (list them)
```

**If any BLOCK-level check cannot be auto-fixed, stop and ask the user for input.**
Do not proceed to Phase 9 (preview) until all blockers are resolved.

### Phase 9 — Generate Preview from Live Source

Read the 5 source files listed in the Preview section. Assemble standalone HTML.
Convert Markdown body to HTML. Save and open in browser.

Wait for user feedback. If edits → Phase 6 → Phase 8 (re-validate) → Phase 9.

### Phase 10 — User Final Approval

Ask: "Ready to publish?" Wait for explicit confirmation.

**Do NOT proceed until user says yes.**

### Phase 11 — Publish

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

4. **Tier 3:** Use "Create file" API to push `./docs/blog-publish/{filename}.md` to remote.
   Also upload any images via "Upload image" API call.

5. **Verify deployment** (optional but recommended):
   ```bash
   curl -sf "https://agent-blog-kelegele.vercel.app/blog/{slug}" -o /dev/null -w "%{http_code}"
   # 200 = deployed successfully
   ```

6. Confirm: "Pushed to `main`. Vercel will auto-deploy. Live URL: https://agent-blog-kelegele.vercel.app/blog/{slug}"

7. Cleanup: `rm -f "$PREVIEW_FILE"`
   Tier 3 note: `./docs/blog-publish/{filename}.md` is kept as local backup.
   Tell the user: "Local copy at `./docs/blog-publish/{filename}.md` — you can delete it or keep it."

**Commit message:** `post: publish {title}`

---

## Workflow — Edit Existing Article

When the user wants to edit an existing post (trigger: "edit article", "修改文章",
"update blog post", etc.):

### E-Phase 1 — Find the Article

List existing posts and ask which one to edit. Or accept a slug/filename from the user.

### E-Phase 2 — Read Current Content

Read the article file from the repo (filesystem or API).

### E-Phase 3 — Apply Edits

Ask the user what to change. Apply edits to the Markdown content.
Do NOT change `draft` status — keep whatever it currently is.

For Tier 3, save the edited version to `./docs/blog-publish/{filename}.md`.

### E-Phase 4 — Re-validate (Phase 8 from new article workflow)

Run the same validation checklist. Fix issues, report results.

### E-Phase 5 — Preview

Generate preview from live source. Open in browser. Iterate until approved.

### E-Phase 6 — Push

Commit and push with message: `post: update {title}`

---

## Error Handling

| Scenario | Action |
|----------|--------|
| All tiers fail | Ask for `GITHUB_TOKEN` — do NOT ask for git/Node/pnpm install |
| Permission denied | Check token has `repo` scope and push access |
| Filename collision | Append distinguishing word |
| User rejects outline | Iterate, do not write |
| Validation blockers | Fix auto-fixable issues, ask user for the rest |
| Edits after preview | Phase 6 → Phase 8 (re-validate) → Phase 9 |
| Push fails (conflict) | Pull/rebase (Tier 1/2) or get latest SHA (Tier 3) |
| Source file read fails | Preview may be degraded — warn user and proceed |
| API rate limit | Wait/retry, or help set up Tier 1/2 |
| User lacks technical background | Use Tier 3, explain in simple terms, never require installs |
| Deployment verification fails | Non-blocking — Vercel may take 30–60s to deploy |
| `./docs/blog-publish/` already has files | Inform user, ask if they want to overwrite or use a different name |
