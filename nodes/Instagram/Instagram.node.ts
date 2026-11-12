import { requestWithLogging } from './httpLogging';
import type {
  IDataObject,
  IExecuteFunctions,
  IHttpRequestOptions,
  ILoadOptionsFunctions,
  INodeExecutionData,
  INodeListSearchResult,
  INodePropertyOptions,
  INodeType,
  INodeTypeDescription,
  JsonObject,
} from 'n8n-workflow';
import { NodeApiError, NodeConnectionTypes, NodeOperationError } from 'n8n-workflow';
import { instagramProperties } from './properties';
import { toNodeError } from './utils';
import { handleMessaging } from './operations/messaging';
import { handleAuth } from './operations/auth';
import { handleCarousel } from './operations/carousel';
import { handleIgHashtag } from './operations/igHashtag';
import { handlePage } from './operations/page';
import { handleIgUser } from './operations/igUser';
import { handleComments } from './operations/comments';
import { handlePublish } from './operations/publish';

const operationHandlers: Partial<Record<string, typeof handlePublish>> = {
  messaging: handleMessaging,
  auth: handleAuth,
  carousel: handleCarousel,
  igHashtag: handleIgHashtag,
  page: handlePage,
  igUser: handleIgUser,
  comments: handleComments,
  image: handlePublish,
  reels: handlePublish,
  stories: handlePublish,
};

export class Instagram implements INodeType {
  description: INodeTypeDescription = {
    displayName: 'Instagram',
    name: 'instagram',
    icon: { light: 'file:instagram.svg', dark: 'file:instagram.dark.svg' },
    group: ['transform'],
    version: 1,
    subtitle: '={{$parameter["operation"]}}',
    description: 'Publish media to Instagram using Instagram or Facebook Graph API',
    defaults: {
      name: 'Instagram',
    },
    usableAsTool: true,
    inputs: [NodeConnectionTypes.Main],
    outputs: [NodeConnectionTypes.Main],
    credentials: [
      {
        name: 'instagramApi',
        required: true,
      },
    ],
    requestDefaults: {
      baseURL: 'https://graph.instagram.com/',
      headers: {
        accept: 'application/json,text/*;q=0.99',
      },
    },
    properties: instagramProperties,
  };

  methods = {
    listSearch: {
      async searchInstagramAccounts(this: ILoadOptionsFunctions): Promise<INodeListSearchResult> {
        const returnData: INodePropertyOptions[] = [];

        try {
          // Get API endpoint from credentials
          let hostUrl = 'graph.instagram.com';
          try {
            const credentials = await this.getCredentials('instagramApi');
            if (credentials?.apiEndpoint && typeof credentials.apiEndpoint === 'string') {
              hostUrl = credentials.apiEndpoint;
            }
          } catch {
            // Use default if credentials can't be retrieved
          }

          // Use fields supported by the selected login flow.
          const url = `https://${hostUrl}/v26.0/me`;
          const requestOptions: IHttpRequestOptions = {
            headers: {
              accept: 'application/json',
            },
            method: 'GET',
            url,
            qs: {
              fields: hostUrl === 'graph.instagram.com' ? 'id,username' : 'id,name,username',
            },
            json: true,
          };

          const response = (await requestWithLogging(
            this.logger,
            'Instagram.node.ts:searchInstagramAccounts',
            'searchInstagramAccounts',
            requestOptions,
            () =>
              this.helpers.httpRequestWithAuthentication.call(this, 'instagramApi', requestOptions),
          )) as IDataObject;

          // Add the account from /me response
          if (response.id) {
            const nameValue = String(
              response.name || response.username || `Account ${response.id}`,
            );
            const username = response.username ? `@${String(response.username)}` : '';
            const displayName = username ? `${nameValue} | ${username}` : nameValue;
            returnData.push({
              name: displayName,
              value: String(response.id),
            });
          }
        } catch {
          // If API call fails, return empty results (user can enter ID manually)
          // The resourceLocator 'By ID' mode will still be available
        }

        return { results: returnData };
      },
    },
  };

  async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
    const items = this.getInputData();
    const returnItems: INodeExecutionData[] = [];

    // Get API endpoint from credentials
    let hostUrl = 'graph.instagram.com';
    try {
      const credentials = await this.getCredentials('instagramApi');
      if (credentials?.apiEndpoint && typeof credentials.apiEndpoint === 'string') {
        hostUrl = credentials.apiEndpoint;
      }
    } catch {
      // If we can't get credentials, we'll use the default value
      // This ensures backward compatibility
    }

    for (let itemIndex = 0; itemIndex < items.length; itemIndex++) {
      try {
        let resource: string;
        let operation: string;
        try {
          resource = this.getNodeParameter('resource', itemIndex) as string;
          if (!resource || typeof resource !== 'string') {
            throw new NodeOperationError(
              this.getNode(),
              `Invalid or missing resource parameter at item index ${itemIndex}. Resource must be a non-empty string.`,
              { itemIndex },
            );
          }
        } catch (error) {
          if (error instanceof NodeOperationError) {
            throw toNodeError(this.getNode(), error);
          }
          throw new NodeOperationError(
            this.getNode(),
            `Failed to get resource parameter at item index ${itemIndex}: ${error instanceof Error ? error.message : String(error)}`,
            { itemIndex },
          );
        }

        try {
          operation = this.getNodeParameter('operation', itemIndex) as string;
          if (!operation || typeof operation !== 'string') {
            throw new NodeOperationError(
              this.getNode(),
              `Invalid or missing operation parameter at item index ${itemIndex}. Operation must be a non-empty string.`,
              { itemIndex },
            );
          }
        } catch (error) {
          if (error instanceof NodeOperationError) {
            throw toNodeError(this.getNode(), error);
          }
          throw new NodeOperationError(
            this.getNode(),
            `Failed to get operation parameter at item index ${itemIndex}: ${error instanceof Error ? error.message : String(error)}`,
            { itemIndex },
          );
        }

        const resourceHandler = operationHandlers[resource];
        if (resourceHandler && (resource !== 'carousel' || operation === 'publish')) {
          await resourceHandler(this, resource, operation, hostUrl, itemIndex, items, returnItems);
          continue;
        }

        await handlePublish(this, resource, operation, hostUrl, itemIndex, items, returnItems);
      } catch (error) {
        if (!this.continueOnFail()) {
          throw new NodeApiError(this.getNode(), error as JsonObject);
        }

        let errorItem;
        type GraphError = {
          message?: string;
          code?: number;
          error_subcode?: number;
        };
        type ErrorWithGraph = {
          response?: {
            body?: {
              error?: GraphError;
            };
            headers?: IDataObject;
          };
          statusCode?: number;
        };
        const errorWithGraph = error as ErrorWithGraph;
        if (errorWithGraph.response !== undefined) {
          const graphApiErrors = errorWithGraph.response.body?.error ?? {};
          errorItem = {
            statusCode: errorWithGraph.statusCode,
            ...graphApiErrors,
            headers: errorWithGraph.response.headers,
          };
        } else {
          errorItem = error as IDataObject;
        }
        returnItems.push({ json: { ...errorItem }, pairedItem: { item: itemIndex } });
      }
    }

    return [returnItems];
  }
}
