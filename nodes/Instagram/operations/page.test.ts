import { describe, expect, it } from 'vitest';
import { handlePage } from './page';
import { createOperationContext, invokeHandler } from './testUtils';

describe('handlePage', () => {
  it('handles connected account lookup requests', async () => {
    const { context, items, requests, returnItems } = createOperationContext(
      { graphApiVersion: 'v26.0', pageId: 'page-1' },
      { instagram_business_account: { id: 'ig-user-1' } },
    );

    await invokeHandler(handlePage, context, 'page', 'getInstagramAccount', items, returnItems);

    expect(requests[0].url).toBe('https://graph.facebook.com/v26.0/page-1');
    expect(returnItems[0].json).toEqual({ instagram_business_account: { id: 'ig-user-1' } });
  });
});
