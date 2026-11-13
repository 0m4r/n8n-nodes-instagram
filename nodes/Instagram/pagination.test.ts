import type { IExecuteFunctions, IHttpRequestOptions } from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';
import { describe, expect, it, vi } from 'vitest';
import { fetchGraphApiPages } from './pagination';

const createContext = (responses: unknown[]) => {
  const requests: IHttpRequestOptions[] = [];
  const request = vi.fn(async (_credential: string, options: IHttpRequestOptions) => {
    requests.push(options);
    return responses.shift();
  });
  const context = {
    getNode: () => ({ name: 'Instagram' }),
    helpers: { httpRequestWithAuthentication: request },
    logger: { debug: vi.fn(), error: vi.fn() },
  } as unknown as IExecuteFunctions;

  return { context, requests };
};

const options = {
  baseUrl: 'https://graph.facebook.com/v26.0/user-1/media',
  fields: 'id,caption',
  itemIndex: 2,
  operation: 'getMedia',
  pageSize: 2,
  returnAll: false,
  limit: 3,
  source: 'operations/test.ts:getMedia',
  responseLabel: 'IG User media API',
};

describe('fetchGraphApiPages', () => {
  it('follows cursors and trims the last page to the requested limit', async () => {
    const { context, requests } = createContext([
      { data: [{ id: '1' }, { id: '2' }], paging: { cursors: { after: 'cursor-1' } } },
      { data: [{ id: '3' }, { id: '4' }] },
    ]);

    await expect(fetchGraphApiPages(context, options)).resolves.toEqual([
      { id: '1' },
      { id: '2' },
      { id: '3' },
    ]);
    expect(requests).toHaveLength(2);
    expect(requests[0]).toMatchObject({
      url: options.baseUrl,
      qs: { fields: 'id,caption', limit: 2 },
    });
    expect(requests[1]).toMatchObject({
      qs: { fields: 'id,caption', limit: 1, after: 'cursor-1' },
    });
  });

  it('includes operation-specific query parameters on each page', async () => {
    const { context, requests } = createContext([
      { data: [{ id: '1' }], paging: { cursors: { after: 'cursor-1' } } },
      { data: [{ id: '2' }] },
    ]);

    await fetchGraphApiPages(context, {
      ...options,
      query: { user_id: 'account-1' },
      returnAll: true,
      limit: 1,
    });

    expect(requests).toHaveLength(2);
    expect(requests[0].qs).toMatchObject({ user_id: 'account-1' });
    expect(requests[1].qs).toMatchObject({ user_id: 'account-1', after: 'cursor-1' });
  });

  it('throws a node operation error when a page has invalid data', async () => {
    const { context } = createContext([{ data: { id: 'not-an-array' } }]);

    await expect(fetchGraphApiPages(context, options)).rejects.toBeInstanceOf(NodeOperationError);
  });
});
