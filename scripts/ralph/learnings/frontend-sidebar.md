# frontend-sidebar Phase Learnings

## Sidebar Architecture
- Main sidebar: packages/web/src/app/components/sidebar/dashboard/index.tsx
- Items to remove: Impact (/impact), Leaderboard (/leaderboard), Platform Admin, Usage Limits
- Items to keep: Explore/Templates (/templates)
- Automations/Runs/Connections are in header tabs (project-dashboard-layout-header.tsx), not sidebar
- Project list (multi-project picker) is in sidebar but not part of removal criteria
- Settings not currently in sidebar — may need adding or may be in routes only
- Agents/Chat route exists at /chats/:flowId in public-routes.tsx
- Platform sidebar (platform/index.tsx) still has Billing entry but platform admin link was removed from dashboard sidebar so it's unreachable from normal navigation
- Dashboard sidebar no longer depends on platformHooks or TeamProjectsLimit — billing checks fully removed
