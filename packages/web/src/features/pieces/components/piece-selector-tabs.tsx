import React from 'react';

import { Tabs, TabsTrigger, TabsList } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

import {
  PieceSelectorTabType,
  usePieceSelectorTabs,
} from '../stores/piece-selector-tabs-provider';

type TabType = {
  value: PieceSelectorTabType;
  name: string;
  icon: React.ReactNode;
};

export const PieceSelectorTabs = ({ tabs }: { tabs: TabType[] }) => {
  const { selectedTab, setSelectedTab } = usePieceSelectorTabs();
  return (
    <Tabs
      value={selectedTab}
      onValueChange={(value) => setSelectedTab(value as PieceSelectorTabType)}
      className="w-full"
    >
      <TabsList
        className={cn(
          'h-full w-full flex gap-3 px-2 justify-start rounded-none bg-background',
        )}
        style={{
          gridTemplateColumns: `repeat(${tabs.length}, minmax(0, 1fr))`,
        }}
      >
        {tabs.map((tab) => (
          <TabsTrigger
            key={tab.value}
            value={tab.value}
            className={cn(
              'flex flex-col grow h-full rounded-md w-[85px] max-w-[85px] shrink-0',
              'hover:bg-accent',
              'data-[state=active]:text-primary data-[state=active]:shadow-none',
              'border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent',
              'text-accent-foreground [&>svg]:size-5 [&>svg]:shrink-0',
            )}
          >
            {tab.icon}
            <span className="mt-1.5 text-sm">{tab.name}</span>
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
};
