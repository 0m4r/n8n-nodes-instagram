import { describe, expect, it } from 'vitest';
import type { INodeProperties } from 'n8n-workflow';
import { instagramProperties } from './properties';

describe('Instagram node properties', () => {
  it('exposes the resource options for every supported operation handler', () => {
    const resourceProperty = instagramProperties.find((property) => property.name === 'resource');
    const resourceValues = resourceProperty?.options?.map((option) =>
      'value' in option ? option.value : undefined,
    );

    expect(resourceValues).toEqual(
      expect.arrayContaining([
        'auth',
        'carousel',
        'comments',
        'igHashtag',
        'igUser',
        'messaging',
        'page',
        'image',
        'reels',
        'stories',
      ]),
    );
  });

  it('limits carousel publish fields to the carousel resource', () => {
    const carouselMedia = instagramProperties.find((property) => property.name === 'carouselMedia');

    expect(carouselMedia?.displayOptions?.show).toMatchObject({
      resource: ['carousel'],
      operation: ['publish'],
    });
  });

  it('keeps additional publish fields alphabetized and scoped to supported media types', () => {
    const additionalFields = instagramProperties.find(
      (property) => property.name === 'additionalFields',
    );
    const options = additionalFields?.options ?? [];
    const names = options.map((option) => option.name);

    expect(names).toEqual([...names].sort());
    expect(
      (options.find((option) => option.name === 'altText') as INodeProperties | undefined)
        ?.displayOptions?.show,
    ).toEqual({
      resource: ['image'],
    });
    expect(
      (options.find((option) => option.name === 'locationId') as INodeProperties | undefined)
        ?.displayOptions?.show,
    ).toEqual({ resource: ['image', 'reels', 'carousel'] });
    expect(
      (options.find((option) => option.name === 'shareToFeed') as INodeProperties | undefined)
        ?.displayOptions?.show,
    ).toEqual({ resource: ['reels', 'carousel'] });
    expect(
      (
        options.find((option) => option.name === 'trialReelGraduationStrategy') as
          INodeProperties | undefined
      )?.displayOptions?.show,
    ).toEqual({ resource: ['reels'] });
  });

  it('orders carousel slide fields by display name and limits them to supported media types', () => {
    const carouselMedia = instagramProperties.find((property) => property.name === 'carouselMedia');
    const mediaItem = carouselMedia?.options?.[0];
    const fields = mediaItem && 'values' in mediaItem ? mediaItem.values : [];
    const displayNames = fields.map((field) => field.displayName);

    expect(displayNames).toEqual([...displayNames].sort());
    expect(fields.find((field) => field.name === 'altText')?.displayOptions?.show).toEqual({
      mediaType: ['image'],
    });
    expect(fields.find((field) => field.name === 'videoUrl')?.displayOptions?.show).toEqual({
      mediaType: ['video'],
    });
  });
});
