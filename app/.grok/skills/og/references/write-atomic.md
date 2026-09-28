# write-atomic Reference

Atomically replaces a destination file by writing to a temp sibling first,
then renaming into place (POSIX-atomic; best-effort on Windows).

## Usage

```bash
node scripts/write-atomic.mjs <destination> <source>
```

## Hand-over Examples

```bash
# og.jpg — primary Open Graph share card
node scripts/write-atomic.mjs public/og.jpg /tmp/og-generated.jpg

# x-banner.jpg — X/Twitter banner (1200×264)
node scripts/write-atomic.mjs public/x-banner.jpg /tmp/x-banner-generated.jpg

# site.json — OG identity metadata
node scripts/write-atomic.mjs src/lib/og/site.json /tmp/site-generated.json
```

## Marker Cleanup

After all three assets are handed over, remove the pending marker:

```bash
rm -f /workspace/.grok/og-pending
```
