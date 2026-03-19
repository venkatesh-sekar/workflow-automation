import { UserAuthProperty } from '@flow/pieces-framework';
import { UpsertUserAuthRequest } from '@flow/shared';
import React from 'react';
import { useFormContext } from 'react-hook-form';
import { z } from 'zod';

import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';

import { SecretInput } from './secret-input';

type UserAuthConnectionSettingsProps = {
  authProperty: UserAuthProperty;
  isGlobalConnection: boolean;
};

const UserAuthConnectionSettings = React.memo(
  ({ isGlobalConnection }: UserAuthConnectionSettingsProps) => {
    const forSchema = z.object({
      request: UpsertUserAuthRequest,
    });
    const form = useFormContext<z.infer<typeof forSchema>>();

    return (
      <>
        <FormField
          name="request.value.client_id"
          control={form.control}
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>{'Client ID'}</FormLabel>
              <FormControl>
                <SecretInput
                  {...field}
                  type="text"
                  allowTogglingSecretManagerMode={isGlobalConnection}
                />
              </FormControl>
            </FormItem>
          )}
        ></FormField>
        <FormField
          name="request.value.client_secret"
          control={form.control}
          render={({ field }) => (
            <FormItem className="flex flex-col mt-3.5">
              <FormLabel>{'Client Secret'}</FormLabel>
              <FormControl>
                <SecretInput
                  {...field}
                  type="password"
                  allowTogglingSecretManagerMode={isGlobalConnection}
                />
              </FormControl>
            </FormItem>
          )}
        ></FormField>
        <FormField
          name="request.value.username"
          control={form.control}
          render={({ field }) => (
            <FormItem className="flex flex-col mt-3.5">
              <FormLabel>{'Username'}</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  type="text"
                />
              </FormControl>
            </FormItem>
          )}
        ></FormField>
        <FormField
          name="request.value.password"
          control={form.control}
          render={({ field }) => (
            <FormItem className="flex flex-col mt-3.5">
              <FormLabel>{'Password'}</FormLabel>
              <FormControl>
                <SecretInput
                  {...field}
                  type="password"
                  allowTogglingSecretManagerMode={isGlobalConnection}
                />
              </FormControl>
            </FormItem>
          )}
        ></FormField>
      </>
    );
  },
);

UserAuthConnectionSettings.displayName = 'UserAuthConnectionSettings';
export { UserAuthConnectionSettings };
