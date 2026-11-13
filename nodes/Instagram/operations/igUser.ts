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

export async function handleIgUser(
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
    if (operation === 'get') {
      const url = `https://${hostUrl}/${graphApiVersion}/${accountId}`;
      const requestOptions: IHttpRequestOptions = {
        headers: {
          accept: 'application/json,text/*;q=0.99',
        },
        method: 'GET',
        url,
        qs: {
          fields: [
            'id',
            'username',
            'name',
            'biography',
            'website',
            'media_count',
            'followers_count',
            'follows_count',
            'profile_picture_url',
          ].join(','),
        },
        json: true,
      };

      let response: IDataObject;
      try {
        response = (await requestWithLogging(
          ctx.logger,
          'operations/igUser.ts:handleIgUser',
          operation,
          requestOptions,
          () => ctx.helpers.httpRequestWithAuthentication.call(ctx, 'instagramApi', requestOptions),
        )) as IDataObject;

        if (!response || typeof response !== 'object') {
          throw new NodeOperationError(
            ctx.getNode(),
            `Invalid response format received from IG User API. Expected object, got: ${typeof response}. Response: ${JSON.stringify(response)}`,
            { itemIndex },
          );
        }
      } catch (error) {
        throw toNodeError(ctx.getNode(), error);
      }

      returnItems.push({ json: response, pairedItem: { item: itemIndex } });
      return;
    }

    if (operation === 'getMedia') {
      let returnAll: boolean;
      let limit: number;

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

      const baseUrl = `https://${hostUrl}/${graphApiVersion}/${accountId}/media`;
      const fields = [
        'id',
        'media_type',
        'media_url',
        'thumbnail_url',
        'caption',
        'permalink',
        'timestamp',
        'username',
      ].join(',');

      const finalData = await fetchGraphApiPages(ctx, {
        baseUrl,
        fields,
        itemIndex,
        operation,
        pageSize: 100,
        returnAll,
        limit,
        source: 'operations/igUser.ts:handleIgUser',
        responseLabel: 'IG User media API',
      });
      returnItems.push({ json: { data: finalData }, pairedItem: { item: itemIndex } });
      return;
    }

    throw new NodeOperationError(ctx.getNode(), `Unsupported IG User operation: ${operation}`, {
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
