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
