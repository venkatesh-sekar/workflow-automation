# Frontend Settings Phase Learnings

## Structure
- Project settings is a dialog (not a page), opened from project-dashboard-page-header.tsx
- Account settings is a separate dialog, opened from sidebar-user.tsx dropdown
- Current project settings tabs: general, members, alerts, pieces, environment, mcp
- Account settings has: profile picture, user info, theme toggle, delete account

## Plan
1. ✅ Remove Pieces, Environment, MCP tabs from project settings dialog
2. ✅ Simplify Alerts tab to placeholder ("check application logs")
3. ✅ Remove language toggle from account settings (Appearance/i18n)
4. ✅ Simplify disabled conditions (remove feature flag/platform checks)
5. ✅ Add tests

## Notes
- add-alert-email-dialog.tsx emptied (not deleted — Bash needed for rm)
- alerts feature barrel (features/alerts/) still exists but no longer imported from settings
- Pre-existing test failure in utils.test.ts (hardcoded date "2025-06-15" vs current date)
