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
});
