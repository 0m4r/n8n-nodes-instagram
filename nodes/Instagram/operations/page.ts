import { requestWithLogging } from '../httpLogging';
import type {
  IDataObject,
  IExecuteFunctions,
  IHttpRequestOptions,
  INodeExecutionData,
} from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';
import { toNodeError } from '../utils';

export async function handlePage(
  ctx: IExecuteFunctions,
  _resource: string,
  operation: string,
  hostUrl: string,
  itemIndex: number,
  items: INodeExecutionData[],
  returnItems: INodeExecutionData[],
): Promise<void> {
  let graphApiVersion: string;
  let pageId: string;
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
    pageId = ctx.getNodeParameter('pageId', itemIndex) as string;
    if (!pageId || typeof pageId !== 'string') {
      throw new NodeOperationError(
        ctx.getNode(),
        `Invalid or missing page ID parameter at item index ${itemIndex}. Page ID must be a non-empty string.`,
        { itemIndex },
      );
    }
  } catch (error) {
    if (error instanceof NodeOperationError) {
      throw toNodeError(ctx.getNode(), error);
    }
    throw new NodeOperationError(
      ctx.getNode(),
      `Failed to get page ID parameter at item index ${itemIndex}: ${error instanceof Error ? error.message : String(error)}`,
      { itemIndex },
    );
  }

  try {
    if (operation === 'getInstagramAccount') {
      const url = `https://${hostUrl}/${graphApiVersion}/${pageId}`;
      const requestOptions: IHttpRequestOptions = {
        headers: {
          accept: 'application/json,text/*;q=0.99',
        },
        method: 'GET',
        url,
        qs: {
          fields: 'instagram_business_account',
        },
        json: true,
      };

      let response: IDataObject;
      try {
        response = (await requestWithLogging(
          ctx.logger,
          'operations/page.ts:handlePage',
          operation,
          requestOptions,
          () => ctx.helpers.httpRequestWithAuthentication.call(ctx, 'instagramApi', requestOptions),
        )) as IDataObject;

        if (!response || typeof response !== 'object') {
          throw new NodeOperationError(
            ctx.getNode(),
            `Invalid response format received from page API. Expected object, got: ${typeof response}. Response: ${JSON.stringify(response)}`,
            { itemIndex },
          );
        }
      } catch (error) {
        throw toNodeError(ctx.getNode(), error);
      }

      returnItems.push({ json: response, pairedItem: { item: itemIndex } });
      return;
    }

    throw new NodeOperationError(ctx.getNode(), `Unsupported page operation: ${operation}`, {
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
