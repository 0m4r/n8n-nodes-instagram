"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InstagramApi = void 0;
class InstagramApi {
    constructor() {
        this.name = 'instagramApi';
        this.displayName = 'Instagram API';
        this.icon = 'file:instagram.svg';
        this.documentationUrl = 'https://github.com/MookieLian/n8n-nodes-instagram#credentials';
        this.properties = [
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
        this.authenticate = {
            type: 'generic',
            properties: {
                qs: {
                    access_token: '={{$credentials.accessToken}}',
                },
            },
        };
        this.test = {
            request: {
                method: 'GET',
                url: '=https://{{$credentials.apiEndpoint ?? "graph.facebook.com"}}/v26.0/me',
                qs: {
                    fields: 'id',
                },
            },
        };
    }
}
exports.InstagramApi = InstagramApi;
//# sourceMappingURL=InstagramApi.credentials.js.map