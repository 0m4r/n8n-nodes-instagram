import { NodeApiError, NodeOperationError } from 'n8n-workflow';
import { describe, expect, it } from 'vitest';
import { toNodeError } from './utils';

const node = { name: 'Instagram' } as ConstructorParameters<typeof NodeApiError>[0];

describe('toNodeError', () => {
  it('preserves an existing node operation error', () => {
    const error = new NodeOperationError(node, 'Invalid parameter');

    expect(toNodeError(node, error)).toBe(error);
  });

  it('preserves an existing node API error and its API details', () => {
    const error = new NodeApiError(node, {
      message: 'Bad Request',
      httpCode: '400',
      response: { body: { error: { message: 'Invalid parameter' } } },
    });

    expect(toNodeError(node, error)).toBe(error);
  });

  it('wraps other errors in a node API error', () => {
    expect(toNodeError(node, { message: 'Request failed' })).toBeInstanceOf(NodeApiError);
  });
});
