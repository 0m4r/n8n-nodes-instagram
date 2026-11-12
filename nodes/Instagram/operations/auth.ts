import { requestWithLogging } from '../httpLogging';
import type {
  IDataObject,
  IExecuteFunctions,
  IHttpRequestOptions,
  INodeExecutionData,
  JsonObject,
} from 'n8n-workflow';
import { NodeApiError, NodeOperationError } from 'n8n-workflow';
import { toNodeError } from '../utils';

export async function handleAuth(
  ctx: IExecuteFunctions,
  _resource: string,
  operation: string,
  hostUrl: string,
  itemIndex: number,
  items: INodeExecutionData[],
  returnItems: INodeExecutionData[],
): Promise<void> {
  try {
    if (operation === 'refreshAccessToken') {
      let token = (ctx.getNodeParameter('accessToken', itemIndex, '') as string | undefined) ?? '';

      if (!token) {
        let credentials;
        try {
          credentials = (await ctx.getCredentials('instagramApi')) as {
            accessToken?: string;
          } | null;
        } catch (error) {
          throw new NodeOperationError(
            ctx.getNode(),
            `Failed to retrieve Instagram API credentials: ${error instanceof Error ? error.message : String(error)}`,
            { itemIndex },
          );
        }

        if (!credentials) {
          throw new NodeOperationError(
            ctx.getNode(),
            'Instagram API credentials not found. Please configure the Instagram API credential.',
            { itemIndex },
          );
        }

        token = credentials?.accessToken ?? '';
      }

      if (!token || typeof token !== 'string') {
        throw new NodeOperationError(
          ctx.getNode(),
          'No access token provided and no access token found in the Instagram API credential. Please provide an access token or configure it in the credential.',
          { itemIndex },
        );
      }

      const url = 'https://graph.instagram.com/refresh_access_token';
      const requestOptions: IHttpRequestOptions = {
        headers: {
          accept: 'application/json,text/*;q=0.99',
        },
        method: 'GET',
        url,
        qs: {
          grant_type: 'ig_refresh_token',
          access_token: token,
        },
        json: true,
      };

      let response: IDataObject;
      try {
        response = (await requestWithLogging(
          ctx.logger,
          'operations/auth.ts:handleAuth',
          operation,
          requestOptions,
          () => ctx.helpers.httpRequest.call(ctx, requestOptions),
        )) as IDataObject;

        if (!response || typeof response !== 'object') {
          throw new NodeOperationError(
            ctx.getNode(),
            `Invalid response format received from refresh access token API. Expected object, got: ${typeof response}. Response: ${JSON.stringify(response)}`,
            { itemIndex },
          );
        }
      } catch (error) {
        if (error instanceof NodeOperationError) {
          throw toNodeError(ctx.getNode(), error);
        }
        throw new NodeOperationError(
          ctx.getNode(),
          `Failed to refresh access token: ${error instanceof Error ? error.message : String(error)}`,
          { itemIndex },
        );
      }

      returnItems.push({ json: response, pairedItem: { item: itemIndex } });
      return;
    }

    if (operation === 'exchangeAccessToken') {
      let shortLivedToken: string;
      let appSecret: string;
      try {
        shortLivedToken = ctx.getNodeParameter('shortLivedAccessToken', itemIndex) as string;
        if (!shortLivedToken || typeof shortLivedToken !== 'string') {
          throw new NodeOperationError(
            ctx.getNode(),
            `Invalid or missing short-lived access token parameter at item index ${itemIndex}. Short-lived access token must be a non-empty string.`,
            { itemIndex },
          );
        }
      } catch (error) {
        if (error instanceof NodeOperationError) {
          throw toNodeError(ctx.getNode(), error);
        }
        throw new NodeOperationError(
          ctx.getNode(),
          `Failed to get short-lived access token parameter at item index ${itemIndex}: ${error instanceof Error ? error.message : String(error)}`,
          { itemIndex },
        );
      }

      try {
        appSecret = ctx.getNodeParameter('appSecret', itemIndex) as string;
        if (!appSecret || typeof appSecret !== 'string') {
          throw new NodeOperationError(
            ctx.getNode(),
            `Invalid or missing app secret parameter at item index ${itemIndex}. App secret must be a non-empty string.`,
            { itemIndex },
          );
        }
      } catch (error) {
        if (error instanceof NodeOperationError) {
          throw toNodeError(ctx.getNode(), error);
        }
        throw new NodeOperationError(
          ctx.getNode(),
          `Failed to get app secret parameter at item index ${itemIndex}: ${error instanceof Error ? error.message : String(error)}`,
          { itemIndex },
        );
      }

      const url = 'https://graph.instagram.com/access_token';
      const requestOptions: IHttpRequestOptions = {
        headers: {
          accept: 'application/json,text/*;q=0.99',
        },
        method: 'GET',
        url,
        qs: {
          grant_type: 'ig_exchange_token',
          client_secret: appSecret,
          access_token: shortLivedToken,
        },
        json: true,
      };

      let response: IDataObject;
      try {
        response = (await requestWithLogging(
          ctx.logger,
          'operations/auth.ts:handleAuth',
          operation,
          requestOptions,
          () => ctx.helpers.httpRequest.call(ctx, requestOptions),
        )) as IDataObject;

        if (!response || typeof response !== 'object') {
          throw new NodeOperationError(
            ctx.getNode(),
            `Invalid response format received from exchange access token API. Expected object, got: ${typeof response}. Response: ${JSON.stringify(response)}`,
            { itemIndex },
          );
        }
      } catch (error) {
        if (error instanceof NodeOperationError) {
          throw toNodeError(ctx.getNode(), error);
        }
        throw new NodeOperationError(
          ctx.getNode(),
          `Failed to exchange access token: ${error instanceof Error ? error.message : String(error)}`,
          { itemIndex },
        );
      }

      returnItems.push({ json: response, pairedItem: { item: itemIndex } });
      return;
    }

    if (operation === 'getMe') {
      const graphApiVersion = ctx.getNodeParameter('graphApiVersion', itemIndex) as string;
      if (!/^v\d+\.\d+$/.test(graphApiVersion)) {
        throw new NodeOperationError(
          ctx.getNode(),
          `Invalid Graph API version: ${graphApiVersion}`,
          { itemIndex },
        );
      }

      const url = `https://${hostUrl}/${graphApiVersion}/me`;
      const requestOptions: IHttpRequestOptions = {
        headers: {
          accept: 'application/json,text/*;q=0.99',
        },
        method: 'GET',
        url,
        qs: {
          fields:
            hostUrl === 'graph.instagram.com' ? 'id,username,account_type,media_count' : 'id,name',
        },
        json: true,
      };

      let response: IDataObject;
      try {
        response = (await requestWithLogging(
          ctx.logger,
          'operations/auth.ts:handleAuth',
          operation,
          requestOptions,
          () => ctx.helpers.httpRequestWithAuthentication.call(ctx, 'instagramApi', requestOptions),
        )) as IDataObject;

        if (!response || typeof response !== 'object') {
          throw new NodeOperationError(
            ctx.getNode(),
            `Invalid response format received from /me endpoint. Expected object, got: ${typeof response}. Response: ${JSON.stringify(response)}`,
            { itemIndex },
          );
        }
      } catch (error) {
        if (error instanceof NodeOperationError) {
          throw toNodeError(ctx.getNode(), error);
        }
        throw new NodeOperationError(
          ctx.getNode(),
          `Failed to get user profile from /me endpoint: ${error instanceof Error ? error.message : String(error)}`,
          { itemIndex },
        );
      }

      returnItems.push({ json: response, pairedItem: { item: itemIndex } });
      return;
    }

    throw new NodeOperationError(ctx.getNode(), `Unsupported auth operation: ${operation}`, {
      itemIndex,
    });
  } catch (error) {
    if (!ctx.continueOnFail()) {
      throw new NodeApiError(ctx.getNode(), error as JsonObject);
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
    ctx.logger.error('[operations/auth.ts:handleAuth] Operation failed', {
      statusCode: errorWithGraph.statusCode,
      apiResponse: errorWithGraph.response?.body ?? error,
    });
    returnItems.push({ json: { ...errorItem }, pairedItem: { item: itemIndex } });
    return;
  }

  return;
}
