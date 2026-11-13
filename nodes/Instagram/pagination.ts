import type { IDataObject, IExecuteFunctions, IHttpRequestOptions } from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';
import { requestWithLogging } from './httpLogging';
import { toNodeError } from './utils';

type FetchGraphPagesOptions = {
  baseUrl: string;
  fields: string;
  itemIndex: number;
  operation: string;
  pageSize: number;
  query?: IDataObject;
  returnAll: boolean;
  limit: number;
  source: string;
  responseLabel: string;
};

export const fetchGraphApiPages = async (
  ctx: IExecuteFunctions,
  options: FetchGraphPagesOptions,
): Promise<IDataObject[]> => {
  const { baseUrl, fields, itemIndex, operation, pageSize, query = {}, returnAll, limit } = options;
  const hardCap = returnAll ? 5000 : limit;
  const accumulated: IDataObject[] = [];
  let after: string | undefined;
  let pageNumber = 0;

  while (returnAll || accumulated.length < hardCap || pageNumber === 0) {
    pageNumber++;
    const remaining = returnAll ? undefined : hardCap - accumulated.length;
    const pageLimit = remaining !== undefined ? Math.min(remaining, pageSize) : pageSize;
    const requestOptions: IHttpRequestOptions = {
      headers: { accept: 'application/json,text/*;q=0.99' },
      method: 'GET',
      url: baseUrl,
      qs: {
        ...query,
        fields,
        limit: pageLimit,
        ...(after ? { after } : {}),
      },
      json: true,
    };

    let response: IDataObject;
    try {
      response = (await requestWithLogging(
        ctx.logger,
        options.source,
        operation,
        requestOptions,
        () => ctx.helpers.httpRequestWithAuthentication.call(ctx, 'instagramApi', requestOptions),
      )) as IDataObject;

      if (!response || typeof response !== 'object') {
        throw new NodeOperationError(
          ctx.getNode(),
          `Invalid response format received from ${options.responseLabel} at page ${pageNumber}. Expected object, got: ${typeof response}. Response: ${JSON.stringify(response)}`,
          { itemIndex },
        );
      }
    } catch (error) {
      throw toNodeError(ctx.getNode(), error);
    }

    const pageData = response.data ?? [];
    if (!Array.isArray(pageData)) {
      throw new NodeOperationError(
        ctx.getNode(),
        `Invalid data format in response from ${options.responseLabel} at page ${pageNumber}. Expected array, got: ${typeof pageData}. Response: ${JSON.stringify(response)}`,
        { itemIndex },
      );
    }
    accumulated.push(...(pageData as IDataObject[]));

    const paging = response.paging as { cursors?: { after?: string } } | undefined;
    after = paging?.cursors?.after;
    if (!after || (!returnAll && accumulated.length >= hardCap)) break;
  }

  return !returnAll && hardCap > 0 ? accumulated.slice(0, hardCap) : accumulated;
};
