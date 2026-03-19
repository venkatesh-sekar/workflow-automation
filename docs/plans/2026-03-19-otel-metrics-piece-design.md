# OpenTelemetry Metrics Piece — Design

## Overview

An Activepieces piece that lets users send custom business metrics (counters and gauges) from flow runs to any OpenTelemetry collector via OTLP/HTTP.

## Use Case

Users want to track business metrics like "orders_processed" or "queue_depth" from their automation flows and visualize them in Grafana, Datadog, or any OTEL-compatible backend.

## Piece Structure

```
packages/pieces/community/opentelemetry/
├── src/
│   ├── index.ts                          # createPiece definition
│   └── lib/
│       ├── auth.ts                       # CustomAuth: collector URL + service name
│       ├── common/
│       │   └── otel-payload.ts           # OTLP JSON payload builder
│       └── actions/
│           ├── record-counter.ts         # "Record Counter" action
│           └── record-gauge.ts           # "Record Gauge" action
├── package.json
├── tsconfig.json
└── tsconfig.lib.json
```

## Authentication

Uses `PieceAuth.CustomAuth` with two fields:

- **Collector URL** (SecretText, required) — base URL of the OTEL collector (e.g., `http://otel-collector:4318`). The piece appends `/v1/metrics` when sending.
- **Service Name** (ShortText, required) — sets the `service.name` OTEL resource attribute on every metric.

Validation pings the collector URL on save to confirm reachability.

Users see a connection dropdown to select existing or create new connections (supports multiple collectors like staging vs production).

## Actions

### Record Counter

- **Name:** `record_counter`
- **Display Name:** Record Counter
- **Props:**
  - Metric Name (ShortText, required) — e.g., `orders_processed`
  - Description (ShortText, optional) — human-readable description
  - Increment By (Number, required, default: 1) — how much to add
  - Attributes (Object/key-value builder, optional) — e.g., `region=us-east`
- **Behavior:** Sends OTLP/HTTP POST with a `Sum` data point
  - `isMonotonic: true`
  - `aggregationTemporality: 1` (DELTA — stateless actions report increments, not running totals)
  - Timestamp in nanoseconds

### Record Gauge

- **Name:** `record_gauge`
- **Display Name:** Record Gauge
- **Props:**
  - Metric Name (ShortText, required) — e.g., `queue_depth`
  - Description (ShortText, optional)
  - Value (Number, required) — current point-in-time value
  - Attributes (Object/key-value builder, optional)
- **Behavior:** Sends OTLP/HTTP POST with a `Gauge` data point (no temporality needed)

Both actions return the collector's HTTP response for flow log visibility.

## OTLP Payload Format

The piece constructs OTLP JSON payloads and POSTs them to `{collectorUrl}/v1/metrics` with `Content-Type: application/json`.

### Counter Example

```json
{
  "resourceMetrics": [{
    "resource": {
      "attributes": [
        { "key": "service.name", "value": { "stringValue": "my-service" } }
      ]
    },
    "scopeMetrics": [{
      "scope": { "name": "activepieces" },
      "metrics": [{
        "name": "orders_processed",
        "description": "Total orders processed",
        "sum": {
          "dataPoints": [{
            "asDouble": 1,
            "timeUnixNano": "1710000000000000000",
            "attributes": [
              { "key": "region", "value": { "stringValue": "us-east" } }
            ]
          }],
          "aggregationTemporality": 1,
          "isMonotonic": true
        }
      }]
    }]
  }]
}
```

### Gauge Example

```json
{
  "resourceMetrics": [{
    "resource": {
      "attributes": [
        { "key": "service.name", "value": { "stringValue": "my-service" } }
      ]
    },
    "scopeMetrics": [{
      "scope": { "name": "activepieces" },
      "metrics": [{
        "name": "queue_depth",
        "description": "Current queue depth",
        "gauge": {
          "dataPoints": [{
            "asDouble": 42,
            "timeUnixNano": "1710000000000000000",
            "attributes": [
              { "key": "environment", "value": { "stringValue": "production" } }
            ]
          }]
        }
      }]
    }]
  }]
}
```

## Payload Builder

`otel-payload.ts` exports two functions:

- `buildCounterPayload(serviceName, metricName, description, value, attributes)`
- `buildGaugePayload(serviceName, metricName, description, value, attributes)`

Both convert the `Property.Object` flat map (`{ key: value }`) to OTLP attribute format (`{ key, value: { stringValue } }`).

## Technical Decisions

- **OTLP/HTTP over SDK:** Actions are stateless — the OTEL SDK is designed for long-lived processes. Using raw HTTP avoids the overhead of creating/flushing/tearing down a MeterProvider per action run.
- **DELTA temporality for counters:** Since actions are stateless, we can't track cumulative totals. Each action reports the increment (delta).
- **No auth on collector:** Piece targets internal/sidecar collectors. No auth headers needed.
- **No triggers:** This piece is action-only (send metrics out).

## Dependencies

- `@activepieces/pieces-common` (httpClient)
- `@activepieces/pieces-framework`
- `@activepieces/shared`

No additional npm dependencies needed.
