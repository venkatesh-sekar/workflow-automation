# Vault Secret Store Design

## Problem

All connection credentials (OAuth tokens, API keys, passwords) are currently stored as AES-256-CBC encrypted JSONB in the `app_connection.value` column in PostgreSQL. We want to store them in HashiCorp Vault instead, using KV v1.

## Design

### Secret Store Interface

```typescript
interface SecretStore {
  save(platformId: string, connectionId: string, value: object): Promise<void>
  get(platformId: string, connectionId: string): Promise<object>
  delete(platformId: string, connectionId: string): Promise<void>
}
```

Single implementation: `VaultSecretStore`.

### Vault Path Formula

```
{mount}/flow/{platformId}/{connectionId}
```

- `mount` comes from `AP_VAULT_MOUNT` env var, defaults to `secret`
- `flow/` prefix is always present as a namespace guard
- Uses platform ID and connection ID (not names) so renames don't break paths

Example: `secret/flow/abc123/conn456`

### Vault API (KV v1)

- **Write:** `PUT /v1/{mount}/flow/{platformId}/{connectionId}`
- **Read:** `GET /v1/{mount}/flow/{platformId}/{connectionId}`
- **Delete:** `DELETE /v1/{mount}/flow/{platformId}/{connectionId}`

All requests include `X-Vault-Token` header.

### Authentication

Userpass auth with lazy token refresh.

**Startup:**
1. Read `AP_VAULT_USERNAME` and `AP_VAULT_PASSWORD` from env
2. `POST /v1/auth/userpass/login/{username}` to get `client_token` and `lease_duration`
3. Store `{ token, expiresAt }` in memory
4. If login fails: log fatal, `process.exit(1)`

**Before each Vault call:**
1. Check if `now >= expiresAt - 2 minutes`
2. If yes: re-login to get fresh token
3. If re-login fails: log fatal, `process.exit(1)`

No polling, no `setInterval`. Token is refreshed only when needed.

### Error Handling

Hard fail on any Vault failure. No retries, no fallbacks.

- Vault unreachable: log fatal, crash
- Auth failure: log fatal, crash
- Read/write failure: log fatal, crash

The orchestrator (k8s/systemd) restarts the process, which re-authenticates on startup.

### Env Vars

| Var | Example | Required | Default |
|-----|---------|----------|---------|
| `AP_VAULT_ADDR` | `https://vault.internal:8200` | Yes | — |
| `AP_VAULT_USERNAME` | `activepieces-svc` | Yes | — |
| `AP_VAULT_PASSWORD` | `s3cret` | Yes | — |
| `AP_VAULT_MOUNT` | `secret` | No | `secret` |

Vault is mandatory. If any required env var is missing, the app does not start (log fatal, exit).

### Startup Validation

1. Check all required env vars are present. If any missing: log fatal with specific message, `process.exit(1)`
2. Validate `AP_VAULT_ADDR` is a valid URL
3. Attempt initial login. If fails: log fatal, `process.exit(1)`
4. Test read to `{mount}/flow/` to verify mount exists and token has access. If fails: log fatal, `process.exit(1)`
5. Vault is ready, continue server startup

Server does not accept requests until Vault is verified.

### File Structure

```
packages/server/api/src/app/secret-store/
  secret-store.ts       # SecretStore interface
  vault-secret-store.ts # VaultSecretStore implementation
  vault-auth.ts         # Login, token caching, lazy refresh
  index.ts              # Exports initialized VaultSecretStore singleton
```

### Integration with AppConnectionService

**Write path (upsert):**
```
value → secretStore.save(platformId, connectionId, value)
```
Replaces `encryptUtils.encryptObject()`.

**Read path (getOne / decryptAndRefreshConnection):**
```
secretStore.get(platformId, connectionId) → plaintext value
```
Replaces `encryptUtils.decryptObject()`.

**Delete path:**
```
secretStore.delete(platformId, connectionId)
```
Called alongside DB row deletion.

**OAuth token refresh:**
After refreshing an OAuth token, the new value is saved via `secretStore.save()`.

### Database Migration

Drop the `value` column from `app_connection` table. It is no longer needed since all secret data lives in Vault.

### What Stays Unchanged

- `app_connection` table schema (minus the `value` column)
- All API responses (value was already stripped before returning to clients)
- Connection metadata (displayName, type, status, projectIds, scope, etc.)
