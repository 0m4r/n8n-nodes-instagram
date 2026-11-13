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

  it('sends slide options on child containers and carousel options on the parent', async () => {
    const { context, items, requests, returnItems } = createOperationContext(
      {
        node: { value: 'account-id' },
        graphApiVersion: 'v26.0',
        caption: 'Carousel caption',
        carouselInputMode: 'manual',
        carouselMedia: {
          mediaItem: [
            {
              mediaType: 'image',
              imageUrl: 'https://example.com/one.jpg',
              altText: 'First slide',
              userTags: { tag: [{ username: 'tagged-user', x: 0.2, y: 0.7 }] },
              productTags: { tag: [{ product_id: 'product-id', x: 0.3, y: 0.4 }] },
            },
            { mediaType: 'video', videoUrl: 'https://example.com/two.mp4' },
          ],
        },
        additionalFields: {
          locationId: 'location-page-id',
          collaborators: '@first, second',
          shareToFeed: false,
        },
      },
      { id: 'container-id', status_code: 'FINISHED' },
    );

    await invokeHandler(handleCarousel, context, 'carousel', 'publish', items, returnItems);

    expect(requests[0].qs).toMatchObject({
      image_url: 'https://example.com/one.jpg',
      is_carousel_item: true,
      alt_text: 'First slide',
      user_tags: JSON.stringify([{ username: 'tagged-user', x: 0.2, y: 0.7 }]),
      product_tags: JSON.stringify([{ product_id: 'product-id', x: 0.3, y: 0.4 }]),
    });
    expect(requests[4].qs).toMatchObject({
      media_type: 'CAROUSEL',
      caption: 'Carousel caption',
      location_id: 'location-page-id',
      collaborators: JSON.stringify(['first', 'second']),
      share_to_feed: false,
      children: 'container-id,container-id',
    });
  });
});
