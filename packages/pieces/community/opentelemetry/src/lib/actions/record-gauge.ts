import { createAction, Property } from '@flow/pieces-framework';
import { httpClient, HttpMethod } from '@flow/pieces-common';
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
    const collectorUrl = auth.props.collectorUrl.replace(/\/+$/, '');
    const payload = buildGaugePayload({
      serviceName: auth.props.serviceName,
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
