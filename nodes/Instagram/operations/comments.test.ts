import { describe, expect, it } from 'vitest';
import { handleComments } from './comments';
import { createOperationContext, invokeHandler } from './testUtils';

describe('handleComments', () => {
  it('handles comment list requests', async () => {
    const { context, items, requests, returnItems } = createOperationContext(
      { graphApiVersion: 'v26.0', node: 'account-1', mediaId: 'media-1' },
      { data: [{ id: 'comment-1' }] },
    );

    await invokeHandler(handleComments, context, 'comments', 'list', items, returnItems);

    expect(requests[0].url).toBe('https://graph.facebook.com/v26.0/media-1/comments');
    expect(returnItems[0].json).toEqual({ data: [{ id: 'comment-1' }] });
  });
});
