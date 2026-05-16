---
name: blog-publish
version: 1.8.0
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

## Writing Standards — Cross-Platform & SEO/GEO

Articles published through this skill are likely to be **republished to other
platforms** (WeChat Official Account, 小红书, 知乎, 掘金, etc.) and will be
**crawled by search engines and LLM training bots**. Follow these rules.

### Cross-Platform Compatibility

**Goal:** The article should survive copy-paste into any platform's editor with
minimal formatting loss.

| Rule | Why |
|------|-----|
| Use only **standard Markdown** — no HTML tags, no custom shortcodes, no platform-specific syntax | WeChat/小红书 editors strip HTML; plain Markdown renders consistently |
| Avoid `#` (h1) in body — use `##` and `###` only | `title` in frontmatter is the h1; multiple h1s confuse SEO and readers |
| Avoid footnotes (`[^1]`) — use inline links instead | Most platforms don't render footnotes |
| Avoid tables unless essential | Many mobile platforms break table layout; prefer lists |
| Avoid nested lists > 2 levels deep | Copy-paste often flattens nesting |
| Don't rely on images for critical information | WeChat/小红书 may compress or reorder images |
| Every image must have meaningful `alt` text | Accessibility + survives text-only copy + helps SEO |
| Don't use emoji in headings or frontmatter | Some platforms strip emoji in titles |
| Keep paragraphs short (3–5 sentences max) | Mobile readability on WeChat/小红书 |

### Platform Safety — Content Restrictions

**The article MUST NOT contain content that would be flagged or blocked on major
Chinese content platforms (微信、小红书、知乎、掘金).**

When writing for Chinese audiences, avoid:

- Political sensitive terms or references
- Unsubstantiated claims about companies, products, or individuals
- Direct URLs to blocked/regulated sites (use descriptive text instead)
- Promotional language that reads like an ad (unless the article IS sponsored)
- Excessive use of superlatives ("最强", "第一", "最好" without citation)
- Unverified statistics or data without attribution

When in doubt, write with a neutral, informative tone. State facts, not opinions
about controversial topics.

### SEO (Search Engine Optimization)

| Rule | Details |
|------|---------|
| `title` under 60 chars | Search engines truncate longer titles |
| `description` 120–160 chars | Optimal length for SERP snippet |
| Front-load keywords in `title` | Put the most important concept in the first half |
| Use descriptive `##` headings | Search engines use headings to understand structure |
| Natural keyword density | Mention key terms naturally 3–5 times across the article — don't stuff |
| Internal links | Link to other blog posts when relevant: `[相关文章](/blog/{slug})` |
| External authority links | Link to docs, papers, or official sources when making claims |
- External term linking     | First mention of any tool/framework/company/concept must link to its official site or docs | ❌ Warn
| Image alt text | Every `![]()` must have descriptive alt text containing relevant keywords |
| First paragraph hook | The opening paragraph should contain the primary keyword and clearly state what the article covers |

### GEO (Generative Engine Optimization)

**Goal:** Make the article easy for LLMs (ChatGPT, Perplexity, Gemini, etc.) to
understand, quote, and cite.

| Rule | Why |
|------|-----|
| Start with a **clear thesis statement** | LLMs extract the article's purpose from the first paragraph |
| Use **structured sections** with descriptive headings | LLMs parse heading hierarchy to build understanding |
| **Define terms** when first introduced | LLMs benefit from explicit definitions: "CI/CD（持续集成/持续部署）" |
| Use **lists and tables** for structured data | LLMs parse structured content more accurately than prose |
| Include a **summary or takeaway** at the end | LLMs often quote conclusions and summaries |
| State **key points explicitly** — don't bury them in metaphors | LLMs prefer direct statements over indirect language |
| Include **dates, versions, and specifics** | "Astro 6" not just "Astro"; "2026-05" not "recently" — helps LLMs with temporal relevance |
| Use **unique, specific phrasing** | Generic phrasing ("it's important to note") gets ignored; specific insights get quoted |

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
**Follow all rules in the Writing Standards section above.**

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
- **Cross-platform safe:** standard Markdown only, no HTML, no footnotes
- **SEO optimized:** title < 60 chars, description 120–160 chars, keyword in first paragraph
- **GEO friendly:** clear thesis, structured sections, explicit definitions, summary at end
- **Platform safe:** neutral tone, no superlatives without citation, no sensitive content

Tell the user where the article was saved: "Article saved to `{staging_path}`"

### Phase 7 — Handle Images

- **Tier 1/2:** Copy to `{blog-repo}/public/blog/{categorySlug}/`
- **Tier 3:** Copy to `./docs/blog-publish/{categorySlug}/` for local reference, upload via API in Phase 11
- Path: `![Descriptive alt text](/blog/{categorySlug}/image-name.webp)`
- **Every image must have descriptive alt text** (SEO + accessibility + cross-platform)

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
| 4 | `title` present | Non-empty string, < 60 chars | ❌ Block |
| 5 | `description` present | 120–160 chars, contains primary keyword | ❌ Block |
| 6 | `date` present & valid | `YYYY-MM-DD` format, must be a real date | ✅ Default to today |
| 7 | `category` present | Non-empty string | ❌ Block |
| 8 | `categorySlug` present | Non-empty, lowercase, hyphenated | ✅ Derive from `category` |
| 9 | `draft` is `true` | Must be boolean `true` at this stage | ✅ Set to `true` |

**Cross-platform compatibility (WARN + auto-fix):**

| # | Check | Rule | Auto-fix? |
|---|-------|------|:---------:|
| 10 | No HTML tags in body | No `<div>`, `<span>`, `<br>` etc. in Markdown body | ✅ Convert to Markdown |
| 11 | No `#` (h1) in body | Only `##` and `###` headings allowed | ✅ Convert `#` → `##` |
| 12 | No footnotes | No `[^n]` footnote references | ✅ Convert to inline links |
| 13 | Image alt text | Every `![]()` has non-empty alt text | ❌ Warn |

**Content quality (WARN — non-blocking but fix if possible):**

| # | Check | Rule | Auto-fix? |
|---|-------|------|:---------:|
| 14 | Body length | ≥ 400 words (warn if < 800, allow user override) | ❌ Warn |
| 15 | Headings | At least one `##` heading in body | ❌ Warn |
| 16 | Unclosed code blocks | Every opening ``` has a closing ``` | ✅ Close them |
| 17 | Empty sections | No heading followed by zero content before next heading | ❌ Warn |
| 18 | Image paths | All `![]()` paths start with `/blog/` or are external URLs | ✅ Fix paths |
| 19 | First paragraph | Contains the article's primary topic/keyword | ❌ Warn |
| 20 | External links          | First mention of tools/frameworks/companies/concepts has hyperlink to official source | ❌ Warn

**SEO/GEO quality (WARN — non-blocking):**

| # | Check | Rule | Auto-fix? |
|---|-------|------|:---------:|
| 20 | Descriptive headings | `##` headings describe content, not generic ("更多内容") | ❌ Warn |
| 21 | Has summary/conclusion | Article ends with a summary or takeaway section | ❌ Warn |
| 22 | Specifics present | Contains dates, versions, or numbers (not just "recently") | ❌ Warn |

**Filename (block if invalid):**

| # | Check | Rule | Auto-fix? |
|---|-------|------|:---------:|
| 23 | kebab-case | Only `a-z0-9-`, no spaces, underscores, or uppercase | ✅ Convert |
| 24 | No collision | Filename doesn't already exist in `src/content/blog/` | ✅ Append suffix |
| 25 | `.md` extension | Filename ends with `.md` | ✅ Append |

**Reporting format:**

```
✅ Format validation passed (or)
⚠️ Format validation: {N} issues found and auto-fixed (list them)
🚫 Format validation: {N} critical issues require attention (list them)
📊 SEO/GEO: {N} suggestions (list them)
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
