import type { IWebhookFunctions } from 'n8n-workflow';
import { createHmac } from 'node:crypto';
import { describe, expect, it, vi } from 'vitest';
import { InstagramTrigger } from './InstagramTrigger.node';

const createWebhookContext = ({
  method = 'POST',
  query = {},
  body = {},
  parameters = {},
  rawBody,
  signature,
  appSecret = 'test-secret',
}: {
  method?: string;
  query?: Record<string, unknown>;
  body?: unknown;
  parameters?: Record<string, unknown>;
  rawBody?: Buffer;
  signature?: string;
  appSecret?: string;
}) => {
  const mockResponse = { status: vi.fn().mockReturnThis(), send: vi.fn() };
  return {
    getBodyData: () => body,
    getCredentials: async () => ({ appSecret }),
    getNodeParameter: (name: string) => parameters[name],
    getQueryData: () => query,
    getRequestObject: () => ({
      method,
      headers: signature ? { 'x-hub-signature-256': signature } : {},
      rawBody,
      readRawBody: async () => {},
    }),
    getResponseObject: () => mockResponse,
    mockResponse,
  } as unknown as IWebhookFunctions & { mockResponse: typeof mockResponse };
};

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

  it('accepts a valid Meta SHA-256 signature', async () => {
    const body = { object: 'instagram', entry: [] };
    const rawBody = Buffer.from(JSON.stringify(body));
    const signature = `sha256=${createHmac('sha256', 'test-secret').update(rawBody).digest('hex')}`;
    const context = createWebhookContext({
      body,
      rawBody,
      signature,
      parameters: { skipSignatureVerification: false },
    });

    await expect(new InstagramTrigger().webhook.call(context)).resolves.toEqual({
      webhookResponse: 'OK',
    });
  });

  it('rejects invalid Meta signatures before emitting workflow data', async () => {
    const context = createWebhookContext({
      body: { object: 'instagram', entry: [] },
      rawBody: Buffer.from('{"object":"instagram","entry":[]}'),
      signature: `sha256=${'0'.repeat(64)}`,
      parameters: { skipSignatureVerification: false },
    });

    await expect(new InstagramTrigger().webhook.call(context)).resolves.toEqual({
      noWebhookResponse: true,
    });
    expect(context.mockResponse.status).toHaveBeenCalledWith(401);
    expect(context.mockResponse.send).toHaveBeenCalledWith('Forbidden');
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

  it('normalizes Instagram Login flat entry notifications', async () => {
    const context = createWebhookContext({
      body: {
        object: 'instagram',
        entry: [
          {
            id: 'account-1',
            time: 123,
            field: 'comments',
            value: { id: 'comment-1' },
          },
        ],
      },
      parameters: { eventsToInclude: ['comments'], skipSignatureVerification: true },
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
        ],
      ],
    });
  });

  it('filters Instagram Login reaction events by their webhook field', async () => {
    const context = createWebhookContext({
      body: {
        object: 'instagram',
        entry: [
          {
            id: 'account-1',
            time: 123,
            messaging: [
              {
                sender: { id: 'sender-1' },
                recipient: { id: 'account-1' },
                timestamp: 456,
                reaction: { action: 'react', emoji: 'heart' },
              },
            ],
          },
        ],
      },
      parameters: { eventsToInclude: ['messaging_reactions'], skipSignatureVerification: true },
    });

    await expect(new InstagramTrigger().webhook.call(context)).resolves.toMatchObject({
      workflowData: [
        [
          {
            json: {
              field: 'messaging_reactions',
              reaction: { action: 'react', emoji: 'heart' },
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
