import type {
  IAuthenticateGeneric,
  ICredentialTestRequest,
  ICredentialType,
  INodeProperties,
  Icon,
} from 'n8n-workflow';

export class InstagramApi implements ICredentialType {
  name = 'instagramApi';
  displayName = 'Instagram API';
  icon: Icon = { light: 'file:instagram.svg', dark: 'file:instagram.svg' };
  documentationUrl = 'https://github.com/0m4r/n8n-nodes-instagram#credentials';
  properties: INodeProperties[] = [
    {
      displayName: 'Access Token',
      name: 'accessToken',
      type: 'string',
      typeOptions: { password: true },
      required: true,
      default: '',
      description: 'Access token with permissions for the selected API endpoint',
    },
    {
      displayName: 'API Endpoint',
      name: 'apiEndpoint',
      type: 'options',
      options: [
        {
          name: 'Instagram Graph API',
          value: 'graph.instagram.com',
          description: 'Use graph.instagram.com with an Instagram Login access token (default)',
        },
        {
          name: 'Facebook Graph API',
          value: 'graph.facebook.com',
          description:
            'Use graph.facebook.com with a Facebook Login access token. Page lookup and hashtag search require this endpoint.',
        },
      ],
      default: 'graph.instagram.com',
      description:
        'Use an access token issued for the selected login flow. Page lookup and hashtag search are available only with Facebook Login.',
    },
  ];
  authenticate: IAuthenticateGeneric = {
    type: 'generic',
    properties: {
      qs: {
        access_token: '={{$credentials.accessToken}}',
      },
    },
  };
  test: ICredentialTestRequest = {
    request: {
      method: 'GET',
      url: '=https://{{$credentials.apiEndpoint ?? "graph.instagram.com"}}/v26.0/me',
      qs: {
        fields: 'id',
      },
    },
  };
}
