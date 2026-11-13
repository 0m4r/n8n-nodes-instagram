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

  it('sends image-only and shared optional fields in the media container request', async () => {
    const { context, items, requests, returnItems } = createOperationContext(
      {
        node: { value: 'account-id' },
        graphApiVersion: 'v26.0',
        imageUrl: 'https://example.com/image.jpg',
        caption: 'Image caption',
        additionalFields: {
          altText: 'Image description',
          locationId: 'location-page-id',
          collaborators: '@first, second',
          userTags: { tag: [{ username: 'tagged-user', x: 0.2, y: 0.7 }] },
          productTags: { tag: [{ product_id: 'product-id', x: 0.3, y: 0.4 }] },
          trialReelGraduationStrategy: 'SS_PERFORMANCE',
          coverUrl: 'https://example.com/cover.jpg',
          audioName: 'Audio',
          thumbOffset: 1200,
          shareToFeed: false,
        },
      },
      { id: 'container-id', status_code: 'FINISHED' },
    );

    await invokeHandler(handlePublish, context, 'image', 'publish', items, returnItems);

    expect(requests[0].qs).toMatchObject({
      image_url: 'https://example.com/image.jpg',
      caption: 'Image caption',
      alt_text: 'Image description',
      location_id: 'location-page-id',
      collaborators: JSON.stringify(['first', 'second']),
      user_tags: JSON.stringify([{ username: 'tagged-user', x: 0.2, y: 0.7 }]),
      product_tags: JSON.stringify([{ product_id: 'product-id', x: 0.3, y: 0.4 }]),
    });
    expect(requests[0].qs).not.toHaveProperty('trial_params');
    expect(requests[0].qs).not.toHaveProperty('cover_url');
    expect(requests[0].qs).not.toHaveProperty('share_to_feed');
  });

  it('omits captions and fields unsupported for Stories', async () => {
    const { context, items, requests, returnItems } = createOperationContext(
      {
        node: { value: 'account-id' },
        graphApiVersion: 'v26.0',
        videoUrl: 'https://example.com/story.mp4',
        caption: 'Stories do not support captions',
        additionalFields: {
          altText: 'Unsupported alt text',
          locationId: 'unsupported-location',
          collaborators: 'unsupported-collaborator',
          productTags: { tag: [{ product_id: 'unsupported-product' }] },
        },
      },
      { id: 'container-id', status_code: 'FINISHED' },
    );

    await invokeHandler(handlePublish, context, 'stories', 'publish', items, returnItems);

    expect(requests[0].qs).toMatchObject({ media_type: 'STORIES' });
    expect(requests[0].qs).not.toHaveProperty('caption');
    expect(requests[0].qs).not.toHaveProperty('alt_text');
    expect(requests[0].qs).not.toHaveProperty('location_id');
    expect(requests[0].qs).not.toHaveProperty('collaborators');
    expect(requests[0].qs).not.toHaveProperty('product_tags');
  });

  it('sends Reel-only publishing fields only for Reels', async () => {
    const { context, items, requests, returnItems } = createOperationContext(
      {
        node: { value: 'account-id' },
        graphApiVersion: 'v26.0',
        videoUrl: 'https://example.com/reel.mp4',
        caption: '',
        additionalFields: {
          trialReelGraduationStrategy: 'SS_PERFORMANCE',
          coverUrl: 'https://example.com/cover.jpg',
          audioName: 'Audio',
          thumbOffset: 1200,
          shareToFeed: false,
        },
      },
      { id: 'container-id', status_code: 'FINISHED' },
    );

    await invokeHandler(handlePublish, context, 'reels', 'publish', items, returnItems);

    expect(requests[0].qs).toMatchObject({
      media_type: 'REELS',
      trial_params: JSON.stringify({ graduation_strategy: 'SS_PERFORMANCE' }),
      cover_url: 'https://example.com/cover.jpg',
      audio_name: 'Audio',
      thumb_offset: 1200,
      share_to_feed: false,
    });
  });
});
