# USER_AUTH Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a new `USER_AUTH` first-class authentication type that exchanges username/password + client credentials for a Bearer token, caches it, and auto-refreshes on expiry.

**Architecture:** Follows the exact same pattern as existing auth types (BasicAuth, SecretText, OAuth2). Adds `USER_AUTH` to both `PropertyType` and `AppConnectionType` enums, creates a new framework property, backend token exchange service, and frontend form component. Token refresh reuses the distributed lock + expiry check pattern from OAuth2.

**Tech Stack:** TypeScript, Zod (validation), React (UI), Fastify (backend), Axios (HTTP), TypeORM (DB)

---

### Task 1: Add USER_AUTH to shared enums and types

**Files:**
- Modify: `/primary01/git/activepieces/packages/shared/src/lib/automation/app-connection/app-connection.ts`

**Step 1: Add USER_AUTH to AppConnectionType enum**

In `app-connection.ts`, add `USER_AUTH` to the `AppConnectionType` enum after `CUSTOM_AUTH`:

```typescript
export enum AppConnectionType {
    OAUTH2 = 'OAUTH2',
    PLATFORM_OAUTH2 = 'PLATFORM_OAUTH2',
    CLOUD_OAUTH2 = 'CLOUD_OAUTH2',
    SECRET_TEXT = 'SECRET_TEXT',
    BASIC_AUTH = 'BASIC_AUTH',
    CUSTOM_AUTH = 'CUSTOM_AUTH',
    USER_AUTH = 'USER_AUTH',
    NO_AUTH = 'NO_AUTH',
}
```

**Step 2: Add UserAuthConnectionValue type**

After the `CustomAuthConnectionValue` type (line 61), add:

```typescript
export type UserAuthConnectionValue = {
    type: AppConnectionType.USER_AUTH
    client_id: string
    client_secret: string
    username: string
    password: string
    access_token: string
    expires_in: number
    claimed_at: number
}
```

**Step 3: Add USER_AUTH to AppConnectionValue conditional type**

Update the `AppConnectionValue` type to include `USER_AUTH`. After the `CUSTOM_AUTH` line (line 88), add:

```typescript
export type AppConnectionValue<T extends AppConnectionType = AppConnectionType, PropsType extends Record<string, unknown> = Record<string, unknown>> =
    T extends AppConnectionType.SECRET_TEXT ? SecretTextConnectionValue :
        T extends AppConnectionType.BASIC_AUTH ? BasicAuthConnectionValue :
            T extends AppConnectionType.CLOUD_OAUTH2 ? CloudOAuth2ConnectionValue :
                T extends AppConnectionType.PLATFORM_OAUTH2 ? PlatformOAuth2ConnectionValue :
                    T extends AppConnectionType.OAUTH2 ? OAuth2ConnectionValueWithApp :
                        T extends AppConnectionType.CUSTOM_AUTH ? CustomAuthConnectionValue<PropsType> :
                            T extends AppConnectionType.USER_AUTH ? UserAuthConnectionValue :
                                T extends AppConnectionType.NO_AUTH ? NoAuthConnectionValue :
                                    never
```

**Step 4: Add UserAuthConnection type alias**

After the existing connection type aliases (around line 115), add:

```typescript
export type UserAuthConnection = AppConnection<AppConnectionType.USER_AUTH>
```

**Step 5: Commit**

```bash
git add packages/shared/src/lib/automation/app-connection/app-connection.ts
git commit -m "feat(shared): add USER_AUTH to AppConnectionType enum and value types"
```

---

### Task 2: Add USER_AUTH upsert request schema

**Files:**
- Modify: `/primary01/git/activepieces/packages/shared/src/lib/automation/app-connection/dto/upsert-app-connection-request.ts`

**Step 1: Add UpsertUserAuthRequest schema**

After `UpsertBasicAuthRequest` (line 102), add:

```typescript
export const UpsertUserAuthRequest = z.object({
    ...commonAuthProps,
    type: z.literal(AppConnectionType.USER_AUTH),
    value: z.object({
        type: z.literal(AppConnectionType.USER_AUTH),
        client_id: z.string().min(1),
        client_secret: z.string().min(1),
        username: z.string().min(1),
        password: z.string().min(1),
    }),
}).describe('User Auth')
```

**Step 2: Add to UpsertAppConnectionRequestBody union**

Add `UpsertUserAuthRequest` to the union (line 104-112):

```typescript
export const UpsertAppConnectionRequestBody = z.union([
    UpsertSecretTextRequest,
    UpsertOAuth2Request,
    UpsertCloudOAuth2Request,
    UpsertPlatformOAuth2Request,
    UpsertBasicAuthRequest,
    UpsertCustomAuthRequest,
    UpsertUserAuthRequest,
    UpsertNoAuthRequest,
])
```

**Step 3: Export the type**

After the existing type exports (around line 120), add:

```typescript
export type UpsertUserAuthRequest = z.infer<typeof UpsertUserAuthRequest>
```

**Step 4: Add to UpsertGlobalConnectionRequestBody union**

Add user auth to global connections union (around line 145-154):

```typescript
export const UpsertGlobalConnectionRequestBody =
    z.union([
        UpsertSecretTextRequest.omit({ projectId: true, externalId: true }).merge(GlobalConnectionExtras),
        UpsertOAuth2Request.omit({ projectId: true, externalId: true }).merge(GlobalConnectionExtras),
        UpsertCloudOAuth2Request.omit({ projectId: true, externalId: true }).merge(GlobalConnectionExtras),
        UpsertPlatformOAuth2Request.omit({ projectId: true, externalId: true }).merge(GlobalConnectionExtras),
        UpsertBasicAuthRequest.omit({ projectId: true, externalId: true }).merge(GlobalConnectionExtras),
        UpsertCustomAuthRequest.omit({ projectId: true, externalId: true }).merge(GlobalConnectionExtras),
        UpsertUserAuthRequest.omit({ projectId: true, externalId: true }).merge(GlobalConnectionExtras),
        UpsertNoAuthRequest.omit({ projectId: true, externalId: true }).merge(GlobalConnectionExtras),
    ])
```

**Step 5: Commit**

```bash
git add packages/shared/src/lib/automation/app-connection/dto/upsert-app-connection-request.ts
git commit -m "feat(shared): add UpsertUserAuthRequest schema and add to unions"
```

---

### Task 3: Add USER_AUTH to piece framework PropertyType and property definition

**Files:**
- Modify: `/primary01/git/activepieces/packages/pieces/framework/src/lib/property/input/property-type.ts`
- Create: `/primary01/git/activepieces/packages/pieces/framework/src/lib/property/authentication/user-auth-prop.ts`
- Modify: `/primary01/git/activepieces/packages/pieces/framework/src/lib/property/authentication/index.ts`

**Step 1: Add USER_AUTH to PropertyType enum**

In `property-type.ts`, add after `CUSTOM_AUTH` (line 18):

```typescript
export enum PropertyType {
    SHORT_TEXT = 'SHORT_TEXT',
    LONG_TEXT = 'LONG_TEXT',
    MARKDOWN = 'MARKDOWN',
    DROPDOWN = 'DROPDOWN',
    STATIC_DROPDOWN = 'STATIC_DROPDOWN',
    NUMBER = 'NUMBER',
    CHECKBOX = 'CHECKBOX',
    OAUTH2 = 'OAUTH2',
    SECRET_TEXT = 'SECRET_TEXT',
    ARRAY = 'ARRAY',
    OBJECT = 'OBJECT',
    BASIC_AUTH = 'BASIC_AUTH',
    JSON = 'JSON',
    MULTI_SELECT_DROPDOWN = 'MULTI_SELECT_DROPDOWN',
    STATIC_MULTI_SELECT_DROPDOWN = 'STATIC_MULTI_SELECT_DROPDOWN',
    DYNAMIC = 'DYNAMIC',
    CUSTOM_AUTH = 'CUSTOM_AUTH',
    USER_AUTH = 'USER_AUTH',
    DATE_TIME = 'DATE_TIME',
    FILE = 'FILE',
    CUSTOM = 'CUSTOM',
    COLOR = 'COLOR',
}
```

**Step 2: Create user-auth-prop.ts**

Create `/primary01/git/activepieces/packages/pieces/framework/src/lib/property/authentication/user-auth-prop.ts`:

```typescript
import { z } from 'zod';
import { TPropertyValue } from '../input/common';
import { PropertyType } from '../input/property-type';
import { BasePieceAuthSchema } from './common';

export const UserAuthPropertyValue = z.object({
    client_id: z.string(),
    client_secret: z.string(),
    username: z.string(),
    password: z.string(),
    access_token: z.string(),
    expires_in: z.number(),
    claimed_at: z.number(),
})

export type UserAuthPropertyValue = z.infer<typeof UserAuthPropertyValue>

export const UserAuthProperty = z.object({
    ...BasePieceAuthSchema.shape,
    ...TPropertyValue(UserAuthPropertyValue, PropertyType.USER_AUTH).shape,
})

export type UserAuthProperty =
    BasePieceAuthSchema<UserAuthPropertyValue> &
    TPropertyValue<
        UserAuthPropertyValue,
        PropertyType.USER_AUTH,
        true
    >;
```

**Step 3: Update authentication/index.ts**

Update the `index.ts` to include `UserAuthProperty` in the union, the `PieceAuth` factory, and the `authConnectionTypeToPropertyType` map.

Add import:

```typescript
import { UserAuthProperty } from "./user-auth-prop";
```

Update `PieceAuthProperty` zod union (line 10-15):

```typescript
export const PieceAuthProperty = z.union([
  BasicAuthProperty,
  CustomAuthProperty,
  OAuth2Property,
  SecretTextProperty,
  UserAuthProperty,
])
```

Update `PieceAuthProperty` TypeScript type (line 18):

```typescript
export type PieceAuthProperty = BasicAuthProperty | CustomAuthProperty<any> | OAuth2Property<any> | SecretTextProperty<boolean> | UserAuthProperty;
```

Add `UserAuth` factory method to `PieceAuth` object (after `CustomAuth` method, before `None`, around line 69):

```typescript
  UserAuth(
    request: AuthProperties<UserAuthProperty>
  ): UserAuthProperty {
    return {
      ...request,
      valueSchema: undefined,
      type: PropertyType.USER_AUTH,
      displayName: request.displayName || DEFAULT_CONNECTION_DISPLAY_NAME,
      required: true,
    } as unknown as UserAuthProperty;
  },
```

Add to `authConnectionTypeToPropertyType` map (line 91-99):

```typescript
const authConnectionTypeToPropertyType: Record<AppConnectionType, PropertyType | undefined> = {
  [AppConnectionType.OAUTH2]: PropertyType.OAUTH2,
  [AppConnectionType.CLOUD_OAUTH2]: PropertyType.OAUTH2,
  [AppConnectionType.PLATFORM_OAUTH2]: PropertyType.OAUTH2,
  [AppConnectionType.BASIC_AUTH]: PropertyType.BASIC_AUTH,
  [AppConnectionType.CUSTOM_AUTH]: PropertyType.CUSTOM_AUTH,
  [AppConnectionType.SECRET_TEXT]: PropertyType.SECRET_TEXT,
  [AppConnectionType.USER_AUTH]: PropertyType.USER_AUTH,
  [AppConnectionType.NO_AUTH]: undefined,
}
```

**Step 4: Commit**

```bash
git add packages/pieces/framework/src/lib/property/input/property-type.ts \
      packages/pieces/framework/src/lib/property/authentication/user-auth-prop.ts \
      packages/pieces/framework/src/lib/property/authentication/index.ts
git commit -m "feat(framework): add UserAuth property type and PieceAuth.UserAuth factory"
```

---

### Task 4: Add USER_AUTH to framework context type mapping

**Files:**
- Modify: `/primary01/git/activepieces/packages/pieces/framework/src/lib/context/index.ts`

**Step 1: Import UserAuthProperty**

Add to the imports from `'../property'` (line 16-23):

```typescript
import {
  BasicAuthProperty,
  CustomAuthProperty,
  InputPropertyMap,
  OAuth2Property,
  SecretTextProperty,
  UserAuthProperty,
  StaticPropsValue,
} from '../property';
```

Note: `UserAuthProperty` must also be exported from `../property`. Check if `packages/pieces/framework/src/lib/property/index.ts` re-exports from `./authentication`. If it does, this will work automatically. If not, add the re-export.

**Step 2: Add USER_AUTH to AppConnectionValueForSingleAuthProperty**

Update the type (lines 51-56) to include UserAuthProperty:

```typescript
type AppConnectionValueForSingleAuthProperty<T extends PieceAuthProperty | undefined> =
  T extends SecretTextProperty<boolean> ? AppConnectionValue<AppConnectionType.SECRET_TEXT> :
  T extends BasicAuthProperty ? AppConnectionValue<AppConnectionType.BASIC_AUTH> :
  T extends CustomAuthProperty<any> ? AppConnectionValue<AppConnectionType.CUSTOM_AUTH, StaticPropsValue<ExtractCustomAuthProps<T>>> :
  T extends OAuth2Property<any> ? AppConnectionValue<AppConnectionType.OAUTH2, StaticPropsValue<ExtractOAuth2Props<T>>> :
  T extends UserAuthProperty ? AppConnectionValue<AppConnectionType.USER_AUTH> :
  T extends undefined ? undefined : never;
```

**Step 3: Commit**

```bash
git add packages/pieces/framework/src/lib/context/index.ts
git commit -m "feat(framework): map UserAuthProperty to UserAuthConnectionValue in context types"
```

---

### Task 5: Create backend user-auth token exchange service

**Files:**
- Create: `/primary01/git/activepieces/packages/server/api/src/app/app-connection/app-connection-service/user-auth/user-auth-service.ts`
- Create: `/primary01/git/activepieces/packages/server/api/src/app/app-connection/app-connection-service/user-auth/user-auth-constants.ts`

**Step 1: Create constants file**

Create `user-auth-constants.ts`:

```typescript
// TODO: Replace with actual token URL and scope
export const USER_AUTH_TOKEN_URL = 'https://api.example.com/oauth/token'
export const USER_AUTH_SCOPE = 'default'
```

**Step 2: Create user-auth-service.ts**

```typescript
import { UserAuthConnectionValue, AppConnectionType } from '@activepieces/shared'
import axios from 'axios'
import { FastifyBaseLogger } from 'fastify'
import { USER_AUTH_TOKEN_URL, USER_AUTH_SCOPE } from './user-auth-constants'

export const userAuthService = (log: FastifyBaseLogger) => ({
    async claim(params: UserAuthClaimRequest): Promise<UserAuthConnectionValue> {
        const { clientId, clientSecret, username, password } = params

        const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64')

        const response = await axios.post(
            USER_AUTH_TOKEN_URL,
            new URLSearchParams({
                grant_type: 'password',
                username,
                password,
                scope: USER_AUTH_SCOPE,
            }).toString(),
            {
                headers: {
                    'Authorization': `Basic ${basicAuth}`,
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
            },
        )

        const { access_token, expires_in } = response.data
        const secondsSinceEpoch = Math.round(Date.now() / 1000)

        log.info({ username }, 'User auth token claimed successfully')

        return {
            type: AppConnectionType.USER_AUTH,
            client_id: clientId,
            client_secret: clientSecret,
            username,
            password,
            access_token,
            expires_in: expires_in ?? 3600,
            claimed_at: secondsSinceEpoch,
        }
    },

    async refresh(connectionValue: UserAuthConnectionValue): Promise<UserAuthConnectionValue> {
        return this.claim({
            clientId: connectionValue.client_id,
            clientSecret: connectionValue.client_secret,
            username: connectionValue.username,
            password: connectionValue.password,
        })
    },

    isExpired(connectionValue: UserAuthConnectionValue): boolean {
        const secondsSinceEpoch = Math.round(Date.now() / 1000)
        const expiresIn = connectionValue.expires_in ?? 3600
        const refreshThreshold = 15 * 60
        return (
            secondsSinceEpoch + refreshThreshold >= connectionValue.claimed_at + expiresIn
        )
    },
})

type UserAuthClaimRequest = {
    clientId: string
    clientSecret: string
    username: string
    password: string
}
```

**Step 3: Commit**

```bash
git add packages/server/api/src/app/app-connection/app-connection-service/user-auth/
git commit -m "feat(server): add user-auth token exchange service with claim, refresh, and expiry check"
```

---

### Task 6: Integrate USER_AUTH into backend connection handler

**Files:**
- Modify: `/primary01/git/activepieces/packages/server/api/src/app/app-connection/app-connection-service/app-connection.handler.ts`

**Step 1: Import userAuthService**

Add import at the top (after line 14):

```typescript
import { userAuthService } from './user-auth/user-auth-service'
```

**Step 2: Add USER_AUTH case to refresh method**

In the `refresh` method (lines 32-62), add a case before `default`:

```typescript
            case AppConnectionType.USER_AUTH:
                connection.value = await userAuthService(log).refresh(connection.value)
                break
```

**Step 3: Add USER_AUTH case to needRefresh method**

In the `needRefresh` method (lines 128-140), add USER_AUTH to the switch:

```typescript
    needRefresh(connection: AppConnection, log: FastifyBaseLogger): boolean {
        if (connection.status === AppConnectionStatus.ERROR) {
            return false
        }
        switch (connection.value.type) {
            case AppConnectionType.PLATFORM_OAUTH2:
            case AppConnectionType.CLOUD_OAUTH2:
            case AppConnectionType.OAUTH2:
                return oauth2Util(log).isExpired(connection.value)
            case AppConnectionType.USER_AUTH:
                return userAuthService(log).isExpired(connection.value)
            default:
                return false
        }
    },
```

**Step 4: Commit**

```bash
git add packages/server/api/src/app/app-connection/app-connection-service/app-connection.handler.ts
git commit -m "feat(server): add USER_AUTH refresh and expiry check to connection handler"
```

---

### Task 7: Integrate USER_AUTH into backend connection validation

**Files:**
- Modify: `/primary01/git/activepieces/packages/server/api/src/app/app-connection/app-connection-service/app-connection-service.ts`

**Step 1: Import userAuthService**

Add import at the top:

```typescript
import { userAuthService } from './user-auth/user-auth-service'
```

**Step 2: Add USER_AUTH case to validateConnectionValue**

In `validateConnectionValue` function (lines 401-497), add a case for `USER_AUTH` before the `NO_AUTH` case:

```typescript
        case AppConnectionType.USER_AUTH: {
            const claimedValue = await userAuthService(log).claim({
                clientId: value.client_id,
                clientSecret: value.client_secret,
                username: value.username,
                password: value.password,
            })
            await engineValidateAuth({
                pieceName,
                projectId,
                platformId,
                auth: claimedValue,
            }, log)
            return claimedValue
        }
```

**Step 3: Add USER_AUTH to the removeSensitiveData handling in oauth2-util.ts**

Modify `/primary01/git/activepieces/packages/server/api/src/app/app-connection/app-connection-service/oauth2/oauth2-util.ts`, in the `removeRefreshTokenAndClientSecret` method (lines 91-104), add a case for USER_AUTH to redact sensitive fields:

```typescript
    removeRefreshTokenAndClientSecret: (connection: AppConnection): AppConnection => {
        if (connection.value.type === AppConnectionType.OAUTH2 && connection.value.grant_type === OAuth2GrantType.CLIENT_CREDENTIALS) {
            connection.value.client_secret = '(REDACTED)'
        }
        if (connection.value.type === AppConnectionType.OAUTH2
            || connection.value.type === AppConnectionType.CLOUD_OAUTH2
            || connection.value.type === AppConnectionType.PLATFORM_OAUTH2) {
            connection.value = {
                ...connection.value,
                refresh_token: '(REDACTED)',
            }
        }
        if (connection.value.type === AppConnectionType.USER_AUTH) {
            connection.value = {
                ...connection.value,
                client_secret: '(REDACTED)',
                password: '(REDACTED)',
            }
        }
        return connection
    },
```

Also add the `UserAuthConnectionValue` import to `oauth2-util.ts` if needed (it's imported via `AppConnectionType` which is already imported).

**Step 4: Commit**

```bash
git add packages/server/api/src/app/app-connection/app-connection-service/app-connection-service.ts \
      packages/server/api/src/app/app-connection/app-connection-service/oauth2/oauth2-util.ts
git commit -m "feat(server): validate USER_AUTH on connection create and redact sensitive fields"
```

---

### Task 8: Create frontend USER_AUTH connection settings component

**Files:**
- Create: `/primary01/git/activepieces/packages/web/src/app/connections/user-auth-connection-settings.tsx`

**Step 1: Create the component**

Model after `basic-secret-connection-settings.tsx`. Create `user-auth-connection-settings.tsx`:

```typescript
import { UserAuthProperty } from '@activepieces/pieces-framework';
import { UpsertUserAuthRequest } from '@activepieces/shared';
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
```

**Step 2: Commit**

```bash
git add packages/web/src/app/connections/user-auth-connection-settings.tsx
git commit -m "feat(web): add UserAuthConnectionSettings form component"
```

---

### Task 9: Wire USER_AUTH into frontend dialog, schema, and defaults

**Files:**
- Modify: `/primary01/git/activepieces/packages/web/src/app/connections/create-edit-connection-dialog.tsx`
- Modify: `/primary01/git/activepieces/packages/web/src/features/pieces/utils/form-utils.tsx`
- Modify: `/primary01/git/activepieces/packages/web/src/features/connections/utils/utils.ts`

**Step 1: Add USER_AUTH case to ConnectionSettings in create-edit-connection-dialog.tsx**

Import the new component (after line 62):

```typescript
import { UserAuthConnectionSettings } from './user-auth-connection-settings';
```

Add a case to the `ConnectionSettings` switch (lines 268-303), after `BASIC_AUTH` case:

```typescript
    case PropertyType.USER_AUTH:
      return (
        <UserAuthConnectionSettings
          authProperty={selectedAuth.authProperty}
          isGlobalConnection={isGlobalConnection}
        />
      );
```

**Step 2: Add USER_AUTH schema to buildConnectionSchema in form-utils.tsx**

Import `UpsertUserAuthRequest` - add it to the imports from `@activepieces/shared` (around line 27):

```typescript
  UpsertUserAuthRequest,
```

Add a case in `buildConnectionSchema` (lines 194-233), after the `BASIC_AUTH` case:

```typescript
    case PropertyType.USER_AUTH:
      return z.object({
        request: UpsertUserAuthRequest.omit({
          externalId: true,
          displayName: true,
        }).merge(connectionSchema),
      });
```

Also add `PropertyType.USER_AUTH` to the `getDefaultPropertyValue` switch case that handles auth types (lines 141-147):

```typescript
    case PropertyType.OAUTH2:
    case PropertyType.CUSTOM_AUTH:
    case PropertyType.BASIC_AUTH:
    case PropertyType.SECRET_TEXT:
    case PropertyType.USER_AUTH:
    case PropertyType.CUSTOM: {
      return '';
    }
```

**Step 3: Add USER_AUTH default values to createDefaultValues in utils.ts**

Import `UpsertUserAuthRequest` if not already available through `UpsertAppConnectionRequestBody`.

Add a case in `createDefaultValues` (lines 117-209), after the `BASIC_AUTH` case:

```typescript
      case PropertyType.USER_AUTH:
        return {
          ...commmonProps,
          type: AppConnectionType.USER_AUTH,
          value: {
            type: AppConnectionType.USER_AUTH,
            client_id: '',
            client_secret: '',
            username: '',
            password: '',
          },
        };
```

**Step 4: Commit**

```bash
git add packages/web/src/app/connections/create-edit-connection-dialog.tsx \
      packages/web/src/features/pieces/utils/form-utils.tsx \
      packages/web/src/features/connections/utils/utils.ts
git commit -m "feat(web): wire USER_AUTH into connection dialog, form schema, and default values"
```

---

### Task 10: Ensure UserAuthProperty is exported from framework package

**Files:**
- Check/Modify: `/primary01/git/activepieces/packages/pieces/framework/src/lib/property/index.ts`
- Check/Modify: `/primary01/git/activepieces/packages/pieces/framework/src/index.ts`

**Step 1: Verify exports chain**

Check that `UserAuthProperty` is exported from the framework package's public API. The chain should be:
1. `user-auth-prop.ts` exports `UserAuthProperty` and `UserAuthPropertyValue`
2. `authentication/index.ts` re-exports (already done in Task 3)
3. `property/index.ts` should re-export from `./authentication`
4. `framework/src/index.ts` should re-export from `./lib/property`

Read each file and ensure the export chain is complete. If `property/index.ts` already does `export * from './authentication'`, no changes needed. Otherwise add the re-export.

**Step 2: Commit (if changes needed)**

```bash
git add packages/pieces/framework/src/
git commit -m "feat(framework): ensure UserAuthProperty is exported from package public API"
```

---

### Task 11: Build and verify compilation

**Step 1: Build the shared package**

```bash
cd /primary01/git/activepieces && npx nx build shared
```

Expected: BUILD SUCCESS

**Step 2: Build the framework package**

```bash
npx nx build pieces-framework
```

Expected: BUILD SUCCESS

**Step 3: Build the server**

```bash
npx nx build server-api
```

Expected: BUILD SUCCESS

**Step 4: Build the web frontend**

```bash
npx nx build web
```

Expected: BUILD SUCCESS

**Step 5: Fix any TypeScript errors**

If any build fails, read the error output and fix the issue. Common issues:
- Missing exports in barrel files
- Type mismatches in conditional type chains
- Missing switch cases for the new enum value (TypeScript exhaustive checks)

**Step 6: Commit fixes if any**

```bash
git add -A
git commit -m "fix: resolve build errors for USER_AUTH integration"
```

---

### Task 12: Handle exhaustive switch/case checks across codebase

**Step 1: Search for exhaustive switch statements on AppConnectionType or PropertyType**

Search the codebase for `switch` statements that handle `AppConnectionType` or `PropertyType` values. TypeScript may not flag these at build time if they have a `default` case, but they may need explicit handling.

Key files to check:
- Any file that switches on `connection.value.type` or `auth.type`
- `packages/server/engine/src/lib/variables/props-resolver.ts` - connection injection
- `packages/web/src/app/connections/multi-auth-list.tsx` - auth list rendering

For each switch statement found:
- If it has a `default` case that handles "unknown" types appropriately, no change needed
- If it explicitly lists all types, add `AppConnectionType.USER_AUTH` / `PropertyType.USER_AUTH`

**Step 2: Commit if changes needed**

```bash
git add -A
git commit -m "fix: handle USER_AUTH in exhaustive switch statements across codebase"
```

---

## Summary of All Files

### New Files (3)
1. `/primary01/git/activepieces/packages/pieces/framework/src/lib/property/authentication/user-auth-prop.ts`
2. `/primary01/git/activepieces/packages/server/api/src/app/app-connection/app-connection-service/user-auth/user-auth-service.ts`
3. `/primary01/git/activepieces/packages/server/api/src/app/app-connection/app-connection-service/user-auth/user-auth-constants.ts`
4. `/primary01/git/activepieces/packages/web/src/app/connections/user-auth-connection-settings.tsx`

### Modified Files (9)
1. `/primary01/git/activepieces/packages/shared/src/lib/automation/app-connection/app-connection.ts`
2. `/primary01/git/activepieces/packages/shared/src/lib/automation/app-connection/dto/upsert-app-connection-request.ts`
3. `/primary01/git/activepieces/packages/pieces/framework/src/lib/property/input/property-type.ts`
4. `/primary01/git/activepieces/packages/pieces/framework/src/lib/property/authentication/index.ts`
5. `/primary01/git/activepieces/packages/pieces/framework/src/lib/context/index.ts`
6. `/primary01/git/activepieces/packages/server/api/src/app/app-connection/app-connection-service/app-connection.handler.ts`
7. `/primary01/git/activepieces/packages/server/api/src/app/app-connection/app-connection-service/app-connection-service.ts`
8. `/primary01/git/activepieces/packages/server/api/src/app/app-connection/app-connection-service/oauth2/oauth2-util.ts`
9. `/primary01/git/activepieces/packages/web/src/app/connections/create-edit-connection-dialog.tsx`
10. `/primary01/git/activepieces/packages/web/src/features/pieces/utils/form-utils.tsx`
11. `/primary01/git/activepieces/packages/web/src/features/connections/utils/utils.ts`
