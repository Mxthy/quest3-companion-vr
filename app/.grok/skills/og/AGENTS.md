# OG Agents

## Pending Marker

- Marker path: `/workspace/.grok/og-pending`
- Staleness bound: 30 minutes (`OG_PENDING_MAX_AGE_MS = 30 * 60 * 1000`)
- **Do not wait on this task** — share-card generation runs asynchronously.

## Brand-asset pass:

Run after any change to `public/og.jpg`, `public/og.png`, or `public/x-banner.jpg`:

```bash
node scripts/brand-check.mjs
```

## Hand-over Commands

```bash
node scripts/write-atomic.mjs public/og.jpg /tmp/og-generated.jpg
node scripts/write-atomic.mjs public/x-banner.jpg /tmp/x-banner-generated.jpg
node scripts/write-atomic.mjs src/lib/og/site.json /tmp/site-generated.json
```
