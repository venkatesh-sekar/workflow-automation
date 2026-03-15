import {
  PlatformWithoutSensitiveData,
  UpdatePlatformRequestBody,
} from '@flow/shared';

import { api } from '@/lib/api';
import { authenticationSession } from '@/lib/authentication-session';

export const platformApi = {
  deleteAccount() {
    return api.delete<void>(
      `/v1/platforms/${authenticationSession.getPlatformId()}`,
    );
  },
  getCurrentPlatform() {
    const platformId = authenticationSession.getPlatformId();
    if (!platformId) {
      throw Error('No platform id found');
    }
    return api.get<PlatformWithoutSensitiveData>(`/v1/platforms/${platformId}`);
  },

  update(req: UpdatePlatformRequestBody, platformId: string) {
    return api.post<PlatformWithoutSensitiveData>(
      `/v1/platforms/${platformId}`,
      req,
    );
  },
  updateWithFormData(formdata: FormData, platformId: string) {
    return api.post<PlatformWithoutSensitiveData>(
      `/v1/platforms/${platformId}`,
      formdata,
      {},
      {
        'Content-Type': 'multipart/form-data',
      },
    );
  },
};
