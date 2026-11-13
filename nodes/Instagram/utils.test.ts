import { NodeApiError, NodeOperationError } from 'n8n-workflow';
import { describe, expect, it } from 'vitest';
import type { IExecuteFunctions } from 'n8n-workflow';
import { getRequiredStringParameter, toErrorItem, toNodeError } from './utils';

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

describe('toErrorItem', () => {
  it('serializes Error instances into enumerable output fields', () => {
    expect(toErrorItem(new TypeError('Invalid account ID'))).toEqual({
      error: 'Invalid account ID',
      name: 'TypeError',
    });
  });

  it('preserves Graph API error details and adds the HTTP status', () => {
    const error = Object.assign(new Error('Request failed'), {
      statusCode: 400,
      response: {
        status: 400,
        body: { error: { message: 'Invalid parameter', code: 100 } },
        headers: { 'content-type': 'application/json' },
      },
    });

    expect(toErrorItem(error)).toEqual({
      statusCode: 400,
      message: 'Invalid parameter',
      code: 100,
      headers: { 'content-type': 'application/json' },
    });
  });

  it('handles non-Error values', () => {
    expect(toErrorItem('Request failed')).toEqual({ error: 'Request failed' });
    expect(toErrorItem({ message: 'Request failed' })).toEqual({ error: 'Request failed' });
  });
});

describe('getRequiredStringParameter', () => {
  const makeContext = (value: unknown) =>
    ({
      getNode: () => node,
      getNodeParameter: () => value,
    }) as unknown as IExecuteFunctions;

  it('returns a required string parameter', () => {
    expect(
      getRequiredStringParameter(
        makeContext('v26.0'),
        'graphApiVersion',
        2,
        'Graph API version',
        'Must be a non-empty string.',
      ),
    ).toBe('v26.0');
  });

  it('supports legacy strings and resource locator values', () => {
    const options = ['node', 0, 'Instagram Account ID', 'Must be a non-empty string.', true] as const;
    expect(getRequiredStringParameter(makeContext('account-1'), ...options)).toBe('account-1');
    expect(
      getRequiredStringParameter(makeContext({ value: 'account-2' }), ...options),
    ).toBe('account-2');
  });

  it('throws an item-aware node operation error for invalid values', () => {
    expect(() =>
      getRequiredStringParameter(
        makeContext({ value: '' }),
        'node',
        3,
        'Instagram Account ID',
        'Must be a non-empty string.',
        true,
      ),
    ).toThrow(NodeOperationError);
  });

  it('reports failures while reading a parameter', () => {
    const context = {
      getNode: () => node,
      getNodeParameter: () => {
        throw new Error('Parameter is unavailable');
      },
    } as unknown as IExecuteFunctions;

    expect(() =>
      getRequiredStringParameter(
        context,
        'graphApiVersion',
        1,
        'Graph API version',
        'Must be a non-empty string.',
      ),
    ).toThrow('Failed to get Graph API version parameter at item index 1: Parameter is unavailable');
  });
});
