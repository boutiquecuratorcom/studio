# PROTOTYPER RULES (READ FIRST — DO NOT EDIT)

## Baseline
- Golden baseline branch: `golden/boutique-brand-safe`
- Baseline commit (reference): `3db6813`
- Work branch for experiments: `proto/sandbox`

## Absolute rules
1) BEFORE making any code change: read this file and follow it.
2) DO NOT “refactor”, “clean up”, “reformat”, or “simplify” unrelated code.
3) Make the SMALLEST possible diff to achieve the request.
4) If you think a change is needed in a locked file, STOP and ask first.

## Locked files (do not modify)
- src/lib/boutique.ts
- src/app/(app)/my-brand/page.tsx
- src/app/(app)/my-boutique/page.tsx

## Allowed changes
- You may add NEW files (components, helpers, utilities).
- You may add code by creating a new file and importing it from allowed areas.
- Prefer “additive” changes over edits to existing logic.

## If something breaks
- Do not attempt a broad rewrite.
- Identify the minimal fix.
- If a locked file seems required, STOP and ask.

## Workflow
- All work happens on `proto/sandbox`.
- Never touch `golden/boutique-brand-safe`.
- After changes: ensure the app builds/runs; keep diffs minimal.
