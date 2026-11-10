import type { ICredentialType, INodeProperties, Icon } from 'n8n-workflow';

export class InstagramWebhookApi implements ICredentialType {
  name = 'instagramWebhookApi';
  displayName = 'Instagram Webhook API';
  icon: Icon = { light: 'file:instagram.svg', dark: 'file:instagram.svg' };
  documentationUrl = 'https://developers.facebook.com/docs/graph-api/webhooks/getting-started';
  properties: INodeProperties[] = [
    {
      displayName: 'App Secret',
      name: 'appSecret',
      type: 'string',
      typeOptions: { password: true },
      required: true,
      default: '',
      description: 'Meta App Secret used to validate X-Hub-Signature-256 webhook signatures',
    },
  ];
}
