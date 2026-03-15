import { WorkerMachineWithStatus } from '@flow/shared';

import { api } from '@/lib/api';

export const workersApi = {
  list() {
    return api.get<WorkerMachineWithStatus[]>('/v1/worker-machines');
  },
};
