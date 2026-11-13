import { requestWithLogging } from '../httpLogging';
import type {
  IDataObject,
  IExecuteFunctions,
  IHttpRequestOptions,
  INodeExecutionData,
  JsonObject,
} from 'n8n-workflow';
import { NodeApiError, NodeOperationError, sleep } from 'n8n-workflow';
import { isMediaNotReadyError, waitForContainerReady } from '../containerPolling';
import { instagramResourceHandlers } from '../resources';
import { getRequiredStringParameter, toErrorItem, toNodeError } from '../utils';
import type { InstagramResourceType } from '../resources/types';

export async function handlePublish(
  ctx: IExecuteFunctions,
  resource: string,
  operation: string,
  hostUrl: string,
  itemIndex: number,
  items: INodeExecutionData[],
  returnItems: INodeExecutionData[],
): Promise<void> {
  if (operation !== 'publish') {
    throw new NodeOperationError(ctx.getNode(), `Unsupported operation: ${operation}`, {
      itemIndex,
    });
  }

  const handler = instagramResourceHandlers[resource as InstagramResourceType];
  if (!handler) {
    throw new NodeOperationError(
      ctx.getNode(),
      `Unsupported resource: ${resource}. Supported resources are: ${Object.keys(instagramResourceHandlers).join(', ')}.`,
      { itemIndex },
    );
  }

  let caption: string;
  let additionalFields: IDataObject;

  const accountId = getRequiredStringParameter(
    ctx,
    'node',
    itemIndex,
    'node (account ID)',
    'Node must be a non-empty string.',
    true,
    'node',
  );

  const graphApiVersion = getRequiredStringParameter(
    ctx,
    'graphApiVersion',
    itemIndex,
    'Graph API version',
    "Graph API version must be a non-empty string (e.g., 'v22.0').",
  );

  try {
    caption = ctx.getNodeParameter('caption', itemIndex, '') as string;
    if (typeof caption !== 'string') {
      throw new NodeOperationError(
        ctx.getNode(),
        `Invalid caption parameter at item index ${itemIndex}. Caption must be a string.`,
        { itemIndex },
      );
    }
  } catch (error) {
    if (error instanceof NodeOperationError) {
      throw toNodeError(ctx.getNode(), error);
    }
    throw new NodeOperationError(
      ctx.getNode(),
      `Failed to get caption parameter at item index ${itemIndex}: ${error instanceof Error ? error.message : String(error)}`,
      { itemIndex },
    );
  }

  try {
    additionalFields = ctx.getNodeParameter('additionalFields', itemIndex, {}) as IDataObject;
    if (!additionalFields || typeof additionalFields !== 'object') {
      throw new NodeOperationError(
        ctx.getNode(),
        `Invalid additional fields parameter at item index ${itemIndex}. Additional fields must be an object.`,
        { itemIndex },
      );
    }
  } catch (error) {
    if (error instanceof NodeOperationError) {
      throw toNodeError(ctx.getNode(), error);
    }
    throw new NodeOperationError(
      ctx.getNode(),
      `Failed to get additional fields parameter at item index ${itemIndex}: ${error instanceof Error ? error.message : String(error)}`,
      { itemIndex },
    );
  }
  const altText = resource === 'image' ? ((additionalFields.altText as string) ?? '') : '';
  const rawLocationId =
    resource === 'image' || resource === 'reels'
      ? (additionalFields.locationId as string | undefined)
      : undefined;
  const userTagsCollection = additionalFields.userTags as
    { tag?: Array<{ username: string; x?: number; y?: number }> } | undefined;
  const productTagsCollection =
    resource === 'image' || resource === 'reels'
      ? (additionalFields.productTags as
          { tag?: Array<{ product_id: string; x?: number; y?: number }> } | undefined)
      : undefined;
  const rawCollaborators =
    resource === 'image' || resource === 'reels'
      ? (additionalFields.collaborators as string | undefined)
      : undefined;

  // Graph host remains static; version is configurable by the user
  const httpRequestMethod = 'POST';

  // First request: Create media container
  const mediaUri = `https://${hostUrl}/${graphApiVersion}/${accountId}/media`;
  let mediaPayload: IDataObject;
  try {
    mediaPayload = handler.buildMediaPayload.call(ctx, itemIndex);
    if (!mediaPayload || typeof mediaPayload !== 'object') {
      throw new NodeOperationError(
        ctx.getNode(),
        `Invalid media payload returned from handler for resource '${resource}' at item index ${itemIndex}. Expected object, got: ${typeof mediaPayload}.`,
        { itemIndex },
      );
    }
  } catch (error) {
    if (error instanceof NodeOperationError) {
      throw toNodeError(ctx.getNode(), error);
    }
    throw new NodeOperationError(
      ctx.getNode(),
      `Failed to build media payload for resource '${resource}' at item index ${itemIndex}: ${error instanceof Error ? error.message : String(error)}`,
      { itemIndex },
    );
  }

  // Validate video/image URLs before making API call
  const videoUrl = mediaPayload.video_url as string | undefined;
  const imageUrl = mediaPayload.image_url as string | undefined;

  if (videoUrl) {
    const trimmedUrl = videoUrl.trim();
    if (!trimmedUrl) {
      throw new NodeOperationError(
        ctx.getNode(),
        `Video URL is empty for resource '${resource}' at item index ${itemIndex}. Please provide a valid video URL.`,
        { itemIndex },
      );
    }
    // Basic URL format validation using regex (to avoid globalThis restriction)
    const urlPattern = /^https?:\/\/.+/i;
    if (!urlPattern.test(trimmedUrl)) {
      throw new NodeOperationError(
        ctx.getNode(),
        `Invalid video URL format for resource '${resource}' at item index ${itemIndex}. URL must be a valid HTTP/HTTPS URL starting with http:// or https://. Provided URL: ${trimmedUrl.substring(0, 100)}${trimmedUrl.length > 100 ? '...' : ''}`,
        { itemIndex },
      );
    }
  }

  if (imageUrl) {
    const trimmedUrl = imageUrl.trim();
    if (!trimmedUrl) {
      throw new NodeOperationError(
        ctx.getNode(),
        `Image URL is empty for resource '${resource}' at item index ${itemIndex}. Please provide a valid image URL.`,
        { itemIndex },
      );
    }
    // Basic URL format validation using regex (to avoid globalThis restriction)
    const urlPattern = /^https?:\/\/.+/i;
    if (!urlPattern.test(trimmedUrl)) {
      throw new NodeOperationError(
        ctx.getNode(),
        `Invalid image URL format for resource '${resource}' at item index ${itemIndex}. URL must be a valid HTTP/HTTPS URL starting with http:// or https://. Provided URL: ${trimmedUrl.substring(0, 100)}${trimmedUrl.length > 100 ? '...' : ''}`,
        { itemIndex },
      );
    }
  }

  const mediaQs: IDataObject = { ...mediaPayload };

  if (resource !== 'stories' && caption.trim()) {
    mediaQs.caption = caption;
  }

  if (altText) {
    mediaQs.alt_text = altText;
  }
  const locationId = rawLocationId?.trim();
  if (locationId) {
    mediaQs.location_id = locationId;
  }
  if (
    userTagsCollection?.tag &&
    Array.isArray(userTagsCollection.tag) &&
    userTagsCollection.tag.length > 0
  ) {
    const userTags = userTagsCollection.tag
      .filter((tag) => tag.username)
      .map((tag) => {
        const tagObj: IDataObject = {
          username: tag.username,
        };
        if (
          (resource === 'image' || resource === 'stories') &&
          tag.x !== undefined &&
          tag.x !== null
        ) {
          tagObj.x = tag.x;
        }
        if (
          (resource === 'image' || resource === 'stories') &&
          tag.y !== undefined &&
          tag.y !== null
        ) {
          tagObj.y = tag.y;
        }
        return tagObj;
      });
    if (userTags.length > 0) {
      mediaQs.user_tags = JSON.stringify(userTags);
    }
  }
  if (
    productTagsCollection?.tag &&
    Array.isArray(productTagsCollection.tag) &&
    productTagsCollection.tag.length > 0
  ) {
    if (productTagsCollection.tag.length > 20) {
      throw new NodeOperationError(
        ctx.getNode(),
        'Meta supports up to 20 product tags on a feed image or Reel.',
        { itemIndex },
      );
    }
    const productTags = productTagsCollection.tag
      .filter((tag) => tag.product_id)
      .map((tag) => {
        const tagObj: IDataObject = {
          product_id: tag.product_id,
        };
        if (resource === 'image' && tag.x !== undefined && tag.x !== null) {
          tagObj.x = tag.x;
        }
        if (resource === 'image' && tag.y !== undefined && tag.y !== null) {
          tagObj.y = tag.y;
        }
        return tagObj;
      });
    if (productTags.length > 0) {
      mediaQs.product_tags = JSON.stringify(productTags);
    }
  }

  if (rawCollaborators) {
    const collaborators = rawCollaborators
      .split(',')
      .map((username) => username.trim().replace(/^@/, ''))
      .filter(Boolean);
    if (collaborators.length > 3) {
      throw new NodeOperationError(
        ctx.getNode(),
        'Meta supports up to 3 collaborators per Instagram post.',
        { itemIndex },
      );
    }
    if (collaborators.length > 0) {
      mediaQs.collaborators = JSON.stringify(collaborators);
    }
  }

  const graduationStrategy =
    resource === 'reels'
      ? (additionalFields.trialReelGraduationStrategy as string | undefined)
      : undefined;
  if (graduationStrategy) {
    mediaQs.trial_params = JSON.stringify({
      graduation_strategy: graduationStrategy,
    });
  }

  if (resource === 'reels') {
    const coverUrl = (additionalFields.coverUrl as string | undefined)?.trim();
    const audioName = (additionalFields.audioName as string | undefined)?.trim();
    const thumbOffset = additionalFields.thumbOffset as number | undefined;
    const shareToFeed = additionalFields.shareToFeed as boolean | undefined;
    if (coverUrl) mediaQs.cover_url = coverUrl;
    if (audioName) mediaQs.audio_name = audioName;
    if (typeof thumbOffset === 'number' && thumbOffset > 0) mediaQs.thumb_offset = thumbOffset;
    if (typeof shareToFeed === 'boolean') mediaQs.share_to_feed = shareToFeed;
  }

  const mediaRequestOptions: IHttpRequestOptions = {
    headers: {
      accept: 'application/json,text/*;q=0.99',
    },
    method: httpRequestMethod,
    url: mediaUri,
    qs: mediaQs,
    json: true,
  };

  let mediaResponse: IDataObject | string;
  try {
    mediaResponse = (await requestWithLogging(
      ctx.logger,
      'operations/publish.ts:handlePublish',
      operation,
      mediaRequestOptions,
      () =>
        ctx.helpers.httpRequestWithAuthentication.call(ctx, 'instagramApi', mediaRequestOptions),
    )) as IDataObject | string;
  } catch (error: unknown) {
    type ResponseErrorType = {
      statusCode?: number;
      response?: {
        body?: {
          error?: IDataObject;
        };
        headers?: Record<string, unknown>;
      };
      message?: string;
    };

    const err = error as ResponseErrorType;
    if (!ctx.continueOnFail()) {
      throw toNodeError(ctx.getNode(), error);
    }

    let errorItem: Record<string, unknown>;
    if (err.response !== undefined) {
      const graphApiErrors = err.response.body?.error ?? {};
      errorItem = {
        statusCode: err.statusCode,
        ...graphApiErrors,
        headers: err.response.headers,
      };
    } else {
      errorItem = toErrorItem(error);
    }
    returnItems.push({ json: errorItem as IDataObject, pairedItem: { item: itemIndex } });
    return;
  }

  if (typeof mediaResponse === 'string') {
    const responseStr = mediaResponse;
    if (!ctx.continueOnFail()) {
      throw new NodeOperationError(
        ctx.getNode(),
        `Media creation response body is not valid JSON. Received string response: ${responseStr.substring(0, 200)}${responseStr.length > 200 ? '...' : ''}`,
        { itemIndex },
      );
    }
    returnItems.push({ json: { message: responseStr }, pairedItem: { item: itemIndex } });
    return;
  }

  // Extract creation_id from first response
  const creationId = mediaResponse.id as string | undefined;
  if (!creationId || typeof creationId !== 'string') {
    // Check if response contains error information
    const responseData = mediaResponse as IDataObject;
    const errorObj = responseData.error;
    const errorMessage =
      errorObj && typeof errorObj === 'object' && !Array.isArray(errorObj)
        ? ((errorObj as IDataObject).message as string | undefined)
        : undefined;
    const errorCode =
      errorObj && typeof errorObj === 'object' && !Array.isArray(errorObj)
        ? ((errorObj as IDataObject).code as number | undefined)
        : undefined;

    if (!ctx.continueOnFail()) {
      if (errorObj && typeof errorObj === 'object' && !Array.isArray(errorObj)) {
        throw new NodeApiError(ctx.getNode(), responseData as JsonObject);
      }
      throw new NodeOperationError(
        ctx.getNode(),
        `Media creation response did not contain a valid id (creation_id). Response: ${JSON.stringify(mediaResponse)}`,
        { itemIndex },
      );
    }
    returnItems.push({
      json: {
        error: 'No creation_id in response',
        response: mediaResponse,
        resource,
        itemIndex,
        ...(errorMessage && { apiError: errorMessage }),
        ...(errorCode && { apiErrorCode: errorCode }),
      },
      pairedItem: { item: itemIndex },
    });
    return;
  }

  // Check if response indicates an error even though we got an ID
  const responseData = mediaResponse as IDataObject;
  const responseError = responseData.error;
  if (responseError && typeof responseError === 'object' && !Array.isArray(responseError)) {
    if (!ctx.continueOnFail()) {
      throw new NodeApiError(ctx.getNode(), responseData as JsonObject);
    }
  }

  // Wait until the container is ready before publishing
  let containerReadyResult;
  try {
    containerReadyResult = await waitForContainerReady(ctx, {
      creationId,
      hostUrl,
      graphApiVersion,
      itemIndex,
      pollIntervalMs: handler.pollIntervalMs,
      maxTotalTimeMs: 5 * 60 * 1000,
      maxPollAttempts: handler.maxPollAttempts,
    });
  } catch (error) {
    throw toNodeError(ctx.getNode(), error);
  }

  // Second request: Publish media
  const publishUri = `https://${hostUrl}/${graphApiVersion}/${accountId}/media_publish`;
  // const publishQs: IDataObject = {
  //   creation_id: creationId,
  // };
  const publishQs: IDataObject = { creation_id: creationId };

  const publishRequestOptions: IHttpRequestOptions = {
    headers: {
      accept: 'application/json,text/*;q=0.99',
    },
    method: httpRequestMethod,
    url: publishUri,
    qs: publishQs,
    json: true,
  };

  const publishRetryDelay = handler.publishRetryDelay;
  const publishMaxAttempts = handler.publishMaxAttempts;
  let publishResponse: IDataObject | string | undefined;
  let publishSucceeded = false;
  let publishFailedWithError = false;

  for (let attempt = 1; attempt <= publishMaxAttempts; attempt++) {
    try {
      publishResponse = (await requestWithLogging(
        ctx.logger,
        'operations/publish.ts:handlePublish',
        operation,
        publishRequestOptions,
        () =>
          ctx.helpers.httpRequestWithAuthentication.call(
            ctx,
            'instagramApi',
            publishRequestOptions,
          ),
      )) as IDataObject | string;
      publishSucceeded = true;
      break;
    } catch (error) {
      if (isMediaNotReadyError(error) && attempt < publishMaxAttempts) {
        await sleep(publishRetryDelay);
        continue;
      }

      if (!ctx.continueOnFail()) {
        throw toNodeError(ctx.getNode(), error);
      }

      let errorItem;
      type ErrorWithResponse = {
        response?: {
          body?: {
            error?: IDataObject;
          };
          headers?: IDataObject;
        };
        statusCode?: number;
      };
      const err = error as ErrorWithResponse;
      if (err.response !== undefined) {
        const graphApiErrors = err.response.body?.error ?? {};
        errorItem = {
          statusCode: err.statusCode,
          ...graphApiErrors,
          headers: err.response.headers,
          creation_id: creationId,
          note: 'Media was created but publishing failed',
        };
      } else {
        errorItem = {
          ...toErrorItem(error),
          creation_id: creationId,
          note: 'Media was created but publishing failed',
        };
      }
      returnItems.push({
        json: {
          ...errorItem,
          instagramPublishProgress: containerReadyResult,
        },
        pairedItem: { item: itemIndex },
      });
      publishFailedWithError = true;
      break;
    }
  }

  if (publishFailedWithError) {
    return;
  }

  if (!publishSucceeded || publishResponse === undefined) {
    throw new NodeOperationError(
      ctx.getNode(),
      `Failed to publish media after ${publishMaxAttempts} attempts due to container not being ready.`,
      { itemIndex },
    );
  }

  if (typeof publishResponse === 'string') {
    if (!ctx.continueOnFail()) {
      throw new NodeOperationError(
        ctx.getNode(),
        `Media publish response body is not valid JSON. Received string response: ${publishResponse.substring(0, 200)}${publishResponse.length > 200 ? '...' : ''}`,
        { itemIndex },
      );
    }
    returnItems.push({ json: { message: publishResponse }, pairedItem: { item: itemIndex } });
    return;
  }

  if (!publishResponse || typeof publishResponse !== 'object') {
    if (!ctx.continueOnFail()) {
      throw new NodeOperationError(
        ctx.getNode(),
        `Invalid publish response format. Expected object, got: ${typeof publishResponse}. Response: ${JSON.stringify(publishResponse)}`,
        { itemIndex },
      );
    }
    returnItems.push({
      json: { response: publishResponse },
      pairedItem: { item: itemIndex },
    });
    return;
  }

  // Return the publish response
  returnItems.push({ json: publishResponse as IDataObject, pairedItem: { item: itemIndex } });
}
