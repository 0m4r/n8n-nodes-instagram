import { NodeApiError, NodeOperationError } from 'n8n-workflow';
import type { JsonObject } from 'n8n-workflow';

export const toNodeError = (node: ConstructorParameters<typeof NodeApiError>[0], error: unknown) =>
  error instanceof NodeOperationError ? error : new NodeApiError(node, error as JsonObject);
