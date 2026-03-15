import {
  ListOAuth2AppRequest,
  OAuthApp,
  UpsertOAuth2AppRequest,
  FlowEdition,
  SeekPage,
} from '@flow/shared';

import { api } from '@/lib/api';

export const oauthAppsApi = {
  listCloudOAuth2Apps(
    _edition: FlowEdition,
  ): Promise<Record<string, { clientId: string }>> {
    return Promise.resolve({});
  },
  listPlatformOAuth2Apps(request: ListOAuth2AppRequest) {
    return api.get<SeekPage<OAuthApp>>('/v1/oauth-apps', request);
  },
  delete(credentialId: string) {
    return api.delete<void>(`/v1/oauth-apps/${credentialId}`);
  },
  upsert(request: UpsertOAuth2AppRequest) {
    return api.post<OAuthApp>('/v1/oauth-apps', request);
  },
};
