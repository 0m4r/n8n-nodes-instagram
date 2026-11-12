import type { IExecuteFunctions, IHttpRequestOptions } from 'n8n-workflow';
import { describe, expect, it, vi } from 'vitest';
import { waitForContainerReady } from './containerPolling';

const createContext = (response: Record<string, unknown>) => {
  const requests: IHttpRequestOptions[] = [];
  const request = vi.fn(async (_credential: string, options: IHttpRequestOptions) => {
    requests.push(options);
    return response;
  });
  const context = {
    getNode: () => ({ name: 'Instagram' }),
    helpers: { httpRequestWithAuthentication: request },
    logger: { error: vi.fn(), info: vi.fn(), warn: vi.fn(), debug: vi.fn() },
  } as unknown as IExecuteFunctions;
  return { context, requests };
};

describe('waitForContainerReady', () => {
  it('returns the authoritative finished status and polls the versioned container URL', async () => {
    const { context, requests } = createContext({ status_code: 'FINISHED' });

    await expect(
      waitForContainerReady(context, {
        creationId: 'container-1',
        hostUrl: 'graph.facebook.com',
        graphApiVersion: 'v26.0',
        itemIndex: 0,
      }),
    ).resolves.toMatchObject({
      containerId: 'container-1',
      finalStatusCode: 'FINISHED',
      pollCount: 1,
    });
    expect(requests[0]).toMatchObject({
      method: 'GET',
      url: 'https://graph.facebook.com/v26.0/container-1',
      qs: { fields: 'status_code,status' },
    });
  });

  it('rejects an empty creation ID before making a request', async () => {
    const { context, requests } = createContext({ status_code: 'FINISHED' });

    await expect(
      waitForContainerReady(context, {
        creationId: '',
        hostUrl: 'graph.facebook.com',
        graphApiVersion: 'v26.0',
        itemIndex: 0,
      }),
    ).rejects.toThrow('Invalid creation ID');
    expect(requests).toHaveLength(0);
  });
});
