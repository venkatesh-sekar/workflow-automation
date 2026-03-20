import React, { Suspense } from 'react';
import { Navigate } from 'react-router-dom';

import { PageTitle } from '@/app/components/page-title';
import { LoadingScreen } from '@/components/custom/loading-screen';

import { PlatformLayout } from '../components/platform-layout';

const SettingsHealthPage = React.lazy(() => import('./platform/infra/health'));
const TriggerHealthPage = React.lazy(() => import('./platform/infra/triggers'));
const SettingsWorkersPage = React.lazy(
  () => import('./platform/infra/workers'),
);
const ProjectsPage = React.lazy(() => import('./platform/projects'));
const GlobalConnectionsTable = React.lazy(() =>
  import('./platform/setup/connections').then((m) => ({
    default: m.GlobalConnectionsTable,
  })),
);
const PlatformPiecesPage = React.lazy(() =>
  import('./platform/setup/pieces').then((m) => ({
    default: m.PlatformPiecesPage,
  })),
);
const PlatformTemplatesPage = React.lazy(() =>
  import('./platform/setup/templates').then((m) => ({
    default: m.PlatformTemplatesPage,
  })),
);
const UsersPage = React.lazy(() => import('./platform/users'));

function SuspenseWrapper({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<LoadingScreen />}>{children}</Suspense>;
}

export const platformRoutes = [
  {
    path: '/platform',
    element: (
      <PlatformLayout>
        <PageTitle title="Platform">
          <Navigate to="/platform/teams" />
        </PageTitle>
      </PlatformLayout>
    ),
  },
  {
    path: '/platform/teams',
    element: (
      <PlatformLayout>
        <PageTitle title="Teams">
          <SuspenseWrapper>
            <ProjectsPage />
          </SuspenseWrapper>
        </PageTitle>
      </PlatformLayout>
    ),
  },
  {
    path: '/platform/projects',
    element: (
      <PlatformLayout>
        <PageTitle title="Teams">
          <Navigate to="/platform/teams" replace />
        </PageTitle>
      </PlatformLayout>
    ),
  },
  {
    path: '/platform/users',
    element: (
      <PlatformLayout>
        <PageTitle title="Users">
          <SuspenseWrapper>
            <UsersPage />
          </SuspenseWrapper>
        </PageTitle>
      </PlatformLayout>
    ),
  },
  {
    path: '/platform/setup',
    element: (
      <PlatformLayout>
        <PageTitle title="Platform Setup">
          <Navigate to="/platform/setup/connections" replace />
        </PageTitle>
      </PlatformLayout>
    ),
  },
  {
    path: '/platform/setup/pieces',
    element: (
      <PlatformLayout>
        <PageTitle title="Pieces">
          <SuspenseWrapper>
            <PlatformPiecesPage />
          </SuspenseWrapper>
        </PageTitle>
      </PlatformLayout>
    ),
  },
  {
    path: '/platform/setup/connections',
    element: (
      <PlatformLayout>
        <PageTitle title="Connections">
          <SuspenseWrapper>
            <GlobalConnectionsTable />
          </SuspenseWrapper>
        </PageTitle>
      </PlatformLayout>
    ),
  },
  {
    path: '/platform/setup/templates',
    element: (
      <PlatformLayout>
        <PageTitle title="Templates">
          <SuspenseWrapper>
            <PlatformTemplatesPage />
          </SuspenseWrapper>
        </PageTitle>
      </PlatformLayout>
    ),
  },
  {
    path: '/platform/infrastructure',
    element: (
      <PlatformLayout>
        <PageTitle title="Platform Infrastructure">
          <Navigate to="/platform/infrastructure/workers" replace />
        </PageTitle>
      </PlatformLayout>
    ),
  },
  {
    path: '/platform/infrastructure/workers',
    element: (
      <PlatformLayout>
        <PageTitle title="Workers">
          <SuspenseWrapper>
            <SettingsWorkersPage />
          </SuspenseWrapper>
        </PageTitle>
      </PlatformLayout>
    ),
  },
  {
    path: '/platform/infrastructure/health',
    element: (
      <PlatformLayout>
        <PageTitle title="System Health">
          <SuspenseWrapper>
            <SettingsHealthPage />
          </SuspenseWrapper>
        </PageTitle>
      </PlatformLayout>
    ),
  },
  {
    path: '/platform/infrastructure/triggers',
    element: (
      <PlatformLayout>
        <PageTitle title="Trigger Health">
          <SuspenseWrapper>
            <TriggerHealthPage />
          </SuspenseWrapper>
        </PageTitle>
      </PlatformLayout>
    ),
  },
];
