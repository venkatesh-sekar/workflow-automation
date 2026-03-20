import { UserWithMetaInformation } from '@flow/shared';

import { api } from '@/lib/api';

export const userApi = {
  getUserById(id: string) {
    return api.get<UserWithMetaInformation>(`/v1/users/${id}`);
  },
};
