/**
 * Project settings tab IDs.
 * Flow keeps only: general, members, alerts.
 * Removed: billing, api-keys, git-sync, custom-domains, pieces, environment, mcp, appearance.
 */
export const SETTINGS_TAB_IDS = ['general', 'members', 'alerts'] as const;

export type SettingsTabId = (typeof SETTINGS_TAB_IDS)[number];
