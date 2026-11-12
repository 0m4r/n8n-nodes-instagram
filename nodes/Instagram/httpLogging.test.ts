import type { IHttpRequestOptions } from 'n8n-workflow';
import { describe, expect, it, vi } from 'vitest';
import { requestWithLogging, sanitizeHttpLogValue } from './httpLogging';

describe('HTTP request logging', () => {
  it('logs request payloads and detailed responses while redacting secrets', async () => {
    const logger = { debug: vi.fn(), error: vi.fn() };
    const requestOptions: IHttpRequestOptions = {
      method: 'POST',
      url: 'https://graph.example.test/messages',
      qs: { access_token: 'request-token', limit: 3 },
      body: { message: { text: 'Hello' }, client_secret: 'app-secret' },
    };

    await expect(
      requestWithLogging(
        logger,
        'operations/messaging.ts:handleMessaging',
        'sendMessage',
        requestOptions,
        async () => ({
          message_id: 'message-1',
          access_token: 'response-token',
        }),
      ),
    ).resolves.toEqual({ message_id: 'message-1', access_token: 'response-token' });

    expect(logger.debug).toHaveBeenNthCalledWith(
      1,
      '[operations/messaging.ts:handleMessaging] sendMessage HTTP request',
      expect.objectContaining({
        query: { access_token: '[REDACTED]', limit: 3 },
        body: { message: { text: 'Hello' }, client_secret: '[REDACTED]' },
      }),
    );
    expect(logger.debug).toHaveBeenNthCalledWith(
      2,
      '[operations/messaging.ts:handleMessaging] sendMessage HTTP response',
      expect.objectContaining({
        response: { message_id: 'message-1', access_token: '[REDACTED]' },
      }),
    );
  });

  it('logs detailed API error responses at error level, then rethrows', async () => {
    const logger = { debug: vi.fn(), error: vi.fn() };
    const requestOptions: IHttpRequestOptions = {
      method: 'GET',
      url: 'https://graph.example.test/me',
    };
    const failure = Object.assign(new Error('Request failed'), {
      statusCode: 400,
      response: { body: { error: { message: 'Invalid request', code: 100 } } },
    });

    await expect(
      requestWithLogging(
        logger,
        'operations/auth.ts:handleAuth',
        'getMe',
        requestOptions,
        async () => {
          throw failure;
        },
      ),
    ).rejects.toBe(failure);

    expect(logger.error).toHaveBeenCalledWith(
      '[operations/auth.ts:handleAuth] getMe HTTP request failed',
      expect.objectContaining({
        statusCode: 400,
        apiResponse: { body: { error: { message: 'Invalid request', code: 100 } } },
      }),
    );
  });

  it('redacts secrets in URLs and nested response objects', () => {
    expect(
      sanitizeHttpLogValue({
        url: 'https://graph.example.test/me?access_token=abc&fields=id',
        nested: [{ refreshToken: 'secret' }],
      }),
    ).toEqual({
      url: 'https://graph.example.test/me?access_token=%5BREDACTED%5D&fields=id',
      nested: [{ refreshToken: '[REDACTED]' }],
    });
  });
});
