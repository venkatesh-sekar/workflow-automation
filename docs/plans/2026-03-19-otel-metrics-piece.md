# OpenTelemetry Metrics Piece — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Create an Activepieces piece that sends custom business metrics (counters and gauges) to any OpenTelemetry collector via OTLP/HTTP.

**Architecture:** Two actions (Record Counter, Record Gauge) send JSON payloads to `{collectorUrl}/v1/metrics` using the built-in `httpClient`. A shared payload builder constructs spec-compliant OTLP JSON. Auth stores the collector URL and service name.

**Tech Stack:** TypeScript, `@activepieces/pieces-framework`, `@activepieces/pieces-common` (httpClient), OTLP/HTTP JSON protocol.

**Design doc:** `docs/plans/2026-03-19-otel-metrics-piece-design.md`

---

### Task 1: Scaffold the piece package

**Files:**
- Create: `/primary01/git/activepieces/packages/pieces/community/opentelemetry/package.json`
- Create: `/primary01/git/activepieces/packages/pieces/community/opentelemetry/tsconfig.json`
- Create: `/primary01/git/activepieces/packages/pieces/community/opentelemetry/tsconfig.lib.json`

**Step 1: Create `package.json`**

```json
{
  "name": "@activepieces/piece-opentelemetry",
  "version": "0.0.1",
  "type": "commonjs",
  "main": "./dist/src/index.js",
  "types": "./dist/src/index.d.ts",
  "dependencies": {
    "@activepieces/pieces-common": "workspace:*",
    "@activepieces/pieces-framework": "workspace:*",
    "@activepieces/shared": "workspace:*",
    "tslib": "^2.3.0"
  },
  "scripts": {
    "build": "tsc -p tsconfig.lib.json && cp package.json dist/",
    "lint": "eslint 'src/**/*.ts'"
  }
}
```

**Step 2: Create `tsconfig.json`**

```json
{
  "extends": "../../../../tsconfig.base.json",
  "compilerOptions": {
    "module": "commonjs",
    "forceConsistentCasingInFileNames": true,
    "strict": true,
    "importHelpers": true,
    "noImplicitOverride": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "noPropertyAccessFromIndexSignature": true
  },
  "files": [],
  "include": [],
  "references": [
    {
      "path": "./tsconfig.lib.json"
    }
  ]
}
```

**Step 3: Create `tsconfig.lib.json`**

```json
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "rootDir": ".",
    "baseUrl": ".",
    "paths": {},
    "outDir": "./dist",
    "declaration": true,
    "declarationMap": true,
    "types": ["node"]
  },
  "include": ["src/**/*.ts"]
}
```

**Step 4: Register in `tsconfig.base.json`**

- Modify: `/primary01/git/activepieces/tsconfig.base.json`
- Find the alphabetically correct position in `compilerOptions.paths` (after `piece-online-store` or similar, before `piece-open...` entries) and add:

```json
"@activepieces/piece-opentelemetry": [
  "packages/pieces/community/opentelemetry/src/index.ts"
]
```

**Step 5: Commit**

```bash
git add packages/pieces/community/opentelemetry/package.json \
       packages/pieces/community/opentelemetry/tsconfig.json \
       packages/pieces/community/opentelemetry/tsconfig.lib.json \
       tsconfig.base.json
git commit -m "feat(pieces): scaffold opentelemetry metrics piece package"
```

---

### Task 2: Create the auth configuration

**Files:**
- Create: `/primary01/git/activepieces/packages/pieces/community/opentelemetry/src/lib/auth.ts`

**Step 1: Write auth module**

```typescript
import { PieceAuth } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const opentelemetryAuth = PieceAuth.CustomAuth({
  description: 'Configure your OpenTelemetry collector connection',
  props: {
    collectorUrl: PieceAuth.SecretText({
      displayName: 'Collector URL',
      description:
        'Base URL of your OTEL collector (e.g., http://otel-collector:4318). The piece appends /v1/metrics automatically.',
      required: true,
    }),
    serviceName: Property.ShortText({
      displayName: 'Service Name',
      description:
        'Identifies the source of metrics (sets the service.name resource attribute).',
      required: true,
    }),
  },
  validate: async ({ auth }) => {
    try {
      const url = auth.collectorUrl.replace(/\/+$/, '');
      await httpClient.sendRequest({
        method: HttpMethod.POST,
        url: `${url}/v1/metrics`,
        headers: { 'Content-Type': 'application/json' },
        body: { resourceMetrics: [] },
      });
      return { valid: true };
    } catch (e: unknown) {
      return {
        valid: false,
        error: 'Could not reach the collector. Check the URL and try again.',
      };
    }
  },
  required: true,
});
```

> **Note:** `serviceName` uses `Property.ShortText` (not `PieceAuth.SecretText`) because it's not sensitive — it's just a label. You'll need to import `Property` from `@activepieces/pieces-framework`. Check if `PieceAuth.CustomAuth` props support mixing `Property.*` and `PieceAuth.*` by looking at how other pieces do it. If not, use `PieceAuth.SecretText` for both and note it in a code comment.

**Step 2: Commit**

```bash
git add packages/pieces/community/opentelemetry/src/lib/auth.ts
git commit -m "feat(otel): add custom auth with collector URL and service name"
```

---

### Task 3: Build the OTLP payload builder

**Files:**
- Create: `/primary01/git/activepieces/packages/pieces/community/opentelemetry/src/lib/common/otel-payload.ts`

**Step 1: Write the payload builder**

```typescript
type OtelAttribute = {
  key: string;
  value: { stringValue: string };
};

type OtelDataPoint = {
  asDouble: number;
  timeUnixNano: string;
  attributes: OtelAttribute[];
};

function toOtelAttributes(
  attributes: Record<string, string> | undefined
): OtelAttribute[] {
  if (!attributes) return [];
  return Object.entries(attributes).map(([key, value]) => ({
    key,
    value: { stringValue: String(value) },
  }));
}

function buildResourceMetrics(
  serviceName: string,
  metrics: unknown[]
) {
  return {
    resourceMetrics: [
      {
        resource: {
          attributes: [
            {
              key: 'service.name',
              value: { stringValue: serviceName },
            },
          ],
        },
        scopeMetrics: [
          {
            scope: { name: 'activepieces' },
            metrics,
          },
        ],
      },
    ],
  };
}

function buildDataPoint(
  value: number,
  attributes: Record<string, string> | undefined
): OtelDataPoint {
  return {
    asDouble: value,
    timeUnixNano: String(BigInt(Date.now()) * BigInt(1_000_000)),
    attributes: toOtelAttributes(attributes),
  };
}

export function buildCounterPayload(params: {
  serviceName: string;
  metricName: string;
  description?: string;
  value: number;
  attributes?: Record<string, string>;
}) {
  const metric = {
    name: params.metricName,
    description: params.description ?? '',
    sum: {
      dataPoints: [buildDataPoint(params.value, params.attributes)],
      aggregationTemporality: 1, // DELTA
      isMonotonic: true,
    },
  };
  return buildResourceMetrics(params.serviceName, [metric]);
}

export function buildGaugePayload(params: {
  serviceName: string;
  metricName: string;
  description?: string;
  value: number;
  attributes?: Record<string, string>;
}) {
  const metric = {
    name: params.metricName,
    description: params.description ?? '',
    gauge: {
      dataPoints: [buildDataPoint(params.value, params.attributes)],
    },
  };
  return buildResourceMetrics(params.serviceName, [metric]);
}
```

**Step 2: Commit**

```bash
git add packages/pieces/community/opentelemetry/src/lib/common/otel-payload.ts
git commit -m "feat(otel): add OTLP JSON payload builder for counters and gauges"
```

---

### Task 4: Create the Record Counter action

**Files:**
- Create: `/primary01/git/activepieces/packages/pieces/community/opentelemetry/src/lib/actions/record-counter.ts`

**Step 1: Write the action**

```typescript
import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { opentelemetryAuth } from '../auth';
import { buildCounterPayload } from '../common/otel-payload';

export const recordCounterAction = createAction({
  auth: opentelemetryAuth,
  name: 'record_counter',
  displayName: 'Record Counter',
  description:
    'Send a counter metric to your OpenTelemetry collector (e.g., orders_processed +1)',
  props: {
    metricName: Property.ShortText({
      displayName: 'Metric Name',
      description: 'Name of the counter metric (e.g., orders_processed)',
      required: true,
    }),
    description: Property.ShortText({
      displayName: 'Description',
      description: 'Human-readable description of the metric',
      required: false,
    }),
    incrementBy: Property.Number({
      displayName: 'Increment By',
      description: 'How much to increment the counter',
      required: true,
      defaultValue: 1,
    }),
    attributes: Property.Object({
      displayName: 'Attributes',
      description:
        'Key-value pairs to attach to the metric for filtering/grouping (e.g., region=us-east)',
      required: false,
    }),
  },
  async run({ propsValue, auth }) {
    const collectorUrl = auth.collectorUrl.replace(/\/+$/, '');
    const payload = buildCounterPayload({
      serviceName: auth.serviceName,
      metricName: propsValue.metricName,
      description: propsValue.description,
      value: propsValue.incrementBy,
      attributes: propsValue.attributes as Record<string, string> | undefined,
    });

    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `${collectorUrl}/v1/metrics`,
      headers: { 'Content-Type': 'application/json' },
      body: payload,
    });

    return {
      success: true,
      statusCode: response.status,
      body: response.body,
    };
  },
});
```

**Step 2: Commit**

```bash
git add packages/pieces/community/opentelemetry/src/lib/actions/record-counter.ts
git commit -m "feat(otel): add Record Counter action"
```

---

### Task 5: Create the Record Gauge action

**Files:**
- Create: `/primary01/git/activepieces/packages/pieces/community/opentelemetry/src/lib/actions/record-gauge.ts`

**Step 1: Write the action**

```typescript
import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { opentelemetryAuth } from '../auth';
import { buildGaugePayload } from '../common/otel-payload';

export const recordGaugeAction = createAction({
  auth: opentelemetryAuth,
  name: 'record_gauge',
  displayName: 'Record Gauge',
  description:
    'Send a gauge metric to your OpenTelemetry collector (e.g., queue_depth = 42)',
  props: {
    metricName: Property.ShortText({
      displayName: 'Metric Name',
      description: 'Name of the gauge metric (e.g., queue_depth)',
      required: true,
    }),
    description: Property.ShortText({
      displayName: 'Description',
      description: 'Human-readable description of the metric',
      required: false,
    }),
    value: Property.Number({
      displayName: 'Value',
      description: 'Current value to report',
      required: true,
    }),
    attributes: Property.Object({
      displayName: 'Attributes',
      description:
        'Key-value pairs to attach to the metric for filtering/grouping (e.g., environment=production)',
      required: false,
    }),
  },
  async run({ propsValue, auth }) {
    const collectorUrl = auth.collectorUrl.replace(/\/+$/, '');
    const payload = buildGaugePayload({
      serviceName: auth.serviceName,
      metricName: propsValue.metricName,
      description: propsValue.description,
      value: propsValue.value,
      attributes: propsValue.attributes as Record<string, string> | undefined,
    });

    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `${collectorUrl}/v1/metrics`,
      headers: { 'Content-Type': 'application/json' },
      body: payload,
    });

    return {
      success: true,
      statusCode: response.status,
      body: response.body,
    };
  },
});
```

**Step 2: Commit**

```bash
git add packages/pieces/community/opentelemetry/src/lib/actions/record-gauge.ts
git commit -m "feat(otel): add Record Gauge action"
```

---

### Task 6: Create the piece entry point

**Files:**
- Create: `/primary01/git/activepieces/packages/pieces/community/opentelemetry/src/index.ts`

**Step 1: Write the piece definition**

```typescript
import { createPiece, PieceCategory } from '@activepieces/pieces-framework';
import { opentelemetryAuth } from './lib/auth';
import { recordCounterAction } from './lib/actions/record-counter';
import { recordGaugeAction } from './lib/actions/record-gauge';

export const opentelemetry = createPiece({
  displayName: 'OpenTelemetry',
  auth: opentelemetryAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/opentelemetry.png',
  authors: [],
  categories: [PieceCategory.DEVELOPER_TOOLS],
  actions: [recordCounterAction, recordGaugeAction],
  triggers: [],
});
```

**Step 2: Commit**

```bash
git add packages/pieces/community/opentelemetry/src/index.ts
git commit -m "feat(otel): add piece entry point with counter and gauge actions"
```

---

### Task 7: Build and verify

**Step 1: Install dependencies**

Run from repo root:
```bash
cd /primary01/git/activepieces && pnpm install
```

**Step 2: Build the piece**

```bash
cd /primary01/git/activepieces && pnpm nx build pieces-community-opentelemetry
```

If the nx project name doesn't match, check with:
```bash
pnpm nx show projects | grep otel
```

And use the correct project name. If no nx project is detected, build directly:
```bash
cd /primary01/git/activepieces/packages/pieces/community/opentelemetry && pnpm build
```

**Step 3: Fix any TypeScript errors**

Review build output. Common issues:
- Import paths — make sure `Property` import is from `@activepieces/pieces-framework`
- Auth prop types — if `Property.ShortText` isn't allowed inside `PieceAuth.CustomAuth`, switch `serviceName` to `PieceAuth.SecretText`
- Missing `PieceCategory` export — check if it's exported from `@activepieces/pieces-framework` or `@activepieces/shared`

**Step 4: Commit the fix (if needed)**

```bash
git add -A packages/pieces/community/opentelemetry/
git commit -m "fix(otel): resolve build errors"
```

---

### Task 8: Manual integration test

**Step 1: Start an OTEL collector locally (if not already running)**

Use docker to spin up a collector for testing:
```bash
docker run -d --name otel-test -p 4318:4318 otel/opentelemetry-collector:latest
```

**Step 2: Test via curl to validate the payload format**

```bash
curl -X POST http://localhost:4318/v1/metrics \
  -H "Content-Type: application/json" \
  -d '{
    "resourceMetrics": [{
      "resource": {
        "attributes": [{"key":"service.name","value":{"stringValue":"test"}}]
      },
      "scopeMetrics": [{
        "scope": {"name":"activepieces"},
        "metrics": [{
          "name": "test_counter",
          "description": "test",
          "sum": {
            "dataPoints": [{
              "asDouble": 1,
              "timeUnixNano": "1710000000000000000",
              "attributes": []
            }],
            "aggregationTemporality": 1,
            "isMonotonic": true
          }
        }]
      }]
    }]
  }'
```

Expected: HTTP 200 with empty or acknowledgment response.

**Step 3: Test gauge payload similarly**

```bash
curl -X POST http://localhost:4318/v1/metrics \
  -H "Content-Type: application/json" \
  -d '{
    "resourceMetrics": [{
      "resource": {
        "attributes": [{"key":"service.name","value":{"stringValue":"test"}}]
      },
      "scopeMetrics": [{
        "scope": {"name":"activepieces"},
        "metrics": [{
          "name": "test_gauge",
          "description": "test",
          "gauge": {
            "dataPoints": [{
              "asDouble": 42,
              "timeUnixNano": "1710000000000000000",
              "attributes": []
            }]
          }
        }]
      }]
    }]
  }'
```

Expected: HTTP 200.

**Step 4: Clean up**

```bash
docker stop otel-test && docker rm otel-test
```

**Step 5: Final commit**

```bash
git add -A
git commit -m "feat(pieces): complete opentelemetry metrics piece with counter and gauge actions"
```
