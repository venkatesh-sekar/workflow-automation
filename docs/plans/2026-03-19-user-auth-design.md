# USER_AUTH: New First-Class Authentication Type

**Date:** 2026-03-19
**Status:** Approved

## Overview

Add a new `USER_AUTH` authentication type to Activepieces that allows users to authenticate with client ID, client secret, username, and password. The platform exchanges these credentials for a Bearer token via a hardcoded token URL (OAuth2 Resource Owner Password Credentials grant), caches the token, and re-authenticates automatically when it expires.

## User Flow

1. Piece requires `USER_AUTH` -> connection dialog shows 4 fields: Client ID, Client Secret, Username, Password
2. On save, backend POSTs to the hardcoded token URL
3. Token + TTL are stored encrypted alongside the credentials
4. On each piece execution, if token is expired, re-authenticate with same credentials
5. Piece receives `context.auth.access_token` - always a valid Bearer token

## Token Exchange Protocol

### Request (on create + every refresh)

```
POST <HARDCODED_TOKEN_URL>
Authorization: Basic base64(client_id:client_secret)
Content-Type: application/x-www-form-urlencoded

grant_type=password&username=<username>&password=<password>&scope=<HARDCODED_SCOPE>
```

### Response

```json
{
  "access_token": "eyJhbG...",
  "expires_in": 3600
}
```

### Constants

- `TOKEN_URL`: Hardcoded (placeholder for now, will be updated later)
- `SCOPE`: Hardcoded (placeholder for now, will be updated later)
- No refresh token - re-authenticate with credentials on expiry

## Storage Schema

```typescript
interface UserAuthConnectionValue {
  type: 'USER_AUTH'
  client_id: string
  client_secret: string
  username: string
  password: string
  access_token: string
  expires_in: number
  claimed_at: number  // unix timestamp (seconds) when token was obtained
}
```

Credentials are stored alongside the token so re-authentication is possible without user intervention.

## Expiry Logic

Reuses existing OAuth2 pattern:

```
isExpired = (nowInSeconds + 900) >= (claimed_at + expires_in)
```

15-minute buffer before actual expiry, same as OAuth2.

## Refresh Strategy

- No refresh token. On expiry, call the token URL again with the stored credentials.
- Uses distributed lock (`{projectId}_{externalId}`) to prevent concurrent re-authentication (same pattern as OAuth2).
- If re-authentication fails, connection status is set to `ERROR`.

## Validation on Create

Token URL is called immediately when a connection is created. If credentials are invalid, the connection is not saved and the user sees the error message from the API response.

## Piece Developer API

```typescript
// Auth definition
export const myAuth = PieceAuth.UserAuth({
  displayName: 'My API Credentials',
  description: 'Enter your credentials',
  required: true,
  validate: async ({ auth }) => {
    // Optional extra validation beyond token exchange
  }
})

// Piece definition
export const myPiece = createPiece({
  name: 'my-piece',
  auth: myAuth,
  actions: [...],
  triggers: [...]
})

// In action handler
async run(context) {
  const token = context.auth.access_token; // always fresh
  await httpClient.sendRequest({
    url: 'https://api.example.com/data',
    headers: { Authorization: `Bearer ${token}` }
  });
}
```

## UI Form

4 fields, all required:

| Field | Type | Display Name |
|-------|------|-------------|
| client_id | text | Client ID |
| client_secret | secret | Client Secret |
| username | text | Username |
| password | secret | Password |

No scope field (hardcoded). No token URL field (hardcoded).

## Files to Modify

### Shared types (enums + schemas)
- `packages/shared/src/lib/automation/app-connection/app-connection.ts` - Add `USER_AUTH` to `AppConnectionType` enum, add `UserAuthConnectionValue` type
- `packages/shared/src/lib/automation/app-connection/dto/upsert-app-connection-request.ts` - Add `UpsertUserAuthRequest` schema

### Piece framework
- `packages/pieces/framework/src/lib/property/input/property-type.ts` - Add `USER_AUTH` to `PropertyType`
- `packages/pieces/framework/src/lib/property/authentication/` - New `user-auth-prop.ts`
- `packages/pieces/framework/src/lib/property/authentication/index.ts` - Export it
- `packages/pieces/framework/src/lib/piece-metadata.ts` - Add to auth type union

### Backend (token exchange + refresh)
- New: `packages/server/api/src/app/app-connection/app-connection-service/user-auth/user-auth-service.ts` - Token exchange + re-auth logic
- `packages/server/api/src/app/app-connection/app-connection-service/app-connection.handler.ts` - Add USER_AUTH case to refresh handler

### Frontend (UI form)
- New: `packages/web/src/app/connections/user-auth-connection-settings.tsx` - 4-field form component
- `packages/web/src/app/connections/create-edit-connection-dialog.tsx` - Add USER_AUTH case to switch
- `packages/web/src/features/pieces/utils/form-utils.tsx` - Add schema for USER_AUTH
- `packages/web/src/features/connections/utils/utils.ts` - Add default values

## Design Decisions

1. **New first-class type vs extending OAuth2** - Chose new type for UX clarity. Users see "username + password" not "OAuth2 password grant."
2. **No refresh token** - Re-authenticate with credentials on expiry. Simpler, and the token URL supports it.
3. **Hardcoded token URL + scope** - Single platform-wide endpoint, not per-piece or per-connection.
4. **Store credentials with token** - Required for re-authentication since there's no refresh token.
5. **Form-encoded body** - Matches OAuth2 ROPC spec, which is what the token endpoint expects.
6. **15-minute expiry buffer** - Reuses proven OAuth2 pattern to avoid mid-request token expiration.
