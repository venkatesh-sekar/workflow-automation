import { useEmbedding } from '@/components/providers/embed-provider';

import { ProjectDashboardPageHeader } from './project-dashboard-page-header';

export const ProjectDashboardLayoutHeader = () => {
  const { embedState } = useEmbedding();
  return !embedState.isEmbedded ? <ProjectDashboardPageHeader /> : null;
};

ProjectDashboardLayoutHeader.displayName = 'ProjectDashboardLayoutHeader';

export default ProjectDashboardLayoutHeader;
