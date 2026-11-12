import type { IExecuteFunctions, IHttpRequestOptions, ILoadOptionsFunctions } from 'n8n-workflow';
import { describe, expect, it, vi } from 'vitest';
import { Instagram } from './Instagram.node';

const createExecuteContext = (
  parameters: Record<string, unknown>,
  response: Record<string, unknown>,
  apiEndpoint = 'graph.facebook.com',
) => {
  const requests: IHttpRequestOptions[] = [];
  const request = vi.fn(async (_credential: string, options: IHttpRequestOptions) => {
    requests.push(options);
    return response;
  });

  const context = {
    continueOnFail: () => false,
    getCredentials: async () => ({ apiEndpoint }),
    getInputData: () => [{ json: {} }],
    getNode: () => ({ name: 'Instagram' }),
    getNodeParameter: (name: string) => parameters[name],
    helpers: { httpRequestWithAuthentication: request },
    logger: { error: vi.fn(), info: vi.fn(), warn: vi.fn(), debug: vi.fn() },
  } as unknown as IExecuteFunctions;

  return { context, requests };
};

describe('Instagram node request contracts', () => {
  it('maps account list-search results and honors the configured API host', async () => {
    const request = vi.fn(async () => ({
      id: 'account-1',
      name: 'Business',
      username: 'Business',
    }));
    const context = {
      getCredentials: async () => ({ apiEndpoint: 'graph.instagram.com' }),
      helpers: { httpRequestWithAuthentication: request },
      logger: { error: vi.fn(), debug: vi.fn() },
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

  it('sends a private reply to a comment using Instagram Login (graph.instagram.com)', async () => {
    const { context, requests } = createExecuteContext(
      {
        resource: 'comments',
        operation: 'sendPrivateReply',
        graphApiVersion: 'v26.0',
        node: 'account-1',
        commentId: 'comment-1',
        privateReplyText: 'Thanks for commenting!',
      },
      { recipient_id: 'scoped-1', message_id: 'message-1' },
      'graph.instagram.com',
    );

    await expect(new Instagram().execute.call(context)).resolves.toEqual([
      [{ json: { recipient_id: 'scoped-1', message_id: 'message-1' }, pairedItem: { item: 0 } }],
    ]);
    expect(requests).toEqual([
      expect.objectContaining({
        method: 'POST',
        url: 'https://graph.instagram.com/v26.0/account-1/messages',
        body: {
          recipient: { comment_id: 'comment-1' },
          message: { text: 'Thanks for commenting!' },
        },
      }),
    ]);
  });

  it('sends a private reply to a comment using Facebook Login (graph.facebook.com)', async () => {
    const { context, requests } = createExecuteContext(
      {
        resource: 'comments',
        operation: 'sendPrivateReply',
        graphApiVersion: 'v26.0',
        node: 'account-1',
        commentId: 'comment-1',
        privateReplyText: 'Thanks for commenting!',
      },
      { recipient_id: 'scoped-1', message_id: 'message-1' },
      'graph.facebook.com',
    );

    await expect(new Instagram().execute.call(context)).resolves.toEqual([
      [{ json: { recipient_id: 'scoped-1', message_id: 'message-1' }, pairedItem: { item: 0 } }],
    ]);
    expect(requests).toEqual([
      expect.objectContaining({
        method: 'POST',
        url: 'https://graph.facebook.com/v26.0/account-1/messages',
        body: {
          recipient: { comment_id: 'comment-1' },
          message: { text: 'Thanks for commenting!' },
        },
      }),
    ]);
  });

  it('uses the selected Graph version and Instagram fields for Get Me', async () => {
    const { context, requests } = createExecuteContext(
      { resource: 'auth', operation: 'getMe', graphApiVersion: 'v25.0' },
      { id: 'ig-user-1', username: 'creator' },
      'graph.instagram.com',
    );

    await expect(new Instagram().execute.call(context)).resolves.toEqual([
      [{ json: { id: 'ig-user-1', username: 'creator' }, pairedItem: { item: 0 } }],
    ]);
    expect(requests[0]).toMatchObject({
      method: 'GET',
      url: 'https://graph.instagram.com/v25.0/me',
      qs: { fields: 'id,username,account_type,media_count' },
    });
  });

  it('routes IG User profile requests through the resource handler map', async () => {
    const { context, requests } = createExecuteContext(
      {
        resource: 'igUser',
        operation: 'get',
        graphApiVersion: 'v26.0',
        node: 'ig-user-1',
      },
      { id: 'ig-user-1', username: 'creator' },
    );

    await expect(new Instagram().execute.call(context)).resolves.toEqual([
      [{ json: { id: 'ig-user-1', username: 'creator' }, pairedItem: { item: 0 } }],
    ]);
    expect(requests[0]).toMatchObject({
      method: 'GET',
      url: 'https://graph.facebook.com/v26.0/ig-user-1',
      qs: {
        fields:
          'id,username,name,biography,website,media_count,followers_count,follows_count,profile_picture_url',
      },
    });
  });

  it('routes hashtag searches through the hashtag resource handler', async () => {
    const { context, requests } = createExecuteContext(
      {
        resource: 'igHashtag',
        operation: 'search',
        graphApiVersion: 'v26.0',
        node: 'ig-user-1',
        hashtagName: 'travel',
      },
      { data: [{ id: 'hashtag-1' }] },
    );

    await expect(new Instagram().execute.call(context)).resolves.toEqual([
      [{ json: { data: [{ id: 'hashtag-1' }] }, pairedItem: { item: 0 } }],
    ]);
    expect(requests[0]).toMatchObject({
      method: 'GET',
      url: 'https://graph.facebook.com/v26.0/ig_hashtag_search',
      qs: { user_id: 'ig-user-1', q: 'travel' },
    });
  });

  it('routes carousel publish requests to carousel-specific validation', async () => {
    const { context, requests } = createExecuteContext(
      { resource: 'carousel', operation: 'publish' },
      {},
    );

    await expect(new Instagram().execute.call(context)).rejects.toThrow(
      'Failed to get node parameter at item index 0',
    );
    expect(requests).toHaveLength(0);
  });

  it('does not route carousel operations other than publish to the carousel handler', async () => {
    const { context, requests } = createExecuteContext(
      { resource: 'carousel', operation: 'unsupported' },
      {},
    );

    await expect(new Instagram().execute.call(context)).rejects.toThrow(/Unsupported operation/);
    expect(requests).toHaveLength(0);
  });

  it('retrieves the Instagram account connected to a Facebook page', async () => {
    const { context, requests } = createExecuteContext(
      {
        resource: 'page',
        operation: 'getInstagramAccount',
        graphApiVersion: 'v26.0',
        pageId: 'page-1',
      },
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
