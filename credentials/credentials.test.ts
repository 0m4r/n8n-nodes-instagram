import { describe, expect, it } from 'vitest';
import { InstagramApi } from './InstagramApi.credentials';
import { InstagramWebhookApi } from './InstagramWebhookApi.credentials';

const credentialCases = [
  {
    credential: new InstagramApi(),
    name: 'instagramApi',
    displayName: 'Instagram (0m4r) API',
  },
  {
    credential: new InstagramWebhookApi(),
    name: 'instagramWebhookApi',
    displayName: 'Instagram Webhook (0m4r) API',
  },
];

describe('Instagram credential definitions', () => {
  it.each(credentialCases)('defines the $name credential contract', ({ credential, name, displayName }) => {
    expect(credential.name).toBe(name);
    expect(credential.displayName).toBe(displayName);
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
      default: 'graph.facebook.com',
      options: [
        { value: 'graph.facebook.com' },
        { value: 'graph.instagram.com' },
      ],
    });
    expect(credential.authenticate).toEqual({
      type: 'generic',
      properties: { qs: { access_token: '={{$credentials.accessToken}}' } },
    });
    expect(credential.test).toEqual({
      request: {
        method: 'GET',
        url: '=https://{{$credentials.apiEndpoint ?? "graph.facebook.com"}}/v26.0/me',
        qs: { fields: 'id' },
      },
    });
  });
});
