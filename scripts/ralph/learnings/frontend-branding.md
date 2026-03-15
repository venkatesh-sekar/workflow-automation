# Frontend Branding Phase Learnings

## Branding Architecture
- Dynamic branding system: server `defaultTheme` in `packages/server/api/src/app/flags/theme.ts` → flags API → `theme-provider.tsx` applies title/favicon/colors
- `generateTheme()` takes primaryColor, websiteName, logo URLs → returns theme object
- `theme-provider.tsx` sets `document.title`, favicon, and CSS custom properties (`--primary`, `--primary-100`, `--primary-300`)
- Vite config has dev-mode defaults (AP_TITLE, AP_FAVICON) in `vite.config.mts`

## Files to Update
- `theme.ts` — defaultTheme: websiteName, primaryColor, logo URLs (DONE iteration 119)
- `vite.config.mts` — dev defaults AP_TITLE, AP_FAVICON
- `styles/globals.css` — HSL primary color CSS variables (light/dark modes)
- `styles.css` — @theme primary color variables
- `show-powered-by.tsx` — "Built with activepieces" text
- `sidebar-header.tsx` — uses branding from flags (should work automatically after theme.ts change)
- Login page already has red Flow wordmark from frontend-login phase
