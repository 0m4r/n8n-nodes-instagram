import { describe, expect, it } from 'vitest';
import { handleCarousel } from './carousel';
import { createOperationContext, invokeHandler } from './testUtils';

describe('handleCarousel', () => {
  it('runs carousel specific validation before making API requests', async () => {
    const { context, items, requests, returnItems } = createOperationContext({
      graphApiVersion: 'v26.0',
    });

    await expect(
      invokeHandler(handleCarousel, context, 'carousel', 'publish', items, returnItems),
    ).rejects.toThrow('Failed to get node parameter');
    expect(requests).toHaveLength(0);
  });
});
