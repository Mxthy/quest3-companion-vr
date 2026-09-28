# OG Skill

## Purpose

Manages Open Graph share-card generation and brand-asset checks for Grok apps.

## Pending Marker

- Marker path: `/workspace/.grok/og-pending`
- Staleness bound: 30 minutes (`OG_PENDING_MAX_AGE_MS = 30 * 60 * 1000`)
- If the marker is present and younger than 30 minutes, a share-card generation
  job is in progress. **Do not wait on this task** — it runs asynchronously.
- Remove the marker after a successful brand-asset pass.

## Brand-asset pass:

The brand-asset pass verifies that `public/og.jpg` (or `public/og.png`) and
`public/x-banner.jpg` exist and meet minimum dimension requirements.

- Run: `node scripts/brand-check.mjs`
- On success the `/workspace/.grok/og-pending` marker is removed.
- On failure the marker is left in place and errors are printed to stderr.
- **Do not wait on this task** — it runs asynchronously in the background.

## Share Card Hand-over

Share cards are written atomically to avoid serving a partially written file.
Each asset must be handed over with `node scripts/write-atomic.mjs`:

```bash
# Hand over og.jpg (primary share card)
node scripts/write-atomic.mjs public/og.jpg /tmp/og-generated.jpg

# Hand over x-banner.jpg (X/Twitter banner)
node scripts/write-atomic.mjs public/x-banner.jpg /tmp/x-banner-generated.jpg

# Hand over site.json (OG identity metadata)
node scripts/write-atomic.mjs src/lib/og/site.json /tmp/site-generated.json
```

The script copies the source to a temporary sibling of the destination, then
renames it into place (atomic on POSIX; best-effort on Windows).

## OG Identity Snapshot

`snapshotOgIdentity(cwd)` reads `src/lib/og/site.json`, checks for
`public/og.jpg|png` and `public/x-banner.jpg`, and returns a serialisable
`{ site }` object baked into the Vite/Nitro bundle so the Vercel function
can serve correct OG tags without filesystem access.

## Invocations

```bash
# Check brand assets and clear og-pending marker
node scripts/brand-check.mjs

# Write og.jpg atomically
node scripts/write-atomic.mjs public/og.jpg /tmp/og-generated.jpg

# Write x-banner.jpg atomically
node scripts/write-atomic.mjs public/x-banner.jpg /tmp/x-banner-generated.jpg

# Write site.json atomically
node scripts/write-atomic.mjs src/lib/og/site.json /tmp/site-generated.json
```
