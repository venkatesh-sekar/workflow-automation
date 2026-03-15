import { Permission } from '@activepieces/shared';
import { t } from 'i18next';

import { BoxIcon } from '@/components/icons/box';
import { ConnectIcon } from '@/components/icons/connect';
import { HistoryIcon } from '@/components/icons/history';
import { ShieldIcon } from '@/components/icons/shield';
import { WorkflowIcon } from '@/components/icons/workflow';
import { useEmbedding } from '@/components/providers/embed-provider';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarMenu,
  SidebarSeparator,
} from '@/components/ui/sidebar-shadcn';
import { projectCollectionUtils } from '@/features/projects';
import { useAuthorization, useIsPlatformAdmin } from '@/hooks/authorization-hooks';
import { authenticationSession } from '@/lib/authentication-session';
import { cn } from '@/lib/utils';

import { GlobalSearchCommand } from '../../global-search/global-search-command';
import { ApSidebarItem, SidebarItemType } from '../ap-sidebar-item';
import { AppSidebarHeader } from '../sidebar-header';
import SidebarUsageLimits from '../sidebar-usage-limits';
import { SidebarUser } from '../sidebar-user';

export function ProjectDashboardSidebar({
  className,
}: { className?: string } = {}) {
  const { project } = projectCollectionUtils.useCurrentProject();
  const { embedState } = useEmbedding();
  const { checkAccess } = useAuthorization();
  const isPlatformAdmin = useIsPlatformAdmin();

  const navItems: SidebarItemType[] = [
    {
      type: 'link',
      to: authenticationSession.appendProjectRoutePrefix('/automations'),
      label: t('Flows'),
      icon: WorkflowIcon,
      hasPermission: checkAccess(Permission.READ_FLOW),
      show: true,
    },
    {
      type: 'link',
      to: authenticationSession.appendProjectRoutePrefix('/connections'),
      label: t('Connections'),
      icon: ConnectIcon,
      hasPermission: checkAccess(Permission.READ_APP_CONNECTION),
      show: true,
    },
    {
      type: 'link',
      to: authenticationSession.appendProjectRoutePrefix('/runs'),
      label: t('Runs'),
      icon: HistoryIcon,
      hasPermission: checkAccess(Permission.READ_RUN),
      show: true,
    },
    {
      type: 'link',
      to: authenticationSession.appendProjectRoutePrefix('/releases'),
      label: t('Releases'),
      icon: BoxIcon,
      hasPermission: checkAccess(Permission.READ_PROJECT_RELEASE),
      show: project.releasesEnabled,
    },
  ].filter((item) => item.show && item.hasPermission);

  const adminItems: SidebarItemType[] = isPlatformAdmin
    ? [
        {
          type: 'link',
          to: '/platform',
          label: t('Platform Admin'),
          icon: ShieldIcon,
          show: true,
          hasPermission: true,
        },
      ]
    : [];

  return (
    !embedState.hideSideNav && (
      <Sidebar
        collapsible="icon"
        id={SIDEBAR_ID}
        className={cn('max-h-[100vh]', className)}
      >
        <AppSidebarHeader />

        <SidebarContent className="overflow-x-hidden">
          <SidebarGroup>
            <div className="mb-1 group-data-[collapsible=icon]:flex group-data-[collapsible=icon]:justify-center">
              <GlobalSearchCommand />
            </div>
          </SidebarGroup>

          <SidebarSeparator />

          <SidebarGroup>
            <SidebarMenu>
              {navItems.map((item) => (
                <ApSidebarItem key={item.label} {...item} />
              ))}
            </SidebarMenu>
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter>
          <SidebarUsageLimits />
          {adminItems.map((item) => (
            <ApSidebarItem key={item.label} {...item} />
          ))}
          <SidebarUser />
        </SidebarFooter>
      </Sidebar>
    )
  );
}

export const SIDEBAR_ID = 'project-sidebar';
