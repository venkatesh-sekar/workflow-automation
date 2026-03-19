# Vault Secret Store Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace AES-256-CBC database encryption with HashiCorp Vault KV v1 as the sole secret store for all app connection credentials.

**Architecture:** New `secret-store/` module with a `SecretStore` interface and `VaultSecretStore` implementation. Vault auth via userpass with lazy token refresh. Hard fail on any Vault error. Integrated into `AppConnectionService` and `AppConnectionHandler`, replacing all `encryptUtils` calls for connection values. DB migration drops the `value` column.

**Tech Stack:** TypeScript, Axios (via `flowAxios`), HashiCorp Vault KV v1 API, Vitest

---

### Task 1: Add Vault System Props

**Files:**
- Modify: `packages/server/common/src/lib/system-props.ts`

**Step 1: Add Vault env var entries to FlowSystemProp enum**

Add these entries to the `FlowSystemProp` enum (after `EVENT_DESTINATION_TIMEOUT_SECONDS`):

```typescript
VAULT_ADDR = 'VAULT_ADDR',
VAULT_USERNAME = 'VAULT_USERNAME',
VAULT_PASSWORD = 'VAULT_PASSWORD',
VAULT_MOUNT = 'VAULT_MOUNT',
```

**Step 2: Verify it compiles**

Run: `cd packages/server/common && npx tsc --noEmit`
Expected: No errors

**Step 3: Commit**

```bash
git add packages/server/common/src/lib/system-props.ts
git commit -m "feat: add Vault system props for secret store config"
```

---

### Task 2: Create SecretStore Interface

**Files:**
- Create: `packages/server/api/src/app/secret-store/secret-store.ts`

**Step 1: Write the interface**

```typescript
export interface SecretStore {
    save(platformId: string, connectionId: string, value: object): Promise<void>
    get(platformId: string, connectionId: string): Promise<object>
    delete(platformId: string, connectionId: string): Promise<void>
}
```

**Step 2: Verify it compiles**

Run: `cd packages/server/api && npx tsc --noEmit`
Expected: No errors

**Step 3: Commit**

```bash
git add packages/server/api/src/app/secret-store/secret-store.ts
git commit -m "feat: add SecretStore interface"
```

---

### Task 3: Create Vault Auth Module

**Files:**
- Create: `packages/server/api/src/app/secret-store/vault-auth.ts`
- Test: `packages/server/api/test/unit/secret-store/vault-auth.test.ts`

**Step 1: Write the failing test**

```typescript
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// We'll mock flowAxios at the module level
vi.mock('@flow/server-common', async () => {
    const actual = await vi.importActual('@flow/server-common')
    return {
        ...actual,
        flowAxios: {
            post: vi.fn(),
        },
    }
})

import { flowAxios } from '@flow/server-common'
import { createVaultAuth } from '../../../src/app/secret-store/vault-auth'

const mockedPost = vi.mocked(flowAxios.post)

describe('vault-auth', () => {
    beforeEach(() => {
        vi.useFakeTimers()
        mockedPost.mockReset()
    })

    afterEach(() => {
        vi.useRealTimers()
    })

    it('should login and return a token', async () => {
        mockedPost.mockResolvedValueOnce({
            data: {
                auth: {
                    client_token: 'test-token-123',
                    lease_duration: 1200, // 20 minutes
                },
            },
        })

        const auth = createVaultAuth({
            addr: 'https://vault.test:8200',
            username: 'testuser',
            password: 'testpass',
        })

        const token = await auth.getToken()
        expect(token).toBe('test-token-123')
        expect(mockedPost).toHaveBeenCalledWith(
            'https://vault.test:8200/v1/auth/userpass/login/testuser',
            { password: 'testpass' },
        )
    })

    it('should reuse cached token when not expired', async () => {
        mockedPost.mockResolvedValueOnce({
            data: {
                auth: {
                    client_token: 'test-token-123',
                    lease_duration: 1200,
                },
            },
        })

        const auth = createVaultAuth({
            addr: 'https://vault.test:8200',
            username: 'testuser',
            password: 'testpass',
        })

        await auth.getToken()
        const token2 = await auth.getToken()
        expect(token2).toBe('test-token-123')
        expect(mockedPost).toHaveBeenCalledTimes(1)
    })

    it('should refresh token when within 2 min of expiry', async () => {
        mockedPost
            .mockResolvedValueOnce({
                data: { auth: { client_token: 'token-1', lease_duration: 1200 } },
            })
            .mockResolvedValueOnce({
                data: { auth: { client_token: 'token-2', lease_duration: 1200 } },
            })

        const auth = createVaultAuth({
            addr: 'https://vault.test:8200',
            username: 'testuser',
            password: 'testpass',
        })

        await auth.getToken()

        // Advance time to 19 minutes (within 2 min buffer of 20 min expiry)
        vi.advanceTimersByTime(19 * 60 * 1000)

        const token = await auth.getToken()
        expect(token).toBe('token-2')
        expect(mockedPost).toHaveBeenCalledTimes(2)
    })

    it('should throw on login failure', async () => {
        mockedPost.mockRejectedValueOnce(new Error('Connection refused'))

        const auth = createVaultAuth({
            addr: 'https://vault.test:8200',
            username: 'testuser',
            password: 'testpass',
        })

        await expect(auth.getToken()).rejects.toThrow('Connection refused')
    })
})
```

**Step 2: Run test to verify it fails**

Run: `cd packages/server/api && npx vitest run test/unit/secret-store/vault-auth.test.ts`
Expected: FAIL — module not found

**Step 3: Write the implementation**

```typescript
import { flowAxios } from '@flow/server-common'

type VaultAuthConfig = {
    addr: string
    username: string
    password: string
}

type CachedToken = {
    token: string
    expiresAt: number
}

const REFRESH_BUFFER_MS = 2 * 60 * 1000 // 2 minutes

export function createVaultAuth(config: VaultAuthConfig) {
    let cached: CachedToken | null = null

    async function login(): Promise<CachedToken> {
        const response = await flowAxios.post(
            `${config.addr}/v1/auth/userpass/login/${config.username}`,
            { password: config.password },
        )
        const { client_token, lease_duration } = response.data.auth
        return {
            token: client_token,
            expiresAt: Date.now() + lease_duration * 1000,
        }
    }

    return {
        async getToken(): Promise<string> {
            if (cached && Date.now() < cached.expiresAt - REFRESH_BUFFER_MS) {
                return cached.token
            }
            cached = await login()
            return cached.token
        },
    }
}
```

**Step 4: Run test to verify it passes**

Run: `cd packages/server/api && npx vitest run test/unit/secret-store/vault-auth.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add packages/server/api/src/app/secret-store/vault-auth.ts packages/server/api/test/unit/secret-store/vault-auth.test.ts
git commit -m "feat: add Vault userpass auth with lazy token refresh"
```

---

### Task 4: Create VaultSecretStore Implementation

**Files:**
- Create: `packages/server/api/src/app/secret-store/vault-secret-store.ts`
- Test: `packages/server/api/test/unit/secret-store/vault-secret-store.test.ts`

**Step 1: Write the failing test**

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@flow/server-common', async () => {
    const actual = await vi.importActual('@flow/server-common')
    return {
        ...actual,
        flowAxios: {
            put: vi.fn(),
            get: vi.fn(),
            delete: vi.fn(),
        },
    }
})

import { flowAxios } from '@flow/server-common'
import { createVaultSecretStore } from '../../../src/app/secret-store/vault-secret-store'

const mockedPut = vi.mocked(flowAxios.put)
const mockedGet = vi.mocked(flowAxios.get)
const mockedDelete = vi.mocked(flowAxios.delete)

describe('VaultSecretStore', () => {
    const mockGetToken = vi.fn().mockResolvedValue('mock-token')
    let store: ReturnType<typeof createVaultSecretStore>

    beforeEach(() => {
        vi.clearAllMocks()
        store = createVaultSecretStore({
            addr: 'https://vault.test:8200',
            mount: 'secret',
            getToken: mockGetToken,
        })
    })

    it('should save a secret to vault', async () => {
        mockedPut.mockResolvedValueOnce({ data: {} })

        await store.save('platform-1', 'conn-1', { secret_text: 'my-secret' })

        expect(mockedPut).toHaveBeenCalledWith(
            'https://vault.test:8200/v1/secret/flow/platform-1/conn-1',
            { secret_text: 'my-secret' },
            { headers: { 'X-Vault-Token': 'mock-token' } },
        )
    })

    it('should get a secret from vault', async () => {
        mockedGet.mockResolvedValueOnce({
            data: { data: { secret_text: 'my-secret' } },
        })

        const result = await store.get('platform-1', 'conn-1')

        expect(result).toEqual({ secret_text: 'my-secret' })
        expect(mockedGet).toHaveBeenCalledWith(
            'https://vault.test:8200/v1/secret/flow/platform-1/conn-1',
            { headers: { 'X-Vault-Token': 'mock-token' } },
        )
    })

    it('should delete a secret from vault', async () => {
        mockedDelete.mockResolvedValueOnce({ data: {} })

        await store.delete('platform-1', 'conn-1')

        expect(mockedDelete).toHaveBeenCalledWith(
            'https://vault.test:8200/v1/secret/flow/platform-1/conn-1',
            { headers: { 'X-Vault-Token': 'mock-token' } },
        )
    })

    it('should throw on vault read failure', async () => {
        mockedGet.mockRejectedValueOnce(new Error('Vault unavailable'))

        await expect(store.get('platform-1', 'conn-1')).rejects.toThrow('Vault unavailable')
    })

    it('should throw on vault write failure', async () => {
        mockedPut.mockRejectedValueOnce(new Error('Vault unavailable'))

        await expect(store.save('platform-1', 'conn-1', {})).rejects.toThrow('Vault unavailable')
    })
})
```

**Step 2: Run test to verify it fails**

Run: `cd packages/server/api && npx vitest run test/unit/secret-store/vault-secret-store.test.ts`
Expected: FAIL — module not found

**Step 3: Write the implementation**

```typescript
import { flowAxios } from '@flow/server-common'
import { SecretStore } from './secret-store'

type VaultSecretStoreConfig = {
    addr: string
    mount: string
    getToken: () => Promise<string>
}

export function createVaultSecretStore(config: VaultSecretStoreConfig): SecretStore {
    function vaultUrl(platformId: string, connectionId: string): string {
        return `${config.addr}/v1/${config.mount}/flow/${platformId}/${connectionId}`
    }

    async function headers(): Promise<{ 'X-Vault-Token': string }> {
        const token = await config.getToken()
        return { 'X-Vault-Token': token }
    }

    return {
        async save(platformId: string, connectionId: string, value: object): Promise<void> {
            await flowAxios.put(
                vaultUrl(platformId, connectionId),
                value,
                { headers: await headers() },
            )
        },

        async get(platformId: string, connectionId: string): Promise<object> {
            const response = await flowAxios.get(
                vaultUrl(platformId, connectionId),
                { headers: await headers() },
            )
            return response.data.data
        },

        async delete(platformId: string, connectionId: string): Promise<void> {
            await flowAxios.delete(
                vaultUrl(platformId, connectionId),
                { headers: await headers() },
            )
        },
    }
}
```

**Step 4: Run test to verify it passes**

Run: `cd packages/server/api && npx vitest run test/unit/secret-store/vault-secret-store.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add packages/server/api/src/app/secret-store/vault-secret-store.ts packages/server/api/test/unit/secret-store/vault-secret-store.test.ts
git commit -m "feat: add VaultSecretStore implementation using KV v1 API"
```

---

### Task 5: Create Secret Store Initialization & Export

**Files:**
- Create: `packages/server/api/src/app/secret-store/index.ts`

**Step 1: Write the initialization module**

```typescript
import { FlowSystemProp } from '@flow/server-common'
import { system } from '../helper/system/system'
import { SecretStore } from './secret-store'
import { createVaultAuth } from './vault-auth'
import { createVaultSecretStore } from './vault-secret-store'

let secretStoreInstance: SecretStore | null = null

export async function initializeSecretStore(): Promise<void> {
    const log = system.globalLogger()

    const addr = system.getOrThrow(FlowSystemProp.VAULT_ADDR)
    const username = system.getOrThrow(FlowSystemProp.VAULT_USERNAME)
    const password = system.getOrThrow(FlowSystemProp.VAULT_PASSWORD)
    const mount = system.get(FlowSystemProp.VAULT_MOUNT) ?? 'secret'

    const url = new URL(addr)
    if (!url.protocol.startsWith('http')) {
        log.fatal({ addr }, 'FLOW_VAULT_ADDR must be a valid HTTP(S) URL')
        process.exit(1)
    }

    const vaultAuth = createVaultAuth({ addr, username, password })

    // Initial login — validates credentials at startup
    try {
        await vaultAuth.getToken()
    }
    catch (e) {
        log.fatal({ error: e }, 'Failed to authenticate with Vault')
        process.exit(1)
    }

    secretStoreInstance = createVaultSecretStore({
        addr,
        mount,
        getToken: () => vaultAuth.getToken(),
    })

    log.info({ addr, mount }, 'Vault secret store initialized')
}

export function secretStore(): SecretStore {
    if (!secretStoreInstance) {
        throw new Error('Secret store not initialized. Call initializeSecretStore() first.')
    }
    return secretStoreInstance
}

export { SecretStore } from './secret-store'
```

**Step 2: Verify it compiles**

Run: `cd packages/server/api && npx tsc --noEmit`
Expected: No errors

**Step 3: Commit**

```bash
git add packages/server/api/src/app/secret-store/index.ts
git commit -m "feat: add secret store initialization with startup validation"
```

---

### Task 6: Wire Secret Store Into App Bootstrap

**Files:**
- Modify: `packages/server/api/src/app/app.ts`

**Step 1: Add import and initialization call**

At the top of `app.ts`, add the import:

```typescript
import { initializeSecretStore } from './secret-store'
```

In the `setupApp` function, add the initialization call **before** any module registration (before `await systemJobsSchedule(app.log).init()`):

```typescript
await initializeSecretStore()
```

**Step 2: Verify it compiles**

Run: `cd packages/server/api && npx tsc --noEmit`
Expected: No errors

**Step 3: Commit**

```bash
git add packages/server/api/src/app/app.ts
git commit -m "feat: initialize Vault secret store on app startup"
```

---

### Task 7: Integrate Secret Store Into AppConnectionService (Write Path)

**Files:**
- Modify: `packages/server/api/src/app/app-connection/app-connection-service/app-connection-service.ts`

**Step 1: Replace encrypt call in upsert()**

Add import at top of file:

```typescript
import { secretStore } from '../../secret-store'
```

In the `upsert` method, replace these lines (approx lines 75-78):

```typescript
const encryptedConnectionValue = await encryptUtils.encryptObject({
    ...validatedConnectionValue,
    ...value,
})
```

With:

```typescript
const connectionValue = {
    ...validatedConnectionValue,
    ...value,
}
```

Then after `const newId = existingConnection?.id ?? flowId()`, replace the connection object's `value: encryptedConnectionValue` with removal of value from the DB object entirely. The connection object becomes:

```typescript
const connection = {
    displayName,
    ...spreadIfDefined('ownerId', ownerId),
    status: status ?? AppConnectionStatus.ACTIVE,
    externalId,
    pieceName,
    type,
    id: newId,
    scope,
    projectIds,
    platformId,
    ...spreadIfDefined('metadata', metadata),
    ...spreadIfDefined('preSelectForNewProjects', preSelectForNewProjects),
    pieceVersion,
}
```

After the `await appConnectionsRepo().upsert(connection, ['id'])` call, save to Vault:

```typescript
await secretStore().save(platformId, newId, connectionValue)
```

**Step 2: Verify it compiles**

Run: `cd packages/server/api && npx tsc --noEmit`
Expected: May have type errors due to `value` being required in the schema — this is expected. We'll fix the entity in Task 10.

**Step 3: Commit**

```bash
git add packages/server/api/src/app/app-connection/app-connection-service/app-connection-service.ts
git commit -m "feat: save connection secrets to Vault instead of DB in upsert"
```

---

### Task 8: Integrate Secret Store Into AppConnectionHandler (Read Path)

**Files:**
- Modify: `packages/server/api/src/app/app-connection/app-connection-service/app-connection.handler.ts`

**Step 1: Replace decryptConnection()**

Add import at top:

```typescript
import { secretStore } from '../../secret-store'
```

Replace the `decryptConnection` method (lines 118-127):

```typescript
async decryptConnection(
    encryptedConnection: AppConnectionSchema,
): Promise<AppConnection> {
    const value = await secretStore().get(
        encryptedConnection.platformId,
        encryptedConnection.id,
    ) as AppConnectionValue
    const connection: AppConnection = {
        ...encryptedConnection,
        value,
    }
    return connection
},
```

**Step 2: Replace encrypt call in lockAndRefreshConnection()**

In `lockAndRefreshConnection`, replace the DB update after refresh (approx line 98-101):

```typescript
await appConnectionsRepo().update(refreshedAppConnection.id, {
    status: AppConnectionStatus.ACTIVE,
    value: await encryptUtils.encryptObject(refreshedAppConnection.value),
})
```

With:

```typescript
await secretStore().save(
    refreshedAppConnection.platformId,
    refreshedAppConnection.id,
    refreshedAppConnection.value,
)
await appConnectionsRepo().update(refreshedAppConnection.id, {
    status: AppConnectionStatus.ACTIVE,
})
```

**Step 3: Remove unused encryptUtils import**

Remove this line from the imports:

```typescript
import { encryptUtils } from '../../helper/encryption'
```

**Step 4: Verify it compiles**

Run: `cd packages/server/api && npx tsc --noEmit`
Expected: No errors (or type errors from entity — fixed in Task 10)

**Step 5: Commit**

```bash
git add packages/server/api/src/app/app-connection/app-connection-service/app-connection.handler.ts
git commit -m "feat: read/write connection secrets via Vault in handler"
```

---

### Task 9: Integrate Secret Store Into AppConnectionService (Delete Path)

**Files:**
- Modify: `packages/server/api/src/app/app-connection/app-connection-service/app-connection-service.ts`

**Step 1: Add Vault delete to delete()**

In the `delete` method (lines 250-258), add a Vault delete call **before** the DB delete. We need the connection's platformId which we already have from params:

```typescript
async delete(params: DeleteParams): Promise<void> {
    await secretStore().delete(params.platformId, params.id)
    await appConnectionsRepo().delete({
        id: params.id,
        platformId: params.platformId,
        scope: params.scope,
        ...(params.projectId ? { projectIds: ArrayContains([params.projectId]) } : {}),
    })
    log.info({ connectionId: params.id, platformId: params.platformId }, 'App connection deleted')
},
```

**Step 2: Also handle deleteAllProjectConnections()**

The `deleteAllProjectConnections` method (lines 348-353) deletes connections in bulk. We need to fetch IDs first, then delete from Vault:

```typescript
async deleteAllProjectConnections(projectId: string) {
    const connections = await appConnectionsRepo().find({
        where: {
            scope: AppConnectionScope.PROJECT,
            projectIds: ArrayContains([projectId]),
        },
    })
    await Promise.all(
        connections.map((conn) => secretStore().delete(conn.platformId, conn.id)),
    )
    await appConnectionsRepo().delete({
        scope: AppConnectionScope.PROJECT,
        projectIds: ArrayContains([projectId]),
    })
},
```

**Step 3: Remove unused encryptUtils import if not used elsewhere in file**

Check if `encryptUtils` is still used in this file. After Task 7, the only usage was in `upsert()` which we replaced. Remove the import:

```typescript
import { encryptUtils } from '../../helper/encryption'
```

**Step 4: Verify it compiles**

Run: `cd packages/server/api && npx tsc --noEmit`
Expected: No errors

**Step 5: Commit**

```bash
git add packages/server/api/src/app/app-connection/app-connection-service/app-connection-service.ts
git commit -m "feat: delete connection secrets from Vault on connection delete"
```

---

### Task 10: Update Entity Schema and Migration

**Files:**
- Modify: `packages/server/api/src/app/app-connection/app-connection.entity.ts`
- Create: `packages/server/api/src/app/database/migration/postgres/{timestamp}-RemoveAppConnectionValueColumn.ts`

**Step 1: Remove value column from entity**

In `app-connection.entity.ts`, remove the `value` column definition (lines 53-55):

```typescript
value: {
    type: 'jsonb',
},
```

Update the `AppConnectionSchema` type to remove the value field:

```typescript
export type AppConnectionSchema = Omit<AppConnection, 'value'> & {
    owner?: User
}
```

Also remove the `EncryptedObject` import since it's no longer needed:

```typescript
import { EncryptedObject } from '../helper/encryption'
```

**Step 2: Create the migration**

Create file `packages/server/api/src/app/database/migration/postgres/{timestamp}-RemoveAppConnectionValueColumn.ts` (use current timestamp, e.g. `1742428800000`):

```typescript
import { MigrationInterface, QueryRunner } from 'typeorm'

export class RemoveAppConnectionValueColumn1742428800000 implements MigrationInterface {
    name = 'RemoveAppConnectionValueColumn1742428800000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "app_connection" DROP COLUMN IF EXISTS "value"`)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "app_connection" ADD COLUMN "value" jsonb`)
    }
}
```

**Step 3: Register the migration**

Find where migrations are registered (check `database-connection.ts` or `database/index.ts` for migration imports) and add the new migration to the list.

**Step 4: Verify it compiles**

Run: `cd packages/server/api && npx tsc --noEmit`
Expected: No errors

**Step 5: Commit**

```bash
git add packages/server/api/src/app/app-connection/app-connection.entity.ts packages/server/api/src/app/database/migration/postgres/*RemoveAppConnectionValueColumn*
git commit -m "feat: remove value column from app_connection table"
```

---

### Task 11: Add Vault Mount Default to System Config

**Files:**
- Modify: `packages/server/api/src/app/helper/system/system.ts`

**Step 1: Add default value for VAULT_MOUNT**

In the `systemPropDefaultValues` object, add:

```typescript
[FlowSystemProp.VAULT_MOUNT]: 'secret',
```

**Step 2: Verify it compiles**

Run: `cd packages/server/api && npx tsc --noEmit`
Expected: No errors

**Step 3: Commit**

```bash
git add packages/server/api/src/app/helper/system/system.ts
git commit -m "feat: add default vault mount value"
```

---

### Task 12: Update Test Environment for Vault

**Files:**
- Modify: `packages/server/api/.env.tests`
- Create: `packages/server/api/test/helpers/mock-vault.ts`

**Step 1: Check current .env.tests**

Read `.env.tests` to see existing env var patterns.

**Step 2: Create an in-memory mock Vault for tests**

```typescript
import { vi } from 'vitest'

const vaultStore = new Map<string, object>()

export function createMockSecretStore() {
    return {
        save: vi.fn(async (platformId: string, connectionId: string, value: object) => {
            vaultStore.set(`${platformId}/${connectionId}`, value)
        }),
        get: vi.fn(async (platformId: string, connectionId: string) => {
            const value = vaultStore.get(`${platformId}/${connectionId}`)
            if (!value) {
                throw new Error(`Secret not found: ${platformId}/${connectionId}`)
            }
            return value
        }),
        delete: vi.fn(async (platformId: string, connectionId: string) => {
            vaultStore.delete(`${platformId}/${connectionId}`)
        }),
        clear: () => vaultStore.clear(),
    }
}
```

**Step 3: Wire mock into test setup**

In `test/helpers/test-setup.ts` or via vitest setup, mock the `secret-store` module so tests don't need a real Vault. Add to `vitest.setup.ts`:

```typescript
vi.mock('../src/app/secret-store', async () => {
    const { createMockSecretStore } = await import('./helpers/mock-vault')
    const mock = createMockSecretStore()
    return {
        secretStore: () => mock,
        initializeSecretStore: vi.fn(),
    }
})
```

**Step 4: Run existing app-connection tests**

Run: `cd packages/server/api && FLOW_ENVIRONMENT=testing npx vitest run test/integration/ce/app-connection/app-connection.test.ts`
Expected: PASS — existing tests should work with the mock

**Step 5: Commit**

```bash
git add packages/server/api/test/helpers/mock-vault.ts packages/server/api/vitest.setup.ts
git commit -m "feat: add mock Vault for test environment"
```

---

### Task 13: Run Full Test Suite and Fix

**Step 1: Run full CE test suite**

Run: `cd packages/server/api && npm run test-ce`
Expected: PASS

**Step 2: Fix any compilation or runtime errors**

Address any remaining references to `encryptUtils` for connection values, type mismatches from removing the `value` field from `AppConnectionSchema`, or test assertions that expect `value` in DB records.

**Step 3: Run unit tests**

Run: `cd packages/server/api && npm run test-unit`
Expected: PASS

**Step 4: Commit any fixes**

```bash
git add -A
git commit -m "fix: resolve remaining type and test issues after Vault migration"
```
