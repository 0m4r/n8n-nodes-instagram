import { NodeApiError, NodeOperationError } from 'n8n-workflow';
import type { IDataObject, IExecuteFunctions, JsonObject } from 'n8n-workflow';

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

type ErrorWithGraphResponse = {
  message?: string;
  statusCode?: number | string;
  response?: {
    body?: { error?: IDataObject };
    headers?: IDataObject;
    status?: number | string;
  };
};

export const toErrorItem = (error: unknown): IDataObject => {
  if (error instanceof Error) {
    const errorWithResponse = error as Error & ErrorWithGraphResponse;
    if (errorWithResponse.response !== undefined) {
      const graphError = errorWithResponse.response.body?.error ?? {};
      return {
        statusCode: errorWithResponse.statusCode ?? errorWithResponse.response.status,
        ...graphError,
        ...(graphError.message || !error.message ? {} : { message: error.message }),
        headers: errorWithResponse.response.headers,
      };
    }

    return { error: error.message, name: error.name };
  }

  if (error && typeof error === 'object') {
    const errorWithResponse = error as ErrorWithGraphResponse;
    if (errorWithResponse.response !== undefined) {
      const graphError = errorWithResponse.response.body?.error ?? {};
      return {
        statusCode: errorWithResponse.statusCode ?? errorWithResponse.response.status,
        ...graphError,
        ...(graphError.message || !errorWithResponse.message
          ? {}
          : { message: errorWithResponse.message }),
        headers: errorWithResponse.response.headers,
      };
    }
    if (typeof errorWithResponse.message === 'string') {
      return { error: errorWithResponse.message };
    }
    return error as IDataObject;
  }

  return { error: String(error) };
};

export const getRequiredStringParameter = (
  ctx: IExecuteFunctions,
  parameterName: string,
  itemIndex: number,
  label: string,
  requirement: string,
  allowResourceLocator = false,
  failureLabel = label,
): string => {
  try {
    const parameter = ctx.getNodeParameter(parameterName, itemIndex) as unknown;
    if (allowResourceLocator && parameter == null) {
      throw new TypeError(`Cannot read properties of ${parameter} (reading 'value')`);
    }
    const value =
      allowResourceLocator && parameter && typeof parameter === 'object'
        ? (parameter as { value?: unknown }).value
        : parameter;

    if (typeof value !== 'string' || !value) {
      throw new NodeOperationError(
        ctx.getNode(),
        `Invalid or missing ${label} parameter at item index ${itemIndex}. ${requirement}`,
        { itemIndex },
      );
    }

    return value;
  } catch (error) {
    if (error instanceof NodeOperationError) {
      throw toNodeError(ctx.getNode(), error);
    }
    throw new NodeOperationError(
      ctx.getNode(),
      `Failed to get ${failureLabel} parameter at item index ${itemIndex}: ${error instanceof Error ? error.message : String(error)}`,
      { itemIndex },
    );
  }
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
