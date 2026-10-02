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
	documentationUrl = 'https://github.com/MookieLian/n8n-nodes-instagram#credentials';
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
					name: 'Facebook Graph API',
					value: 'graph.facebook.com',
					description: 'Use graph.facebook.com endpoint (default)',
				},
				{
					name: 'Instagram Graph API',
					value: 'graph.instagram.com',
					description:
						'Limited support: Page lookup and hashtag search require Facebook Graph API. Use an Instagram Login access token.',
				},
			],
			default: 'graph.facebook.com',
			description:
				'WARNING: Instagram Graph API does not support all node operations (including Page lookup and hashtag search). Changing this endpoint does not convert your access token or grant permissions; use a token issued for the selected API.',
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
			url: '=https://{{$credentials.apiEndpoint ?? "graph.facebook.com"}}/v26.0/me',
			qs: {
				fields: 'id',
			},
		},
	};
}
