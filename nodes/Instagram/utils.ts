import { NodeApiError, NodeOperationError } from 'n8n-workflow';
import type { JsonObject } from 'n8n-workflow';

type ApiErrorResponse = {
  status?: number | string;
  body?: unknown;
  data?: unknown;
};
type ErrorWithApiResponse = {
  httpCode?: number | string;
  statusCode?: number | string;
  response?: ApiErrorResponse;
};

export const toNodeError = (
  node: ConstructorParameters<typeof NodeApiError>[0],
  error: unknown,
) => {
  if (error instanceof NodeApiError || error instanceof NodeOperationError) return error;

  const apiError = error as ErrorWithApiResponse;
  const response = apiError?.response;
  const responseBody = response?.body ?? response?.data;
  if (responseBody && typeof responseBody === 'object' && !Array.isArray(responseBody)) {
    const statusCode = apiError.statusCode ?? response?.status;
    const httpCode = apiError.httpCode ?? statusCode;
    return new NodeApiError(node, {
      ...(responseBody as JsonObject),
      ...(statusCode !== undefined && { statusCode }),
      ...(httpCode !== undefined && { httpCode: String(httpCode) }),
      response: response as JsonObject,
    });
  }

  return new NodeApiError(node, error as JsonObject);
};
