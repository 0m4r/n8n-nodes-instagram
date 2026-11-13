import { requestWithLogging } from '../httpLogging';
import type {
  IDataObject,
  IExecuteFunctions,
  IHttpRequestOptions,
  INodeExecutionData,
} from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';
import { getRequiredStringParameter, toErrorItem, toNodeError } from '../utils';

export async function handleMessaging(
  ctx: IExecuteFunctions,
  _resource: string,
  operation: string,
  hostUrl: string,
  itemIndex: number,
  items: INodeExecutionData[],
  returnItems: INodeExecutionData[],
): Promise<void> {
  const graphApiVersion = getRequiredStringParameter(
    ctx,
    'graphApiVersion',
    itemIndex,
    'Graph API version',
    "Graph API version must be a non-empty string (e.g., 'v22.0').",
  );

  const accountId = getRequiredStringParameter(
    ctx,
    'node',
    itemIndex,
    'Instagram Account ID',
    'Account ID must be a non-empty string.',
    true,
  );

  try {
    if (operation === 'sendMessage') {
      let recipientId: string;
      let text: string;
      try {
        recipientId = ctx.getNodeParameter('recipientId', itemIndex) as string;
        if (!recipientId || typeof recipientId !== 'string') {
          throw new NodeOperationError(
            ctx.getNode(),
            `Invalid or missing recipient ID parameter at item index ${itemIndex}. Recipient ID must be a non-empty string.`,
            { itemIndex },
          );
        }
      } catch (error) {
        if (error instanceof NodeOperationError) {
          throw toNodeError(ctx.getNode(), error);
        }
        throw new NodeOperationError(
          ctx.getNode(),
          `Failed to get recipient ID parameter at item index ${itemIndex}: ${error instanceof Error ? error.message : String(error)}`,
          { itemIndex },
        );
      }

      try {
        text = ctx.getNodeParameter('messageText', itemIndex) as string;
        if (!text || typeof text !== 'string') {
          throw new NodeOperationError(
            ctx.getNode(),
            `Invalid or missing message text parameter at item index ${itemIndex}. Message text must be a non-empty string.`,
            { itemIndex },
          );
        }
      } catch (error) {
        if (error instanceof NodeOperationError) {
          throw toNodeError(ctx.getNode(), error);
        }
        throw new NodeOperationError(
          ctx.getNode(),
          `Failed to get message text parameter at item index ${itemIndex}: ${error instanceof Error ? error.message : String(error)}`,
          { itemIndex },
        );
      }

      // Get API endpoint from credentials to determine the correct host URL.
      // The Instagram Messaging API (Send Message + Send Private Reply) supports
      // both graph.instagram.com (Instagram Login) and graph.facebook.com
      // (Facebook Login), depending on the credential configuration.
      let hostUrl = 'graph.facebook.com'; // Default for messaging API backward compatibility
      try {
        const credentials = await ctx.getCredentials('instagramApi');
        if (credentials?.apiEndpoint && typeof credentials.apiEndpoint === 'string') {
          hostUrl = credentials.apiEndpoint;
        }
      } catch {
        // Use default if credentials can't be retrieved
      }

      const url = `https://${hostUrl}/${graphApiVersion}/${accountId}/messages`;

      const requestOptions: IHttpRequestOptions = {
        headers: {
          accept: 'application/json,text/*;q=0.99',
          'Content-Type': 'application/json',
        },
        method: 'POST',
        url,
        body: {
          recipient: {
            id: recipientId,
          },
          message: {
            text,
          },
        },
        json: true,
      };

      let response: IDataObject;
      try {
        response = (await requestWithLogging(
          ctx.logger,
          'operations/messaging.ts:handleMessaging',
          operation,
          requestOptions,
          () => ctx.helpers.httpRequestWithAuthentication.call(ctx, 'instagramApi', requestOptions),
        )) as IDataObject;

        if (!response || typeof response !== 'object') {
          throw new NodeOperationError(
            ctx.getNode(),
            `Invalid response format received from send message API. Expected object, got: ${typeof response}. Response: ${JSON.stringify(response)}`,
            { itemIndex },
          );
        }
      } catch (error) {
        ctx.logger.error('[operations/messaging.ts:handleMessaging] sendMessage error', {
          errorMessage: error instanceof Error ? error.message : String(error),
          accountId,
          recipientId,
          url,
        });
        throw toNodeError(ctx.getNode(), error);
      }

      returnItems.push({ json: response, pairedItem: { item: itemIndex } });
      return;
    }

    throw new NodeOperationError(ctx.getNode(), `Unsupported messaging operation: ${operation}`, {
      itemIndex,
    });
  } catch (error) {
    if (!ctx.continueOnFail()) {
      throw toNodeError(ctx.getNode(), error);
    }

    returnItems.push({ json: toErrorItem(error), pairedItem: { item: itemIndex } });
    return;
  }

  return;
}
