import { describe, it, expect } from 'vitest';

import { SETTINGS_TAB_IDS } from './settings-tabs';

describe('Project Settings Tabs', () => {
  it('includes only general, members, and alerts tabs', () => {
    expect(SETTINGS_TAB_IDS).toEqual(['general', 'members', 'alerts']);
  });

  it('does not include removed tabs', () => {
    const removedTabs = [
      'billing',
      'api-keys',
      'git-sync',
      'custom-domains',
      'appearance',
      'pieces',
      'environment',
      'mcp',
    ];
    for (const tab of removedTabs) {
      expect(SETTINGS_TAB_IDS).not.toContain(tab);
    }
  });

  it('has exactly 3 tabs', () => {
    expect(SETTINGS_TAB_IDS).toHaveLength(3);
  });
});
