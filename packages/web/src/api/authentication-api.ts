import {
  GetCurrentProjectMemberRoleQuery,
  AuthenticationResponse,
  ProjectRole,
} from '@flow/shared';

import { api } from '@/lib/api';

export const authenticationApi = {
  teamLogin(request: { email: string; apiKey: string }) {
    return api.post<AuthenticationResponse>(
      '/v1/authentication/team-login',
      request,
    );
  },
  getCurrentProjectRole(query: GetCurrentProjectMemberRoleQuery) {
    return api.get<ProjectRole | null>('/v1/project-members/role', query);
  },
};
