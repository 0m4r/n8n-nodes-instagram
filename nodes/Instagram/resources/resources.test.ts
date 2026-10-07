import type { IExecuteFunctions } from 'n8n-workflow';
import { describe, expect, it, vi } from 'vitest';
import { imageResource } from './image';
import { instagramResourceFields, instagramResourceHandlers, instagramResourceOptions } from './index';
import { reelsResource } from './reels';
import { storiesResource } from './stories';

const createExecutionContext = (parameters: Record<string, string>) => {
  const getNodeParameter = vi.fn((name: string) => parameters[name]);
  return { getNodeParameter } as unknown as IExecuteFunctions;
};

describe('Instagram resource handlers', () => {
  it('registers all handlers, options, and shared fields', () => {
    expect(Object.keys(instagramResourceHandlers)).toEqual(['image', 'reels', 'stories']);
    expect(instagramResourceHandlers).toMatchObject({
      image: imageResource,
      reels: reelsResource,
      stories: storiesResource,
    });
    expect(instagramResourceOptions.map((option) => option.value)).toEqual([
      'image',
      'reels',
      'stories',
      'comments',
      'igUser',
      'igHashtag',
      'messaging',
    ]);
    expect(instagramResourceFields.map((field) => field.name)).toEqual(['imageUrl', 'videoUrl']);

    const videoUrl = instagramResourceFields.find((field) => field.name === 'videoUrl');
    expect(videoUrl).toMatchObject({
      required: true,
      displayOptions: { show: { resource: ['reels', 'stories'], operation: ['publish'] } },
    });
  });

  it('builds image payloads with the requested item index', () => {
    const context = createExecutionContext({ imageUrl: 'https://example.test/image.jpg' });

    expect(imageResource.buildMediaPayload.call(context, 2)).toEqual({
      image_url: 'https://example.test/image.jpg',
    });
    expect(context.getNodeParameter).toHaveBeenCalledWith('imageUrl', 2);
  });

  it.each([
    [reelsResource, 'REELS'],
    [storiesResource, 'STORIES'],
  ] as const)('builds %s video payloads', (resource, mediaType) => {
    const context = createExecutionContext({ videoUrl: 'https://example.test/video.mp4' });

    expect(resource.buildMediaPayload.call(context, 1)).toEqual({
      video_url: 'https://example.test/video.mp4',
      media_type: mediaType,
    });
    expect(context.getNodeParameter).toHaveBeenCalledWith('videoUrl', 1);
  });

  it('keeps resource polling and retry settings explicit', () => {
    expect(imageResource).toMatchObject({
      pollIntervalMs: 1500,
      maxPollAttempts: 20,
      publishRetryDelay: 1500,
      publishMaxAttempts: 3,
    });
    expect(reelsResource).toMatchObject({
      pollIntervalMs: 2000,
      maxPollAttempts: 40,
      publishRetryDelay: 2000,
      publishMaxAttempts: 6,
    });
    expect(storiesResource).toMatchObject({
      pollIntervalMs: 2000,
      maxPollAttempts: 40,
      publishRetryDelay: 2000,
      publishMaxAttempts: 6,
    });
  });
});
