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
});
