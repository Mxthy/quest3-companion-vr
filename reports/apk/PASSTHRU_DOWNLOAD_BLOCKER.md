# Pass_Thru Pilot – Download Blocker

**Date:** 2026-09-14

## Issue
`google_drive_download_artifact` enforces a **128 MiB** max size.
Pass_Thru APK is ~401 MiB (file_id `1QNiPdsb7TQRcomlzUsE03ujNR5tLeB_E`).

All three primary APKs exceed this limit:
- Pass_Thru ~421 MB
- joi-lab ~608 MB
- Sliceoflife ~962 MB

## Attempted
- Direct connector download → rejected
- gdown install/use → package install failed in environment

## Options to unblock
1. **User:** Split each APK into parts <120 MB (e.g. `split -b 100M`), upload parts to Drive, agent reassembles with `cat`.
2. **User:** Host APK on a direct HTTP(S) URL (dlvr, own server, public S3) → agent `curl`s it (no 128 MB connector limit).
3. **User:** Make Drive file "Anyone with link" + provide confirm-bypass flow if a future tool supports authenticated large download.
4. **Partial analysis:** If user can extract and upload only `AndroidManifest.xml` + `lib/` listing + `assets/` tree (zip <128 MB), agent can still do engine detection and high-level architecture without full APK.

## Recommended next step
Option 1 or 2. Fastest path for full basisscan: direct HTTPS URL of the APK.
