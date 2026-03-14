# copy-pieces Phase Learnings

## Piece Location Structure
- Core pieces (built-in): `packages/pieces/core/{piece-name}/`
- Community pieces (third-party): `packages/pieces/community/{piece-name}/`
- Code, Branches/Conditions, Loops are NOT pieces — they're built-in FlowActionTypes (CODE, ROUTER, LOOP_ON_ITEMS) in the engine/shared package, already copied

## Pieces Copied
- 19 core pieces: approval, connections, csv, data-mapper, data-summarizer, delay, file-helper, forms, graphql, http, image-helper, manual-trigger, math-helper, pdf, schedule, sftp, smtp, store, text-helper
- 2 community pieces: slack, postgres
- Total: 561 files across 21 piece directories

## Core pieces NOT copied (excluded)
- crypto, qrcode (per design doc)
- date-helper, subflows, tables, tags, webhook, xml (not in the 24-piece list)

## Dependencies
- All pieces depend on shared, pieces-framework, pieces-common via file: refs
- workspace:* replaced with file: protocol (same pattern as previous phases)
- No ee/ references found in any copied pieces

## Piece Registry
- Still need to check/update piece registry to reference only these 21 pieces
- Server devDeps reference piece-facebook-leads, piece-intercom, piece-slack, piece-square (test fixtures) — will need cleanup
