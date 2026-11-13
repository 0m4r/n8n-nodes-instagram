import { requestWithLogging } from '../httpLogging';
import type {
  IDataObject,
  IExecuteFunctions,
  IHttpRequestOptions,
  INodeExecutionData,
} from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';
import { getRequiredStringParameter, toErrorItem, toNodeError } from '../utils';

export async function handleComments(
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

  try {
    if (operation === 'list') {
      let mediaId: string;
      try {
        mediaId = ctx.getNodeParameter('mediaId', itemIndex) as string;
        if (!mediaId || typeof mediaId !== 'string') {
          throw new NodeOperationError(
            ctx.getNode(),
            `Invalid or missing media ID parameter at item index ${itemIndex}. Media ID must be a non-empty string.`,
            { itemIndex },
          );
        }
      } catch (error) {
        if (error instanceof NodeOperationError) {
          throw toNodeError(ctx.getNode(), error);
        }
        throw new NodeOperationError(
          ctx.getNode(),
          `Failed to get media ID parameter at item index ${itemIndex}: ${error instanceof Error ? error.message : String(error)}`,
          { itemIndex },
        );
      }

      const url = `https://${hostUrl}/${graphApiVersion}/${mediaId}/comments`;
      const requestOptions: IHttpRequestOptions = {
        headers: {
          accept: 'application/json,text/*;q=0.99',
        },
        method: 'GET',
        url,
        json: true,
      };

      let response: IDataObject;
      try {
        response = (await requestWithLogging(
          ctx.logger,
          'operations/comments.ts:handleComments',
          operation,
          requestOptions,
          () => ctx.helpers.httpRequestWithAuthentication.call(ctx, 'instagramApi', requestOptions),
        )) as IDataObject;

        if (!response || typeof response !== 'object') {
          throw new NodeOperationError(
            ctx.getNode(),
            `Invalid response format received from comments list API. Expected object, got: ${typeof response}. Response: ${JSON.stringify(response)}`,
            { itemIndex },
          );
        }
      } catch (error) {
        throw toNodeError(ctx.getNode(), error);
      }

      returnItems.push({ json: response, pairedItem: { item: itemIndex } });
      return;
    }

    if (operation === 'hideComment' || operation === 'unhideComment') {
      let commentId: string;
      try {
        commentId = ctx.getNodeParameter('commentId', itemIndex) as string;
        if (!commentId || typeof commentId !== 'string') {
          throw new NodeOperationError(
            ctx.getNode(),
            `Invalid or missing comment ID parameter at item index ${itemIndex}. Comment ID must be a non-empty string.`,
            { itemIndex },
          );
        }
      } catch (error) {
        if (error instanceof NodeOperationError) {
          throw toNodeError(ctx.getNode(), error);
        }
        throw new NodeOperationError(
          ctx.getNode(),
          `Failed to get comment ID parameter at item index ${itemIndex}: ${error instanceof Error ? error.message : String(error)}`,
          { itemIndex },
        );
      }

      const hideValue = operation === 'hideComment';
      const url = `https://${hostUrl}/${graphApiVersion}/${commentId}`;

      const requestOptions: IHttpRequestOptions = {
        headers: {
          accept: 'application/json,text/*;q=0.99',
        },
        method: 'POST',
        url,
        qs: {
          hide: hideValue,
        },
        json: true,
      };

      let response: IDataObject;
      try {
        response = (await requestWithLogging(
          ctx.logger,
          'operations/comments.ts:handleComments',
          operation,
          requestOptions,
          () => ctx.helpers.httpRequestWithAuthentication.call(ctx, 'instagramApi', requestOptions),
        )) as IDataObject;

        if (!response || typeof response !== 'object') {
          throw new NodeOperationError(
            ctx.getNode(),
            `Invalid response format received from ${operation} API. Expected object, got: ${typeof response}. Response: ${JSON.stringify(response)}`,
            { itemIndex },
          );
        }
      } catch (error) {
        throw toNodeError(ctx.getNode(), error);
      }

      returnItems.push({ json: response, pairedItem: { item: itemIndex } });
      return;
    }

    if (operation === 'deleteComment') {
      let commentId: string;
      try {
        commentId = ctx.getNodeParameter('commentId', itemIndex) as string;
        if (!commentId || typeof commentId !== 'string') {
          throw new NodeOperationError(
            ctx.getNode(),
            `Invalid or missing comment ID parameter at item index ${itemIndex}. Comment ID must be a non-empty string.`,
            { itemIndex },
          );
        }
      } catch (error) {
        if (error instanceof NodeOperationError) {
          throw toNodeError(ctx.getNode(), error);
        }
        throw new NodeOperationError(
          ctx.getNode(),
          `Failed to get comment ID parameter at item index ${itemIndex}: ${error instanceof Error ? error.message : String(error)}`,
          { itemIndex },
        );
      }

      const url = `https://${hostUrl}/${graphApiVersion}/${commentId}`;

      const requestOptions: IHttpRequestOptions = {
        headers: {
          accept: 'application/json,text/*;q=0.99',
        },
        method: 'DELETE',
        url,
        json: true,
      };

      let response: IDataObject;
      try {
        response = (await requestWithLogging(
          ctx.logger,
          'operations/comments.ts:handleComments',
          operation,
          requestOptions,
          () => ctx.helpers.httpRequestWithAuthentication.call(ctx, 'instagramApi', requestOptions),
        )) as IDataObject;

        if (!response || typeof response !== 'object') {
          throw new NodeOperationError(
            ctx.getNode(),
            `Invalid response format received from delete comment API. Expected object, got: ${typeof response}. Response: ${JSON.stringify(response)}`,
            { itemIndex },
          );
        }
      } catch (error) {
        throw toNodeError(ctx.getNode(), error);
      }

      returnItems.push({ json: response, pairedItem: { item: itemIndex } });
      return;
    }

    if (operation === 'disableComments' || operation === 'enableComments') {
      let mediaId: string;
      try {
        mediaId = ctx.getNodeParameter('mediaId', itemIndex) as string;
        if (!mediaId || typeof mediaId !== 'string') {
          throw new NodeOperationError(
            ctx.getNode(),
            `Invalid or missing media ID parameter at item index ${itemIndex}. Media ID must be a non-empty string.`,
            { itemIndex },
          );
        }
      } catch (error) {
        if (error instanceof NodeOperationError) {
          throw toNodeError(ctx.getNode(), error);
        }
        throw new NodeOperationError(
          ctx.getNode(),
          `Failed to get media ID parameter at item index ${itemIndex}: ${error instanceof Error ? error.message : String(error)}`,
          { itemIndex },
        );
      }

      const commentEnabled = operation === 'enableComments';
      const url = `https://${hostUrl}/${graphApiVersion}/${mediaId}`;

      const requestOptions: IHttpRequestOptions = {
        headers: {
          accept: 'application/json,text/*;q=0.99',
        },
        method: 'POST',
        url,
        qs: {
          comment_enabled: commentEnabled,
        },
        json: true,
      };

      let response: IDataObject;
      try {
        response = (await requestWithLogging(
          ctx.logger,
          'operations/comments.ts:handleComments',
          operation,
          requestOptions,
          () => ctx.helpers.httpRequestWithAuthentication.call(ctx, 'instagramApi', requestOptions),
        )) as IDataObject;

        if (!response || typeof response !== 'object') {
          throw new NodeOperationError(
            ctx.getNode(),
            `Invalid response format received from ${operation} API. Expected object, got: ${typeof response}. Response: ${JSON.stringify(response)}`,
            { itemIndex },
          );
        }
      } catch (error) {
        throw toNodeError(ctx.getNode(), error);
      }

      returnItems.push({ json: response, pairedItem: { item: itemIndex } });
      return;
    }

    if (operation === 'sendPrivateReply') {
      let commentId: string;
      let text: string;

      const accountId = getRequiredStringParameter(
        ctx,
        'node',
        itemIndex,
        'Instagram Account ID',
        'Account ID must be a non-empty string.',
        true,
      );

      try {
        commentId = ctx.getNodeParameter('commentId', itemIndex) as string;
        if (!commentId || typeof commentId !== 'string') {
          throw new NodeOperationError(
            ctx.getNode(),
            `Invalid or missing comment ID parameter at item index ${itemIndex}. Comment ID must be a non-empty string.`,
            { itemIndex },
          );
        }
      } catch (error) {
        if (error instanceof NodeOperationError) {
          throw toNodeError(ctx.getNode(), error);
        }
        throw new NodeOperationError(
          ctx.getNode(),
          `Failed to get comment ID parameter at item index ${itemIndex}: ${error instanceof Error ? error.message : String(error)}`,
          { itemIndex },
        );
      }

      try {
        text = ctx.getNodeParameter('privateReplyText', itemIndex) as string;
        if (!text || typeof text !== 'string') {
          throw new NodeOperationError(
            ctx.getNode(),
            `Invalid or missing private reply text parameter at item index ${itemIndex}. Private reply text must be a non-empty string.`,
            { itemIndex },
          );
        }
      } catch (error) {
        if (error instanceof NodeOperationError) {
          throw toNodeError(ctx.getNode(), error);
        }
        throw new NodeOperationError(
          ctx.getNode(),
          `Failed to get private reply text parameter at item index ${itemIndex}: ${error instanceof Error ? error.message : String(error)}`,
          { itemIndex },
        );
      }

      // NOTE: The Instagram Messaging API (including private replies to
      // comments) is only available on graph.facebook.com, regardless of
      // the credential's API Endpoint setting. See:
      // https://developers.facebook.com/documentation/instagram-platform/private-replies
      //
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
            comment_id: commentId,
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
          'operations/comments.ts:handleComments',
          operation,
          requestOptions,
          () => ctx.helpers.httpRequestWithAuthentication.call(ctx, 'instagramApi', requestOptions),
        )) as IDataObject;

        if (!response || typeof response !== 'object') {
          throw new NodeOperationError(
            ctx.getNode(),
            `Invalid response format received from send private reply API. Expected object, got: ${typeof response}. Response: ${JSON.stringify(response)}`,
            { itemIndex },
          );
        }
      } catch (error) {
        ctx.logger.error('[operations/comments.ts:handleComments] sendPrivateReply error', {
          errorMessage: error instanceof Error ? error.message : String(error),
          accountId,
          commentId,
        });
        throw toNodeError(ctx.getNode(), error);
      }

      returnItems.push({ json: response, pairedItem: { item: itemIndex } });
      return;
    }

    throw new NodeOperationError(ctx.getNode(), `Unsupported comments operation: ${operation}`, {
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
