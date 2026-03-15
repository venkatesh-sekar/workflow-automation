import { isNil } from '@flow/shared';
import { Navigate } from 'react-router-dom';

import { authenticationSession } from '../../lib/authentication-session';

export default function ProjectSettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const currentProjectId = authenticationSession.getProjectId();

  if (isNil(currentProjectId)) {
    return <Navigate to="/login" replace />;
  }

  return <div className="w-full">{children}</div>;
}
