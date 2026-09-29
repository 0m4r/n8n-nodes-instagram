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
	icon: Icon = 'file:instagram.svg';
	documentationUrl = 'https://github.com/MookieLian/n8n-nodes-instagram#credentials';
	properties: INodeProperties[] = [
		{
			displayName: 'Access Token',
			name: 'accessToken',
			type: 'string',
			typeOptions: { password: true },
			required: true,
			default: '',
			description: 'Instagram Graph API user access token with publish permissions',
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
					description: 'Use graph.instagram.com endpoint',
				},
			],
			default: 'graph.facebook.com',
			description: 'Select the API endpoint to use for requests',
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
			url: '=https://{{$credentials.apiEndpoint ?? "graph.facebook.com"}}/v22.0/me',
			qs: {
				fields: 'id',
			},
		},
	};
}
