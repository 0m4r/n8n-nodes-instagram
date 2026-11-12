import { describe, expect, it } from 'vitest';
import { handleAuth } from './auth';
import { createOperationContext, invokeHandler } from './testUtils';

describe('handleAuth', () => {
  it('handles profile requests', async () => {
    const { context, items, requests, returnItems } = createOperationContext(
      { graphApiVersion: 'v26.0' },
      { id: 'user-1' },
    );

    await invokeHandler(handleAuth, context, 'auth', 'getMe', items, returnItems);

    expect(requests[0].url).toBe('https://graph.facebook.com/v26.0/me');
    expect(returnItems).toEqual([{ json: { id: 'user-1' }, pairedItem: { item: 0 } }]);
  });
});
