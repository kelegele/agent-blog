# Comment System TODO

## Current status

- The legacy comment backend is `kelegele/blog-comment`, deployed at `https://blog-comment.kelegele.com`.
- It is a Waline backend on Vercel, backed by LeanCloud.
- Current LeanCloud API calls fail because the app is archived:
  - `The app is archived, please restore in console before use.`
  - Backend endpoint in the error uses `lncldglobal.com`, so this is LeanCloud international/global, not China region.
- LeanCloud has announced service sunset on 2027-01-12, so this should be treated as a migration, not a temporary restore.
- Blog article pages currently hide the comment system until the migration plan is chosen.

## Data rescue

1. Restore the archived LeanCloud international app.
2. Export the `Comment` class as JSON if possible.
3. Preserve at least:
   - `objectId`
   - `url` or `path`
   - `nick`
   - `mail`
   - `link`
   - `comment`
   - `insertedAt` / `createdAt`
   - `pid` / `rid`
   - `status`
   - `like`
4. Analyze old URL/path distribution before deciding whether to map old paths to new Astro blog paths.

## Migration options

### Option A: Waline + MongoDB Atlas Free

- Keep the current Waline comment experience.
- Deploy backend on Vercel Hobby.
- Use MongoDB Atlas Free cluster as database.
- Likely lowest-code migration path from the current Waline setup.
- Vercel Hobby has no fixed outbound IP, so MongoDB Atlas network access may need `0.0.0.0/0` with a strong database user/password.
- Good fit if we want live comments with minimal frontend changes.

### Option B: Waline + Supabase Free PostgreSQL

- Keep Waline, replace LeanCloud with PostgreSQL.
- Supabase Free has a practical free tier for small blog comment volume.
- Watch database size and egress limits.
- Good fit if we prefer Postgres over MongoDB.

### Option C: Firebase

- Official LeanCloud migration docs recommend Firebase first.
- Firebase Spark can start free, but some backend capabilities may require Blaze/pay-as-you-go.
- Not an in-place Waline migration; likely needs custom comment integration or a different comment service layer.
- Good fit only if we want to adopt Firebase more broadly.

### Option D: Parse Platform

- Official LeanCloud migration docs recommend Parse Platform for open-source self-hosting.
- Parse itself is free/open source, but hosting, database, storage, and maintenance still cost time or money.
- More operationally complex than needed for a static personal blog comment system.

### Option E: Static archive + Giscus

- Export historical LeanCloud comments into static JSON/Markdown and render them read-only.
- Use Giscus or GitHub Discussions for new comments.
- Lowest long-term maintenance.
- Tradeoff: old comments are no longer interactive in the old system.

## Current preference

- For live Waline continuity: choose MongoDB Atlas Free or Supabase Free.
- For lowest maintenance: static historical archive plus Giscus.
- Do not ship a new live comment system until historical comments have been exported and old path mapping is understood.
