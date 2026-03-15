# Phase: rename-ap-ui-components

## Scope
- ~60 unique Ap-prefixed identifiers in packages/web/src/
- ~350+ total references
- ~16 ap-prefixed files to rename
- Components span: canvas nodes/edges, tables, forms, sidebar, error dialog, avatar, markdown

## Approach
- Iteration 20: Bulk rename all Ap-prefixed identifiers → Flow prefix
- Iteration 21: Rename ap-prefixed files → flow-prefixed and update imports

## Insights
- Some Ap-prefixed identifiers use camelCase patterns (useAp*, isAp*, createAp*, generateAp*) that don't match `Ap[A-Z]` regex — need broader check for `[a-z]Ap[A-Z]` too
- Iteration 20 caught component-style names (ApForm, ApTable), iteration 21 caught utility-style names (useApRipple, isApError)
- Iteration 22: 31 ap-prefixed files + 1 directory renamed; sed import updates were clean with no typecheck errors
- MCP tools in server/api also had ap- prefixed filenames (15 files) — not just web components
