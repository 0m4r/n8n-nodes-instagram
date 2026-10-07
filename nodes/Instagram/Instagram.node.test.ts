import type { IExecuteFunctions, IHttpRequestOptions, ILoadOptionsFunctions } from 'n8n-workflow';
import { describe, expect, it, vi } from 'vitest';
import { Instagram } from './Instagram.node';

const createExecuteContext = (
  parameters: Record<string, unknown>,
  response: Record<string, unknown>,
) => {
  const requests: IHttpRequestOptions[] = [];
  const request = vi.fn(async (_credential: string, options: IHttpRequestOptions) => {
    requests.push(options);
    return response;
  });

  const context = {
    continueOnFail: () => false,
    getCredentials: async () => ({ apiEndpoint: 'graph.facebook.com' }),
    getInputData: () => [{ json: {} }],
    getNode: () => ({ name: 'Instagram' }),
    getNodeParameter: (name: string) => parameters[name],
    helpers: { httpRequestWithAuthentication: request },
    logger: { error: vi.fn(), info: vi.fn(), warn: vi.fn() },
  } as unknown as IExecuteFunctions;

  return { context, requests };
};

describe('Instagram node request contracts', () => {
  it('maps account list-search results and honors the configured API host', async () => {
    const request = vi.fn(async () => ({ id: 'account-1', name: 'Business', username: 'Business' }));
    const context = {
      getCredentials: async () => ({ apiEndpoint: 'graph.instagram.com' }),
      helpers: { httpRequestWithAuthentication: request },
    } as unknown as ILoadOptionsFunctions;

    await expect(
      new Instagram().methods.listSearch.searchInstagramAccounts.call(context),
    ).resolves.toEqual({ results: [{ name: 'Business | @Business', value: 'account-1' }] });
    expect(request).toHaveBeenCalledWith(
      'instagramApi',
      expect.objectContaining({ url: 'https://graph.instagram.com/v26.0/me' }),
    );
  });

  it('returns an empty account list when list search cannot authenticate', async () => {
    const context = {
      getCredentials: async () => {
        throw new Error('Unavailable');
      },
      helpers: { httpRequestWithAuthentication: vi.fn() },
    } as unknown as ILoadOptionsFunctions;

    await expect(
      new Instagram().methods.listSearch.searchInstagramAccounts.call(context),
    ).resolves.toEqual({ results: [] });
  });

  it('sends an authenticated Instagram message with a paired response', async () => {
    const { context, requests } = createExecuteContext(
      {
        resource: 'messaging',
        operation: 'sendMessage',
        graphApiVersion: 'v26.0',
        node: 'account-1',
        recipientId: 'recipient-1',
        messageText: 'Hello from n8n',
      },
      { message_id: 'message-1' },
    );

    await expect(new Instagram().execute.call(context)).resolves.toEqual([
      [{ json: { message_id: 'message-1' }, pairedItem: { item: 0 } }],
    ]);
    expect(requests).toEqual([
      expect.objectContaining({
        method: 'POST',
        url: 'https://graph.facebook.com/v26.0/account-1/messages',
        body: { recipient: { id: 'recipient-1' }, message: { text: 'Hello from n8n' } },
      }),
    ]);
  });

  it('retrieves the Instagram account connected to a Facebook page', async () => {
    const { context, requests } = createExecuteContext(
      { resource: 'page', operation: 'getInstagramAccount', graphApiVersion: 'v26.0', pageId: 'page-1' },
      { instagram_business_account: { id: 'ig-account-1' } },
    );

    await expect(new Instagram().execute.call(context)).resolves.toEqual([
      [{ json: { instagram_business_account: { id: 'ig-account-1' } }, pairedItem: { item: 0 } }],
    ]);
    expect(requests[0]).toMatchObject({
      method: 'GET',
      url: 'https://graph.facebook.com/v26.0/page-1',
      qs: { fields: 'instagram_business_account' },
    });
  });
});
