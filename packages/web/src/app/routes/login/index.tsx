import { AuthenticationResponse, ErrorCode, isNil } from '@activepieces/shared';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { t } from 'i18next';
import { useEffect } from 'react';
import { SubmitHandler, useForm } from 'react-hook-form';
import { z } from 'zod';

import { authenticationApi } from '@/api/authentication-api';
import { FullLogo } from '@/components/custom/full-logo';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Form, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { HttpError, api } from '@/lib/api';
import { authenticationSession } from '@/lib/authentication-session';
import { useRedirectAfterLogin } from '@/lib/navigation-utils';
import { formatUtils } from '@/lib/format-utils';

const LoginSchema = z.object({
  email: z.string().regex(formatUtils.emailRegex, t('Email is invalid')),
  apiKey: z.string().min(1, t('Team key is required')),
});

type LoginSchema = z.infer<typeof LoginSchema>;

const LoginPage: React.FC = () => {
  const token = authenticationSession.getToken();
  const redirectAfterLogin = useRedirectAfterLogin();

  const form = useForm<LoginSchema>({
    resolver: zodResolver(LoginSchema),
    defaultValues: {
      email: '',
      apiKey: '',
    },
    mode: 'onChange',
  });

  useEffect(() => {
    if (token) {
      redirectAfterLogin();
    }
  }, [token, redirectAfterLogin]);

  const { mutate, isPending } = useMutation<
    AuthenticationResponse,
    HttpError,
    LoginSchema
  >({
    mutationFn: authenticationApi.teamLogin,
    onSuccess: (data) => {
      authenticationSession.saveResponse(data, false);
      redirectAfterLogin();
    },
    onError: (error) => {
      if (api.isError(error)) {
        const errorCode: ErrorCode | undefined = (
          error.response?.data as { code: ErrorCode }
        )?.code;
        if (isNil(errorCode)) {
          form.setError('root.serverError', {
            message: t('Something went wrong, please try again later'),
          });
          return;
        }
        switch (errorCode) {
          case ErrorCode.INVALID_CREDENTIALS: {
            form.setError('root.serverError', {
              message: t('Invalid email or team key'),
            });
            break;
          }
          case ErrorCode.USER_IS_INACTIVE: {
            form.setError('root.serverError', {
              message: t('User has been deactivated'),
            });
            break;
          }
          default: {
            form.setError('root.serverError', {
              message: t('Something went wrong, please try again later'),
            });
          }
        }
      }
    },
  });

  const onSubmit: SubmitHandler<LoginSchema> = (data) => {
    form.setError('root.serverError', { message: undefined });
    mutate(data);
  };

  if (token) {
    return null;
  }

  return (
    <div className="mx-auto flex h-screen flex-col items-center justify-center gap-2">
      <FullLogo />
      <Card className="w-md rounded-sm drop-shadow-xl">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">{t('Welcome to Flow')}</CardTitle>
          <CardDescription>
            {t('Enter your email and team key to sign in')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form className="grid space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem className="grid space-y-2">
                    <Label htmlFor="email">{t('Email')}</Label>
                    <Input
                      {...field}
                      required
                      id="email"
                      type="text"
                      placeholder="email@example.com"
                      className="rounded-sm"
                      tabIndex={1}
                      data-testid="login-email"
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="apiKey"
                render={({ field }) => (
                  <FormItem className="grid space-y-2">
                    <Label htmlFor="apiKey">{t('Team Key')}</Label>
                    <Input
                      {...field}
                      required
                      id="apiKey"
                      type="password"
                      placeholder="flow_..."
                      className="rounded-sm"
                      tabIndex={2}
                      data-testid="login-team-key"
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />
              {form?.formState?.errors?.root?.serverError && (
                <FormMessage>
                  {form.formState.errors.root.serverError.message}
                </FormMessage>
              )}
              <Button
                loading={isPending}
                onClick={(e) => form.handleSubmit(onSubmit)(e)}
                tabIndex={3}
                data-testid="login-button"
              >
                {t('Sign in')}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
};

LoginPage.displayName = 'LoginPage';

export { LoginPage };
