import { PieceAuth, Property } from '@flow/pieces-framework';
import { httpClient, HttpMethod } from '@flow/pieces-common';

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
