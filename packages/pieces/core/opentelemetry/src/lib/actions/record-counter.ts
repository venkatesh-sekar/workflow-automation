import { createAction, Property } from '@flow/pieces-framework';
import { httpClient, HttpMethod } from '@flow/pieces-common';
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
    const collectorUrl = auth.props.collectorUrl.replace(/\/+$/, '');
    const payload = buildCounterPayload({
      serviceName: auth.props.serviceName,
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
