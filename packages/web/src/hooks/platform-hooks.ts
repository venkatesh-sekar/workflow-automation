import { PlatformWithoutSensitiveData } from '@flow/shared';
import {
  QueryClient,
  useMutation,
  useSuspenseQuery,
} from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

import { platformApi } from '@/api/platforms-api';
import { authenticationSession } from '@/lib/authentication-session';

export const platformHooks = {
  useDeleteAccount: () => {
    const navigate = useNavigate();
    return useMutation({
      mutationFn: async () => {
        await platformApi.deleteAccount();
      },
      onSuccess: () => {
        toast.success('Account deleted successfully');
        navigate('/login');
      },
      onError: () => {
        toast.error('Failed to delete account. Please try again.');
      },
    });
  },
  useCurrentPlatform: () => {
    const currentPlatformId = authenticationSession.getPlatformId();
    const query = useSuspenseQuery({
      queryKey: ['platform', currentPlatformId],
      queryFn: platformApi.getCurrentPlatform,
      staleTime: Infinity,
    });
    return {
      platform: query.data,
      refetch: async () => {
        await query.refetch();
      },
      setCurrentPlatform: (
        queryClient: QueryClient,
        platform: PlatformWithoutSensitiveData,
      ) => {
        queryClient.setQueryData(['platform', currentPlatformId], platform);
      },
    };
  },
};
