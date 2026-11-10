import { describe, expect, it } from 'vitest';
import { InstagramApi } from './InstagramApi.credentials';
import { InstagramWebhookApi } from './InstagramWebhookApi.credentials';

describe('Instagram credential definitions', () => {
  it('defaults the API credential to Instagram Login and keeps Facebook Login selectable', () => {
    const credential = new InstagramApi();

    expect(credential.name).toBe('instagramApi');
    expect(credential.displayName).toBe('Instagram (0m4r) API');
    expect(credential.icon).toEqual({ light: 'file:instagram.svg', dark: 'file:instagram.svg' });

    const accessToken = credential.properties.find((property) => property.name === 'accessToken');
    const apiEndpoint = credential.properties.find((property) => property.name === 'apiEndpoint');

    expect(accessToken).toMatchObject({
      type: 'string',
      required: true,
      default: '',
      typeOptions: { password: true },
    });
    expect(apiEndpoint).toMatchObject({
      type: 'options',
      default: 'graph.instagram.com',
      options: [{ value: 'graph.instagram.com' }, { value: 'graph.facebook.com' }],
    });
    expect(credential.authenticate).toEqual({
      type: 'generic',
      properties: { qs: { access_token: '={{$credentials.accessToken}}' } },
    });
    expect(credential.test).toEqual({
      request: {
        method: 'GET',
        url: '=https://{{$credentials.apiEndpoint ?? "graph.instagram.com"}}/v26.0/me',
        qs: { fields: 'id' },
      },
    });
  });

  it('stores the App Secret for webhook signature verification', () => {
    const credential = new InstagramWebhookApi();
    expect(credential.name).toBe('instagramWebhookApi');
    expect(credential.displayName).toBe('Instagram Webhook API');
    expect(credential.properties).toContainEqual(
      expect.objectContaining({
        name: 'appSecret',
        type: 'string',
        required: true,
        typeOptions: { password: true },
      }),
    );
  });
});
