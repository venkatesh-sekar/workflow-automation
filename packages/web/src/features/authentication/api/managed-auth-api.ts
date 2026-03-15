import {
  ManagedAuthnRequestBody,
  AuthenticationResponse,
} from '@flow/shared';

import { api } from '@/lib/api';

export const managedAuthApi = {
  generateFlowToken: async (request: ManagedAuthnRequestBody) => {
    return api.post<AuthenticationResponse>(
      `/v1/managed-authn/external-token`,
      request,
    );
  },
};
