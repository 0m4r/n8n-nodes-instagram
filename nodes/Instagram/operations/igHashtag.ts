import { requestWithLogging } from '../httpLogging';
import { fetchGraphApiPages } from '../pagination';
import type {
  IDataObject,
  IExecuteFunctions,
  IHttpRequestOptions,
  INodeExecutionData,
} from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';
import { getRequiredStringParameter, toErrorItem, toNodeError } from '../utils';

export async function handleIgHashtag(
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
    if (operation === 'search') {
      let hashtagName: string;
      try {
        hashtagName = ctx.getNodeParameter('hashtagName', itemIndex) as string;
        if (!hashtagName || typeof hashtagName !== 'string') {
          throw new NodeOperationError(
            ctx.getNode(),
            `Invalid or missing hashtag name parameter at item index ${itemIndex}. Hashtag name must be a non-empty string (without the # symbol).`,
            { itemIndex },
          );
        }
      } catch (error) {
        if (error instanceof NodeOperationError) {
          throw toNodeError(ctx.getNode(), error);
        }
        throw new NodeOperationError(
          ctx.getNode(),
          `Failed to get hashtag name parameter at item index ${itemIndex}: ${error instanceof Error ? error.message : String(error)}`,
          { itemIndex },
        );
      }

      const url = `https://${hostUrl}/${graphApiVersion}/ig_hashtag_search`;
      const requestOptions: IHttpRequestOptions = {
        headers: {
          accept: 'application/json,text/*;q=0.99',
        },
        method: 'GET',
        url,
        qs: {
          user_id: accountId,
          q: hashtagName,
        },
        json: true,
      };

      let response: IDataObject;
      try {
        response = (await requestWithLogging(
          ctx.logger,
          'operations/igHashtag.ts:handleIgHashtag',
          operation,
          requestOptions,
          () => ctx.helpers.httpRequestWithAuthentication.call(ctx, 'instagramApi', requestOptions),
        )) as IDataObject;

        if (!response || typeof response !== 'object') {
          throw new NodeOperationError(
            ctx.getNode(),
            `Invalid response format received from hashtag search API. Expected object, got: ${typeof response}. Response: ${JSON.stringify(response)}`,
            { itemIndex },
          );
        }
      } catch (error) {
        throw toNodeError(ctx.getNode(), error);
      }

      returnItems.push({ json: response, pairedItem: { item: itemIndex } });
      return;
    }

    if (operation === 'getRecentMedia' || operation === 'getTopMedia') {
      let hashtagId: string;
      let returnAll: boolean;
      let limit: number;

      try {
        hashtagId = ctx.getNodeParameter('hashtagId', itemIndex) as string;
        if (!hashtagId || typeof hashtagId !== 'string') {
          throw new NodeOperationError(
            ctx.getNode(),
            `Invalid or missing hashtag ID parameter at item index ${itemIndex}. Hashtag ID must be a non-empty string.`,
            { itemIndex },
          );
        }
      } catch (error) {
        if (error instanceof NodeOperationError) {
          throw toNodeError(ctx.getNode(), error);
        }
        throw new NodeOperationError(
          ctx.getNode(),
          `Failed to get hashtag ID parameter at item index ${itemIndex}: ${error instanceof Error ? error.message : String(error)}`,
          { itemIndex },
        );
      }

      try {
        returnAll = ctx.getNodeParameter('returnAll', itemIndex, false) as boolean;
        if (typeof returnAll !== 'boolean') {
          throw new NodeOperationError(
            ctx.getNode(),
            `Invalid returnAll parameter at item index ${itemIndex}. ReturnAll must be a boolean.`,
            { itemIndex },
          );
        }
      } catch (error) {
        if (error instanceof NodeOperationError) {
          throw toNodeError(ctx.getNode(), error);
        }
        throw new NodeOperationError(
          ctx.getNode(),
          `Failed to get returnAll parameter at item index ${itemIndex}: ${error instanceof Error ? error.message : String(error)}`,
          { itemIndex },
        );
      }

      try {
        limit = ctx.getNodeParameter('limit', itemIndex, 0) as number;
        if (typeof limit !== 'number' || limit < 0) {
          throw new NodeOperationError(
            ctx.getNode(),
            `Invalid limit parameter at item index ${itemIndex}. Limit must be a non-negative number.`,
            { itemIndex },
          );
        }
      } catch (error) {
        if (error instanceof NodeOperationError) {
          throw toNodeError(ctx.getNode(), error);
        }
        throw new NodeOperationError(
          ctx.getNode(),
          `Failed to get limit parameter at item index ${itemIndex}: ${error instanceof Error ? error.message : String(error)}`,
          { itemIndex },
        );
      }

      const edge = operation === 'getRecentMedia' ? 'recent_media' : 'top_media';
      const baseUrl = `https://${hostUrl}/${graphApiVersion}/${hashtagId}/${edge}`;

      const fields = [
        'id',
        'media_type',
        'media_url',
        'caption',
        'permalink',
        'timestamp',
        'comments_count',
        'like_count',
      ].join(',');

      const finalData = await fetchGraphApiPages(ctx, {
        baseUrl,
        fields,
        itemIndex,
        operation,
        pageSize: 50,
        query: { user_id: accountId },
        returnAll,
        limit,
        source: 'operations/igHashtag.ts:handleIgHashtag',
        responseLabel: `${edge} API`,
      });
      returnItems.push({ json: { data: finalData }, pairedItem: { item: itemIndex } });
      return;
    }

    throw new NodeOperationError(ctx.getNode(), `Unsupported IG Hashtag operation: ${operation}`, {
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
