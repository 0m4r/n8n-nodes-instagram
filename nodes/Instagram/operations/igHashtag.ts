import { requestWithLogging } from '../httpLogging';
import type {
  IDataObject,
  IExecuteFunctions,
  IHttpRequestOptions,
  INodeExecutionData,
} from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';
import { toNodeError } from '../utils';

export async function handleIgHashtag(
  ctx: IExecuteFunctions,
  _resource: string,
  operation: string,
  hostUrl: string,
  itemIndex: number,
  items: INodeExecutionData[],
  returnItems: INodeExecutionData[],
): Promise<void> {
  let graphApiVersion: string;
  let accountId: string;
  try {
    // Get API version from node parameter
    graphApiVersion = ctx.getNodeParameter('graphApiVersion', itemIndex) as string;
    if (!graphApiVersion || typeof graphApiVersion !== 'string') {
      throw new NodeOperationError(
        ctx.getNode(),
        `Invalid or missing Graph API version parameter at item index ${itemIndex}. Graph API version must be a non-empty string (e.g., 'v22.0').`,
        { itemIndex },
      );
    }
  } catch (error) {
    if (error instanceof NodeOperationError) {
      throw toNodeError(ctx.getNode(), error);
    }
    throw new NodeOperationError(
      ctx.getNode(),
      `Failed to get Graph API version parameter at item index ${itemIndex}: ${error instanceof Error ? error.message : String(error)}`,
      { itemIndex },
    );
  }

  try {
    const nodeParam = ctx.getNodeParameter('node', itemIndex) as string | { value: string };

    // Handle both old string format and new resourceLocator format

    accountId = typeof nodeParam === 'string' ? nodeParam : nodeParam.value;
    if (!accountId || typeof accountId !== 'string') {
      throw new NodeOperationError(
        ctx.getNode(),
        `Invalid or missing Instagram Account ID parameter at item index ${itemIndex}. Account ID must be a non-empty string.`,
        { itemIndex },
      );
    }
  } catch (error) {
    if (error instanceof NodeOperationError) {
      throw toNodeError(ctx.getNode(), error);
    }
    throw new NodeOperationError(
      ctx.getNode(),
      `Failed to get Instagram Account ID parameter at item index ${itemIndex}: ${error instanceof Error ? error.message : String(error)}`,
      { itemIndex },
    );
  }

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

      const accumulated: IDataObject[] = [];
      let after: string | undefined;

      // Basic safety limit to avoid infinite loops when returnAll is true
      const hardCap = returnAll ? 5000 : limit;

      let hasMore = true;
      let pageNumber = 0;
      while (hasMore) {
        pageNumber++;
        const remaining = returnAll ? undefined : hardCap - accumulated.length;
        const pageLimit = remaining !== undefined ? Math.min(remaining, 50) : 50;

        const qs: IDataObject = {
          user_id: accountId,
          fields,
          limit: pageLimit,
        };

        if (after) {
          qs.after = after;
        }

        const requestOptions: IHttpRequestOptions = {
          headers: {
            accept: 'application/json,text/*;q=0.99',
          },
          method: 'GET',
          url: baseUrl,
          qs,
          json: true,
        };

        let response: IDataObject;
        try {
          response = (await requestWithLogging(
            ctx.logger,
            'operations/igHashtag.ts:handleIgHashtag',
            operation,
            requestOptions,
            () =>
              ctx.helpers.httpRequestWithAuthentication.call(ctx, 'instagramApi', requestOptions),
          )) as IDataObject;

          if (!response || typeof response !== 'object') {
            throw new NodeOperationError(
              ctx.getNode(),
              `Invalid response format received from ${edge} API at page ${pageNumber}. Expected object, got: ${typeof response}. Response: ${JSON.stringify(response)}`,
              { itemIndex },
            );
          }
        } catch (error) {
          throw toNodeError(ctx.getNode(), error);
        }

        const pageData = (response.data as IDataObject[] | undefined) ?? [];
        if (!Array.isArray(pageData)) {
          throw new NodeOperationError(
            ctx.getNode(),
            `Invalid data format in response from ${edge} API at page ${pageNumber}. Expected array, got: ${typeof pageData}. Response: ${JSON.stringify(response)}`,
            { itemIndex },
          );
        }
        accumulated.push(...pageData);

        const paging = response.paging as
          | {
              cursors?: { after?: string };
            }
          | undefined;
        after = paging?.cursors?.after;

        if ((!returnAll && accumulated.length >= hardCap) || !after) {
          hasMore = false;
        }
      }

      const finalData = !returnAll && hardCap > 0 ? accumulated.slice(0, hardCap) : accumulated;

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
    return;
  }

  return;
}
