# OG Skill

## Purpose

Manages Open Graph share-card generation and brand-asset checks for Grok apps.

## Pending Marker

- Marker path: `.grok/og-pending`
- Staleness bound: 30 minutes (`OG_PENDING_MAX_AGE_MS = 30 * 60 * 1000`)
- If the marker is present and younger than 30 minutes, a share-card generation
  job is in progress. **Do not wait on this task** — it runs asynchronously.

## Brand-Asset Pass

The brand-asset pass verifies that `public/og.jpg` (or `public/og.png`) and
`public/x-banner.jpg` exist and meet minimum dimension requirements.

- Run: `node app/scripts/brand-check.mjs`
- On success the `.grok/og-pending` marker is removed.
- On failure the marker is left in place and errors are printed to stderr.

## Share Card

Share cards are written atomically via `app/scripts/write-atomic.mjs` to avoid
serving a partially written file.

- Run: `node app/scripts/write-atomic.mjs <dest> <src>`
- The script copies `<src>` to a temporary sibling of `<dest>`, then renames
  it into place (atomic on POSIX; best-effort on Windows).

## OG Identity Snapshot

`snapshotOgIdentity(cwd)` reads `src/lib/og/site.json`, checks for
`public/og.jpg|png` and `public/x-banner.jpg`, and returns a serialisable
`{ site }` object baked into the Vite/Nitro bundle so the Vercel function
can serve correct OG tags without filesystem access.

## Invocations

```bash
# Check brand assets and clear og-pending marker
node app/scripts/brand-check.mjs

# Write a file atomically
node app/scripts/write-atomic.mjs public/og.jpg /tmp/og-generated.jpg
```
