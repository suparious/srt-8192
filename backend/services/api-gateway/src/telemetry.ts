import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { Resource } from '@opentelemetry/resources';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';

export async function setupTelemetry() {
  const sdk = new NodeSDK({
    resource: new Resource({
      [SemanticResourceAttributes.SERVICE_NAME]: 'api-gateway',
      [SemanticResourceAttributes.SERVICE_VERSION]: '1.0.0',
    }),
    instrumentations: [getNodeAutoInstrumentations()],
  });

  // Start OpenTelemetry
  sdk.start();

  // Graceful shutdown
  process.on('SIGTERM', () => {
    sdk.shutdown()
      .then(() => console.log('Telemetry stopped'))
      .catch((error) => console.error('Error shutting down telemetry', error))
      .finally(() => process.exit(0));
  });
}