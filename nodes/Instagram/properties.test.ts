import { describe, expect, it } from 'vitest';
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
});
