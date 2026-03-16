import { FlowEdition, FlowFlagId, TeamProjectsLimit } from '@flow/shared';
import { ComponentType, useRef } from 'react';
import { Link } from 'react-router-dom';

import { BotIcon } from '@/components/icons/bot';
import {
  ChevronLeftIcon,
  ChevronLeftIconHandle,
} from '@/components/icons/chevron-left';
import { FileHeartIcon } from '@/components/icons/file-heart';
import { FileJson2Icon } from '@/components/icons/file-json2';
import { FrameIcon } from '@/components/icons/frame';
import { KeyRoundIcon } from '@/components/icons/key-round';
import { LayoutGridIcon } from '@/components/icons/layout-grid';
import { LogInIcon } from '@/components/icons/log-in';
import { MousePointerClickIcon } from '@/components/icons/mouse-pointer-click';
import { PaletteIcon } from '@/components/icons/palette';
import { PuzzleIcon } from '@/components/icons/puzzle';
import { ReceiptIcon } from '@/components/icons/receipt';
import { ServerIcon } from '@/components/icons/server';
import { Settings2Icon } from '@/components/icons/settings2';
import { SquareDashedBottomCodeIcon } from '@/components/icons/square-dashed-bottom-code';
import { UnplugIcon } from '@/components/icons/unplug';
import { UsersIcon } from '@/components/icons/users';
import { WebhookIcon } from '@/components/icons/webhook';
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
import { flagsHooks } from '@/hooks/flags-hooks';
import { platformHooks } from '@/hooks/platform-hooks';
import { determineDefaultRoute } from '@/lib/route-utils';
import { cn } from '@/lib/utils';

import { FlowSidebarItem } from '../flow-sidebar-item';
import { SidebarUser } from '../sidebar-user';

export function PlatformSidebar() {
  const { platform } = platformHooks.useCurrentPlatform();
  const { data: edition } = flagsHooks.useFlag<FlowEdition>(FlowFlagId.EDITION);
  const { checkAccess } = useAuthorization();
  const defaultRoute = determineDefaultRoute(checkAccess);
  const chevronRef = useRef<ChevronLeftIconHandle>(null);
  const isEmbeddingEnabled = platform.plan.embeddingEnabled;

  const setupItems = [
    {
      to: '/platform/setup/ai',
      label: 'AI Providers',
      icon: BotIcon,
    },
    {
      to: '/platform/setup/branding',
      label: 'Branding',
      icon: PaletteIcon,
      locked: !platform.plan.customAppearanceEnabled,
    },
    {
      to: '/platform/setup/connections',
      label: 'Global Connections',
      icon: UnplugIcon,
      locked: !platform.plan.globalConnectionsEnabled,
    },
    {
      to: '/platform/setup/pieces',
      label: 'Pieces',
      icon: PuzzleIcon,
      locked: !platform.plan.managePiecesEnabled,
    },
    {
      to: '/platform/setup/templates',
      label: 'Templates',
      icon: LayoutGridIcon,
      locked: !platform.plan.manageTemplatesEnabled,
    },
    {
      to: '/platform/setup/billing',
      label: 'Billing',
      icon: ReceiptIcon,
      locked: edition === FlowEdition.COMMUNITY,
    },
    {
      to: '/platform/security/signing-keys',
      label: 'Embedding',
      icon: FrameIcon,
      locked: !platform.plan.embeddingEnabled,
    },
  ].filter((item) => !(item.label === 'AI Providers' && isEmbeddingEnabled));

  const groups: {
    label: string;
    items: {
      to: string;
      label: string;
      icon?: ComponentType<{ className?: string }>;
      locked?: boolean;
    }[];
  }[] = [
    {
      label: 'General',
      items: [
        {
          to: '/platform/teams',
          label: 'Teams',
          icon: LayoutGridIcon,
          locked: platform.plan.teamProjectsLimit === TeamProjectsLimit.NONE,
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
      items: setupItems,
    },
    {
      label: 'Security',
      items: [
        {
          to: '/platform/security/audit-logs',
          label: 'Audit Logs',
          icon: SquareDashedBottomCodeIcon,
          locked: !platform.plan.auditLogEnabled,
        },
        {
          to: '/platform/security/sso',
          label: 'Single Sign On',
          icon: LogInIcon,
          locked: !platform.plan.ssoEnabled,
        },
        {
          to: '/platform/security/project-roles',
          label: 'Team Roles',
          icon: Settings2Icon,
          locked: !platform.plan.projectRolesEnabled,
        },
        {
          to: '/platform/security/api-keys',
          label: 'API Keys',
          icon: FileJson2Icon,
          locked: !platform.plan.apiKeysEnabled,
        },
        {
          to: '/platform/security/secret-managers',
          label: 'Secret Managers',
          icon: KeyRoundIcon,
          locked: !platform.plan.secretManagersEnabled,
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
        {
          to: '/platform/infrastructure/event-destinations',
          label: 'Event Streaming',
          icon: WebhookIcon,
          locked: !platform.plan.eventStreamingEnabled,
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
                      locked={item.locked}
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
