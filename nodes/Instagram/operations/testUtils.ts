import type { IExecuteFunctions, IHttpRequestOptions, INodeExecutionData } from 'n8n-workflow';
import { vi } from 'vitest';
import type { handleAuth } from './auth';

export const createOperationContext = (
  parameters: Record<string, unknown>,
  response: Record<string, unknown> = {},
) => {
  const requests: IHttpRequestOptions[] = [];
  const request = vi.fn(async (_credential: string, options: IHttpRequestOptions) => {
    requests.push(options);
    return response;
  });
  const context = {
    continueOnFail: () => false,
    getCredentials: async () => ({ apiEndpoint: 'graph.facebook.com' }),
    getNode: () => ({ name: 'Instagram' }),
    getNodeParameter: (name: string) => parameters[name],
    helpers: {
      httpRequest: vi.fn(async () => response),
      httpRequestWithAuthentication: request,
    },
    logger: { error: vi.fn(), info: vi.fn(), warn: vi.fn(), debug: vi.fn() },
  } as unknown as IExecuteFunctions;
  const returnItems: INodeExecutionData[] = [];
  const items: INodeExecutionData[] = [{ json: {} }];

  return { context, items, requests, returnItems };
};

export const invokeHandler = (
  handler: typeof handleAuth,
  context: IExecuteFunctions,
  resource: string,
  operation: string,
  items: INodeExecutionData[],
  returnItems: INodeExecutionData[],
) => handler(context, resource, operation, 'graph.facebook.com', 0, items, returnItems);
