// Old auth hooks removed — the authenticationApi now only supports teamLogin and getCurrentProjectRole.
// These stubs exist so that downstream consumers (change-password, verify-email, check-email-note, sign-up-form)
// still compile. They should never be called at runtime in a team-auth deployment.

import { HttpError } from '@/lib/api';
import { useMutation } from '@tanstack/react-query';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const notAvailable = (_args: any): never => {
  throw new Error(
    'This authentication method is not available in team-auth mode',
  );
};

export const authMutations = {
  useSignIn: ({ onSuccess, onError }: { onSuccess?: (data: any) => void; onError?: (error: HttpError) => void }) => {
    return useMutation<any, HttpError, any>({
      mutationFn: notAvailable,
      onSuccess,
      onError,
    });
  },
  useSignUp: ({ onSuccess, onError }: { onSuccess?: (data: any) => void; onError?: (error: HttpError) => void }) => {
    return useMutation<any, HttpError, any>({
      mutationFn: notAvailable,
      onSuccess,
      onError,
    });
  },
  useSendOtpEmail: ({ onSuccess }: { onSuccess?: () => void }) => {
    return useMutation<void, HttpError, any>({
      mutationFn: notAvailable,
      onSuccess,
    });
  },
  useResetPassword: ({ onSuccess, onError }: { onSuccess?: () => void; onError?: (error: any) => void }) => {
    return useMutation<void, HttpError, any>({
      mutationFn: notAvailable,
      onSuccess,
      onError,
    });
  },
  useVerifyEmail: ({ onSuccess, onError }: { onSuccess?: (data: any) => void; onError?: (error: any) => void }) => {
    return useMutation<any, HttpError, any>({
      mutationFn: notAvailable,
      onSuccess,
      onError,
    });
  },
};
