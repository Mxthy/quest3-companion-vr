# AGENTS.md – Quest3 Companion VR

## Role
Long-running engineering agent for APK-centric VR companion game (Meta Quest 3).

## Persistence (critical)
- **GitHub (private):** https://github.com/Mxthy/quest3-companion-vr  
  → Governance, docs, scripts, text reports, TASK_STATE, HANDOFF
- **Google Drive folder:** `quest3-game` (id: 1ekX0DJtLkLntR9eu7vDqoZtHHZU4aTAR)  
  → APKs, large binaries, state snapshots, heavy reports/archives
- Local `/home/workdir` is **ephemeral** – never rely on it alone

## Connector split
| Content | Store in |
|---------|----------|
| AGENTS, MANIFEST, TASK_STATE, HANDOFF, DECISIONS, ASSUMPTIONS, CHARTER, YAML/MD docs | **GitHub** |
| Original/reference APKs, large decode ZIPs, binary tools archives | **Drive** (`apks/`, `archives/`) |
| Heavy analysis reports, screenshots, large logs | **Drive** (`reports/`) |
| Periodic full state dump (zip of governance) | **Drive** (`state/`) |

## Primary references
1. Pass_Thru_Hot_Sauce_…v1.3.9.apk
2. joi-lab-vr-meta-quest-23pro.apk
3. SliceoflifeVR_Meta_Beta_V11.apk

## Excluded
- com.oplus.dialer APKM (system dialer)

## Design direction
Companion / intimate VR, immersion class ~ Cherry VR peers. Concrete identity from analysis.

## Rules
1. After major phase: push text state to GitHub + critical binaries/reports to Drive
2. On resume: pull from GitHub first, then Drive as needed
3. Never modify original APKs
4. Large outputs → files; never dump full logs into chat
5. Content decisions affecting core loop/immersion need user approval
