import { PageTitle } from '@/app/components/page-title';
import { AcceptInvitation } from '@/features/members';

import { LoginPage } from './login';

export const authRoutes = [
  {
    path: '/login',
    element: (
      <PageTitle title="Login">
        <LoginPage />
      </PageTitle>
    ),
  },
  {
    path: '/sign-in',
    element: (
      <PageTitle title="Login">
        <LoginPage />
      </PageTitle>
    ),
  },
  {
    path: '/invitation',
    element: (
      <PageTitle title="Accept Invitation">
        <AcceptInvitation />
      </PageTitle>
    ),
  },
];
