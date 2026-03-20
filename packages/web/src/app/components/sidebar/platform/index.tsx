import { ComponentType, useRef } from 'react';
import { Link } from 'react-router-dom';

import {
  ChevronLeftIcon,
  ChevronLeftIconHandle,
} from '@/components/icons/chevron-left';
import { FileHeartIcon } from '@/components/icons/file-heart';
import { LayoutGridIcon } from '@/components/icons/layout-grid';
import { MousePointerClickIcon } from '@/components/icons/mouse-pointer-click';
import { PuzzleIcon } from '@/components/icons/puzzle';
import { ServerIcon } from '@/components/icons/server';
import { UnplugIcon } from '@/components/icons/unplug';
import { UsersIcon } from '@/components/icons/users';
import { buttonVariants } from '@/components/ui/button';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarMenu,
  SidebarHeader,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarSeparator,
} from '@/components/ui/sidebar-shadcn';
import { useAuthorization } from '@/hooks/authorization-hooks';
import { determineDefaultRoute } from '@/lib/route-utils';
import { cn } from '@/lib/utils';

import { FlowSidebarItem } from '../flow-sidebar-item';
import { SidebarUser } from '../sidebar-user';

export function PlatformSidebar() {
  const { checkAccess } = useAuthorization();
  const defaultRoute = determineDefaultRoute(checkAccess);
  const chevronRef = useRef<ChevronLeftIconHandle>(null);

  const groups: {
    label: string;
    items: {
      to: string;
      label: string;
      icon?: ComponentType<{ className?: string }>;
    }[];
  }[] = [
    {
      label: 'General',
      items: [
        {
          to: '/platform/teams',
          label: 'Teams',
          icon: LayoutGridIcon,
        },
        {
          to: '/platform/users',
          label: 'Users',
          icon: UsersIcon,
        },
      ],
    },
    {
      label: 'Setup',
      items: [
        {
          to: '/platform/setup/connections',
          label: 'Global Connections',
          icon: UnplugIcon,
        },
        {
          to: '/platform/setup/pieces',
          label: 'Pieces',
          icon: PuzzleIcon,
        },
        {
          to: '/platform/setup/templates',
          label: 'Templates',
          icon: LayoutGridIcon,
        },
      ],
    },
    {
      label: 'Infrastructure',
      items: [
        {
          to: '/platform/infrastructure/workers',
          label: 'Workers',
          icon: ServerIcon,
        },
        {
          to: '/platform/infrastructure/health',
          label: 'Health',
          icon: FileHeartIcon,
        },
        {
          to: '/platform/infrastructure/triggers',
          label: 'Triggers',
          icon: MousePointerClickIcon,
        },
      ],
    },
  ];

  return (
    <Sidebar className="border-r-0!">
      <SidebarHeader className="pb-0">
        <Link
          to={defaultRoute}
          className={cn(
            buttonVariants({ variant: 'ghost' }),
            'w-full justify-start gap-2 px-2',
          )}
          onMouseEnter={() => chevronRef.current?.startAnimation()}
          onMouseLeave={() => chevronRef.current?.stopAnimation()}
        >
          <ChevronLeftIcon ref={chevronRef} className="size-4" size={16} />
          <span className="truncate text-sm">{'Back to app'}</span>
        </Link>
      </SidebarHeader>
      <div className="flex-1 overflow-y-auto scrollbar-hover">
        <SidebarContent className="gap-0">
          {groups.map((group, idx) => (
            <SidebarGroup key={group.label} className="cursor-default shrink-0">
              {idx > 0 && <SidebarSeparator className="mb-3" />}
              <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {group.items.map((item) => (
                    <FlowSidebarItem
                      type="link"
                      key={item.label}
                      to={item.to}
                      label={item.label}
                      icon={item.icon}
                    />
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          ))}
        </SidebarContent>
      </div>

      <SidebarFooter>
        <SidebarUser />
      </SidebarFooter>
    </Sidebar>
  );
}
