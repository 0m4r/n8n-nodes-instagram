import type { IExecuteFunctions, IHttpRequestOptions } from 'n8n-workflow';
import { describe, expect, it, vi } from 'vitest';
import { Instagram } from './Instagram.node';
import { interpretContainerStatus } from './containerStatus';

const createExecutionContext = (statusResponse: Record<string, unknown>) => {
  const requests: IHttpRequestOptions[] = [];
  const request = vi.fn(async (_credential: string, options: IHttpRequestOptions) => {
    requests.push(options);

    if (options.url.endsWith('/media')) return { id: 'container-1' };
    if (options.url.endsWith('/container-1')) return statusResponse;
    if (options.url.endsWith('/media_publish')) return { id: 'published-media' };

    throw new Error(`Unexpected request: ${options.url}`);
  });

  const parameters: Record<string, unknown> = {
    resource: 'image',
    operation: 'publish',
    node: 'instagram-account',
    graphApiVersion: 'v26.0',
    caption: 'Caption',
    additionalFields: {},
    imageUrl: 'https://example.test/image.jpg',
  };

  const context = {
    continueOnFail: () => false,
    getCredentials: async () => ({}),
    getInputData: () => [{ json: {} }],
    getNode: () => ({ name: 'Instagram' }),
    getNodeParameter: (name: string) => parameters[name],
    helpers: { httpRequestWithAuthentication: request },
    logger: { error: vi.fn(), info: vi.fn(), warn: vi.fn() },
  } as unknown as IExecuteFunctions;

  return { context, requests };
};

describe('container status interpretation', () => {
  it('gives a failure in status precedence over a ready status_code', () => {
    expect(interpretContainerStatus({ status_code: 'FINISHED', status: 'ERROR' })).toMatchObject({
      state: 'failure',
      authoritativeStatus: 'ERROR',
    });
  });

  it('recognizes a finished container as ready', () => {
    expect(interpretContainerStatus({ status_code: 'FINISHED' })).toMatchObject({
      state: 'ready',
      authoritativeStatus: 'FINISHED',
    });
  });

  it('publishes after a valid finished container status', async () => {
    const { context, requests } = createExecutionContext({ status_code: 'FINISHED' });

    await expect(new Instagram().execute.call(context)).resolves.toEqual([
      [{ json: { id: 'published-media' }, pairedItem: { item: 0 } }],
    ]);
    expect(requests.some((request) => request.url.endsWith('/media_publish'))).toBe(true);
  });

  it('prevents media_publish after a conflicting container status', async () => {
    const { context, requests } = createExecutionContext({
      status_code: 'FINISHED',
      status: 'ERROR',
    });

    await expect(new Instagram().execute.call(context)).rejects.toThrow('Authoritative status: ERROR');
    expect(requests.some((request) => request.url.endsWith('/media_publish'))).toBe(false);
  });

  it('includes a safe diagnostic for a status_code failure', async () => {
    const { context, requests } = createExecutionContext({
      status_code: 'ERROR',
      error_message: 'The uploaded media could not be processed.',
    });

    await expect(new Instagram().execute.call(context)).rejects.toThrow(
      'The uploaded media could not be processed.',
    );
    expect(requests.some((request) => request.url.endsWith('/media_publish'))).toBe(false);
  });
});
