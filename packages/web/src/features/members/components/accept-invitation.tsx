import { HttpStatusCode } from 'axios';
import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

import { LoadingSpinner } from '@/components/custom/spinner';
import { internalErrorToast } from '@/components/ui/sonner';

import { api } from '../../../lib/api';
import { userInvitationMutations } from '../hooks/user-invitations-hooks';

const AcceptInvitation = () => {
  const [isInvitationLinkValid, setIsInvitationLinkValid] = useState(true);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { mutate, isPending } = userInvitationMutations.useAcceptInvitation({
    onSuccess: (registered) => {
      setIsInvitationLinkValid(true);
      if (!registered) {
        setTimeout(() => {
          const email = searchParams.get('email');
          navigate(`/login`);
        }, 3000);
      } else {
        navigate('/login');
      }
    },
    onError: (error) => {
      setIsInvitationLinkValid(false);
      if (api.isError(error)) {
        switch (error.response?.status) {
          case HttpStatusCode.InternalServerError: {
            console.log(error);
            internalErrorToast();
            break;
          }
          default: {
            break;
          }
        }
      }
    },
  });
  useEffect(() => {
    const invitationToken = searchParams.get('token');
    if (!invitationToken) {
      setIsInvitationLinkValid(false);
      return;
    }
    mutate(invitationToken);
  }, [mutate, searchParams]);

  return isPending ? (
    <div className="w-screen h-screen flex justify-center items-center">
      <LoadingSpinner isLarge={true}></LoadingSpinner>
    </div>
  ) : (
    <div className="container mx-auto mt-10 max-w-md">
      {isInvitationLinkValid ? (
        <>
          <p className="text-2xl font-semibold tracking-tight text-center">
            {'Team Invitation Accepted'}
          </p>
          <p className="mt-4 text-lg text-center text-muted-foreground">
            {'Thank you for accepting the invitation. We are redirecting you right now...'}
          </p>
        </>
      ) : (
        <p className="mt-4 text-lg text-center text-destructive">
          {'Invalid invitation token. Please try again.'}
        </p>
      )}
    </div>
  );
};
AcceptInvitation.displayName = 'AcceptInvitation';
export { AcceptInvitation };
