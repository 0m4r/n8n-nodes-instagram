import { describe, expect, it } from 'vitest';
import { handleMessaging } from './messaging';
import { createOperationContext, invokeHandler } from './testUtils';

describe('handleMessaging', () => {
  it('handles direct message requests', async () => {
    const { context, items, requests, returnItems } = createOperationContext(
      {
        graphApiVersion: 'v26.0',
        node: 'account-1',
        recipientId: 'recipient-1',
        messageText: 'Hello',
      },
      { message_id: 'message-1' },
    );

    await invokeHandler(handleMessaging, context, 'messaging', 'sendMessage', items, returnItems);

    expect(requests[0].url).toBe('https://graph.facebook.com/v26.0/account-1/messages');
    expect(returnItems[0].json).toEqual({ message_id: 'message-1' });
  });
});
