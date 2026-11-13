import { describe, expect, it } from 'vitest';
import { handleIgHashtag } from './igHashtag';
import { createOperationContext, invokeHandler } from './testUtils';

describe('handleIgHashtag', () => {
  it('handles hashtag search requests', async () => {
    const { context, items, requests, returnItems } = createOperationContext(
      { graphApiVersion: 'v26.0', node: 'account-1', hashtagName: 'travel' },
      { data: [{ id: 'hashtag-1' }] },
    );

    await invokeHandler(handleIgHashtag, context, 'igHashtag', 'search', items, returnItems);

    expect(requests[0]).toMatchObject({
      url: 'https://graph.facebook.com/v26.0/ig_hashtag_search',
      qs: { user_id: 'account-1', q: 'travel' },
    });
    expect(returnItems[0].json).toEqual({ data: [{ id: 'hashtag-1' }] });
  });

  it('fetches hashtag media through the shared paginator with its query and page size', async () => {
    const { context, items, requests, returnItems } = createOperationContext(
      {
        graphApiVersion: 'v26.0',
        node: { value: 'account-1' },
        hashtagId: 'hashtag-1',
        returnAll: false,
        limit: 2,
      },
      { data: [{ id: 'media-1' }, { id: 'media-2' }] },
    );

    await invokeHandler(
      handleIgHashtag,
      context,
      'igHashtag',
      'getRecentMedia',
      items,
      returnItems,
    );

    expect(requests[0]).toMatchObject({
      url: 'https://graph.facebook.com/v26.0/hashtag-1/recent_media',
      qs: { user_id: 'account-1', limit: 2, fields: expect.stringContaining('media_type') },
    });
    expect(returnItems[0].json).toEqual({ data: [{ id: 'media-1' }, { id: 'media-2' }] });
  });
});
