import { describe, expect, it } from 'vitest';
import { handleIgUser } from './igUser';
import { createOperationContext, invokeHandler } from './testUtils';

describe('handleIgUser', () => {
  it('handles profile requests', async () => {
    const { context, items, requests, returnItems } = createOperationContext(
      { graphApiVersion: 'v26.0', node: 'user-1' },
      { id: 'user-1', username: 'creator' },
    );

    await invokeHandler(handleIgUser, context, 'igUser', 'get', items, returnItems);

    expect(requests[0].url).toBe('https://graph.facebook.com/v26.0/user-1');
    expect(returnItems[0].json).toEqual({ id: 'user-1', username: 'creator' });
  });

  it('fetches media through the shared paginator with the IG User page size', async () => {
    const { context, requests, items, returnItems } = createOperationContext(
      { graphApiVersion: 'v26.0', node: { value: 'user-1' }, returnAll: false, limit: 2 },
      { data: [{ id: 'media-1' }, { id: 'media-2' }] },
    );

    await invokeHandler(handleIgUser, context, 'igUser', 'getMedia', items, returnItems);

    expect(requests[0]).toMatchObject({
      url: 'https://graph.facebook.com/v26.0/user-1/media',
      qs: { limit: 2, fields: expect.stringContaining('media_type') },
    });
    expect(returnItems[0].json).toEqual({ data: [{ id: 'media-1' }, { id: 'media-2' }] });
  });
});
