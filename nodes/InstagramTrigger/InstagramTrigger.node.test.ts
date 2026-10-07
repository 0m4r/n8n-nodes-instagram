import type { IWebhookFunctions } from 'n8n-workflow';
import { describe, expect, it } from 'vitest';
import { InstagramTrigger } from './InstagramTrigger.node';

const createWebhookContext = ({
  method = 'POST',
  query = {},
  body = {},
  parameters = {},
}: {
  method?: string;
  query?: Record<string, unknown>;
  body?: unknown;
  parameters?: Record<string, unknown>;
}) =>
  ({
    getBodyData: () => body,
    getNodeParameter: (name: string) => parameters[name],
    getQueryData: () => query,
    getRequestObject: () => ({ method }),
  }) as unknown as IWebhookFunctions;

describe('InstagramTrigger webhook', () => {
  it('accepts valid Meta GET verification with dotted query keys', async () => {
    const context = createWebhookContext({
      method: 'GET',
      parameters: { verifyToken: 'expected-token' },
      query: {
        'hub.mode': 'subscribe',
        'hub.challenge': 'challenge-value',
        'hub.verify_token': 'expected-token',
      },
    });

    await expect(new InstagramTrigger().webhook.call(context)).resolves.toEqual({
      webhookResponse: 'challenge-value',
    });
  });

  it('rejects invalid Meta GET verification', async () => {
    const context = createWebhookContext({
      method: 'GET',
      parameters: { verifyToken: 'expected-token' },
      query: { hub_mode: 'subscribe', hub_challenge: 'challenge', hub_verify_token: 'wrong-token' },
    });

    await expect(new InstagramTrigger().webhook.call(context)).resolves.toEqual({
      webhookResponse: 'Forbidden',
      noWebhookResponse: false,
    });
  });

  it('returns an explicit error when signature verification is enabled', async () => {
    const context = createWebhookContext({
      body: { object: 'instagram' },
      parameters: { skipSignatureVerification: false },
    });

    await expect(new InstagramTrigger().webhook.call(context)).resolves.toMatchObject({
      noWebhookResponse: false,
      webhookResponse: { error: expect.stringContaining('not supported') },
    });
  });

  it('normalizes Graph changes and messaging payloads and filters selected events', async () => {
    const context = createWebhookContext({
      body: {
        object: 'instagram',
        entry: [
          {
            id: 'account-1',
            time: 123,
            changes: [
              { field: 'comments', value: { id: 'comment-1' } },
              { field: 'mentions', value: { id: 'mention-1' } },
            ],
            messaging: [{ sender: { id: 'sender-1' }, message: { text: 'Hello' }, timestamp: 456 }],
          },
        ],
      },
      parameters: { eventsToInclude: ['comments', 'messages'], skipSignatureVerification: true },
    });

    await expect(new InstagramTrigger().webhook.call(context)).resolves.toEqual({
      webhookResponse: 'OK',
      workflowData: [
        [
          {
            json: {
              object: 'instagram',
              field: 'comments',
              value: { id: 'comment-1' },
              id: 'account-1',
              time: 123,
            },
          },
          {
            json: {
              object: 'instagram',
              field: 'messages',
              id: 'account-1',
              time: 123,
              sender: { id: 'sender-1' },
              recipient: undefined,
              timestamp: 456,
              message: { text: 'Hello' },
            },
          },
        ],
      ],
    });
  });

  it('acknowledges non-Instagram and empty payloads without workflow data', async () => {
    const trigger = new InstagramTrigger();

    await expect(
      trigger.webhook.call(
        createWebhookContext({ body: { object: 'page' }, parameters: { skipSignatureVerification: true } }),
      ),
    ).resolves.toEqual({ webhookResponse: 'OK' });
    await expect(
      trigger.webhook.call(
        createWebhookContext({ body: { object: 'instagram' }, parameters: { skipSignatureVerification: true } }),
      ),
    ).resolves.toEqual({ webhookResponse: 'OK' });
  });
});
