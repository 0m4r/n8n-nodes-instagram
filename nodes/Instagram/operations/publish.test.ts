import { describe, expect, it } from 'vitest';
import { handlePublish } from './publish';
import { createOperationContext, invokeHandler } from './testUtils';

describe('handlePublish', () => {
  it('runs publish specific validation before making API requests', async () => {
    const { context, items, requests, returnItems } = createOperationContext({});

    await expect(
      invokeHandler(handlePublish, context, 'image', 'publish', items, returnItems),
    ).rejects.toThrow('Failed to get node parameter');
    expect(requests).toHaveLength(0);
  });
});
