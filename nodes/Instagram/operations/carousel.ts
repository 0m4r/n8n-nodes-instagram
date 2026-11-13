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
import { waitForContainerReady } from '../containerPolling';

export async function handleCarousel(
  ctx: IExecuteFunctions,
  _resource: string,
  operation: string,
  hostUrl: string,
  itemIndex: number,
  items: INodeExecutionData[],
  returnItems: INodeExecutionData[],
): Promise<void> {
  try {
    let node: string;
    let graphApiVersion: string;
    let caption: string;
    let carouselMedia: {
      mediaItem?: Array<{
        mediaType: string;
        imageUrl?: string;
        videoUrl?: string;
        altText?: string;
        userTags?: { tag?: Array<{ username: string; x?: number; y?: number }> };
        productTags?: { tag?: Array<{ product_id: string; x?: number; y?: number }> };
      }>;
    };

    try {
      const nodeParam = ctx.getNodeParameter('node', itemIndex) as string | { value: string };

      // Handle both old string format and new resourceLocator format

      node = typeof nodeParam === 'string' ? nodeParam : nodeParam.value;
      if (!node || typeof node !== 'string') {
        throw new NodeOperationError(
          ctx.getNode(),
          `Invalid or missing node (account ID) parameter at item index ${itemIndex}. Node must be a non-empty string.`,
          { itemIndex },
        );
      }
    } catch (error) {
      if (error instanceof NodeOperationError) {
        throw toNodeError(ctx.getNode(), error);
      }
      throw new NodeOperationError(
        ctx.getNode(),
        `Failed to get node parameter at item index ${itemIndex}: ${error instanceof Error ? error.message : String(error)}`,
        { itemIndex },
      );
    }

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

    const carouselInputMode = ctx.getNodeParameter(
      'carouselInputMode',
      itemIndex,
      'manual',
    ) as string;

    const resolveFieldPath = (source: IDataObject, path: string) => {
      if (!path) return undefined;
      const parts = path.split('.');
      let current: unknown = source;
      for (const part of parts) {
        if (current == null || typeof current !== 'object') {
          return undefined;
        }
        current = (current as IDataObject)[part];
      }
      return current;
    };

    if (carouselInputMode === 'fromField') {
      const fieldName = ctx.getNodeParameter('carouselMediaArrayField', itemIndex) as string;
      if (!fieldName || typeof fieldName !== 'string') {
        throw new NodeOperationError(
          ctx.getNode(),
          `Invalid carousel media array field name at item index ${itemIndex}. Field name must be a non-empty string.`,
          { itemIndex },
        );
      }

      const mediaTypeMode = ctx.getNodeParameter(
        'carouselMediaArrayType',
        itemIndex,
        'auto',
      ) as string;

      const itemJson = items[itemIndex]?.json as IDataObject;
      const rawArray = resolveFieldPath(itemJson, fieldName);

      if (!Array.isArray(rawArray)) {
        throw new NodeOperationError(
          ctx.getNode(),
          `Invalid carousel media array at item index ${itemIndex}. The field "${fieldName}" must contain an array.`,
          { itemIndex },
        );
      }

      const toMediaItem = (entry: unknown, index: number) => {
        const label = `carousel media array item at index ${index}`;
        let url: string | undefined;
        let mediaType: 'image' | 'video';

        const decideTypeFromUrl = (candidateUrl: string): 'image' | 'video' => {
          const lower = candidateUrl.toLowerCase();
          const videoExtPattern = /\.(mp4|mov|m4v|webm)$/;
          if (videoExtPattern.test(lower)) return 'video';
          return 'image';
        };

        if (typeof entry === 'string') {
          url = entry;
          if (!url) {
            throw new NodeOperationError(
              ctx.getNode(),
              `Empty URL in ${label}. URLs must be non-empty strings.`,
              { itemIndex },
            );
          }

          if (mediaTypeMode === 'image' || mediaTypeMode === 'video') {
            mediaType = mediaTypeMode;
          } else {
            mediaType = decideTypeFromUrl(url);
          }
        } else if (entry && typeof entry === 'object') {
          const obj = entry as IDataObject;
          const candidateUrl = (obj.url ?? obj.src ?? obj.imageUrl ?? obj.videoUrl) as
            string | undefined;

          if (!candidateUrl || typeof candidateUrl !== 'string') {
            throw new NodeOperationError(
              ctx.getNode(),
              `Missing or invalid URL in ${label}. Expected a property like "url", "src", "imageUrl", or "videoUrl".`,
              { itemIndex },
            );
          }

          url = candidateUrl;

          const explicitType = String(obj.mediaType ?? obj.type ?? '').toLowerCase();
          const isExplicitVideo = explicitType === 'video';
          const isExplicitImage = explicitType === 'image';

          if (mediaTypeMode === 'image' || mediaTypeMode === 'video') {
            mediaType = mediaTypeMode;
          } else if (isExplicitVideo || isExplicitImage) {
            mediaType = isExplicitVideo ? 'video' : 'image';
          } else {
            mediaType = decideTypeFromUrl(url);
          }
        } else {
          throw new NodeOperationError(
            ctx.getNode(),
            `Unsupported entry in ${label}. Each item must be either a string URL or an object containing a URL.`,
            { itemIndex },
          );
        }

        if (mediaType === 'video') {
          return {
            mediaType: 'video',
            videoUrl: url,
            productTags: (entry as IDataObject)?.productTags as
              | { tag?: Array<{ product_id: string; x?: number; y?: number }> }
              | undefined,
          };
        }

        return {
          mediaType: 'image',
          imageUrl: url,
          altText: typeof (entry as IDataObject)?.altText === 'string'
            ? ((entry as IDataObject).altText as string)
            : undefined,
          userTags: (entry as IDataObject)?.userTags as
            | { tag?: Array<{ username: string; x?: number; y?: number }> }
            | undefined,
          productTags: (entry as IDataObject)?.productTags as
            | { tag?: Array<{ product_id: string; x?: number; y?: number }> }
            | undefined,
        };
      };

      const mediaItemArray = rawArray.map((entry, index) => toMediaItem(entry, index));

      carouselMedia = {
        mediaItem: mediaItemArray,
      };
    } else {
      try {
        carouselMedia = ctx.getNodeParameter('carouselMedia', itemIndex, {
          mediaItem: [],
        }) as {
          mediaItem?: Array<{
            mediaType: string;
            imageUrl?: string;
            videoUrl?: string;
            altText?: string;
            userTags?: { tag?: Array<{ username: string; x?: number; y?: number }> };
            productTags?: { tag?: Array<{ product_id: string; x?: number; y?: number }> };
          }>;
        };
        if (!carouselMedia || typeof carouselMedia !== 'object') {
          throw new NodeOperationError(
            ctx.getNode(),
            `Invalid carousel media parameter at item index ${itemIndex}. Carousel media must be an object.`,
            { itemIndex },
          );
        }
      } catch (error) {
        if (error instanceof NodeOperationError) {
          throw toNodeError(ctx.getNode(), error);
        }
        throw new NodeOperationError(
          ctx.getNode(),
          `Failed to get carousel media parameter at item index ${itemIndex}: ${
            error instanceof Error ? error.message : String(error)
          }`,
          { itemIndex },
        );
      }
    }

    const mediaItems = carouselMedia?.mediaItem ?? [];
    if (!Array.isArray(mediaItems)) {
      throw new NodeOperationError(
        ctx.getNode(),
        `Invalid carousel media items format at item index ${itemIndex}. Media items must be an array.`,
        { itemIndex },
      );
    }

    if (mediaItems.length < 2 || mediaItems.length > 10) {
      throw new NodeOperationError(
        ctx.getNode(),
        `Carousel must have between 2 and 10 media items. Found ${mediaItems.length} items at item index ${itemIndex}.`,
        { itemIndex },
      );
    }

    // Simplified media item processing
    const childIds: string[] = [];
    let totalProductTagCount = 0;
    const mediaUri = `https://${hostUrl}/${graphApiVersion}/${node}/media`;

    for (let i = 0; i < mediaItems.length; i++) {
      const item = mediaItems[i];
      if (!item || typeof item !== 'object') {
        throw new NodeOperationError(
          ctx.getNode(),
          `Invalid carousel media item at index ${i} at item index ${itemIndex}.`,
          { itemIndex },
        );
      }

      // Validate media type
      if (!item.mediaType || typeof item.mediaType !== 'string') {
        throw new NodeOperationError(
          ctx.getNode(),
          `Carousel item ${i + 1}: Media type is required and must be 'image' or 'video'.`,
          { itemIndex },
        );
      }
      if (item.mediaType !== 'image' && item.mediaType !== 'video') {
        throw new NodeOperationError(
          ctx.getNode(),
          `Carousel item ${i + 1}: Invalid media type '${item.mediaType}'. Must be 'image' or 'video'.`,
          { itemIndex },
        );
      }

      // Get URL based on media type
      const url =
        item.mediaType === 'video' ? (item.videoUrl ?? '').trim() : (item.imageUrl ?? '').trim();

      if (!url || typeof url !== 'string') {
        throw new NodeOperationError(
          ctx.getNode(),
          `Carousel item ${i + 1}: ${item.mediaType === 'video' ? 'Video' : 'Image'} URL is required and must be a non-empty string.`,
          { itemIndex },
        );
      }

      // Create child container
      const childQs: IDataObject =
        item.mediaType === 'video'
          ? { media_type: 'VIDEO', video_url: url, is_carousel_item: true }
          : { image_url: url, is_carousel_item: true };

      if (item.mediaType === 'image' && item.altText?.trim()) {
        childQs.alt_text = item.altText.trim();
      }

      const userTags = item.mediaType === 'image' ? item.userTags?.tag ?? [] : [];
      if (userTags.length > 0) {
        childQs.user_tags = JSON.stringify(
          userTags
            .filter((tag) => tag.username)
            .map((tag) => ({
              username: tag.username.trim().replace(/^@/, ''),
              ...(tag.x !== undefined && tag.x !== null ? { x: tag.x } : {}),
              ...(tag.y !== undefined && tag.y !== null ? { y: tag.y } : {}),
            })),
        );
      }

      const productTags = item.productTags?.tag ?? [];
      if (productTags.length > 5) {
        throw new NodeOperationError(
          ctx.getNode(),
          `Carousel item ${i + 1}: Meta supports up to 5 product tags per carousel slide.`,
          { itemIndex },
        );
      }
      totalProductTagCount += productTags.filter((tag) => tag.product_id).length;
      if (totalProductTagCount > 20) {
        throw new NodeOperationError(
          ctx.getNode(),
          'Meta supports up to 20 product tags total per carousel.',
          { itemIndex },
        );
      }
      if (productTags.length > 0) {
        const formattedProductTags = productTags
          .filter((tag) => tag.product_id)
          .map((tag) => ({
            product_id: tag.product_id,
            ...(item.mediaType === 'image' && tag.x !== undefined && tag.x !== null
              ? { x: tag.x }
              : {}),
            ...(item.mediaType === 'image' && tag.y !== undefined && tag.y !== null
              ? { y: tag.y }
              : {}),
          }));
        if (formattedProductTags.length > 0) {
          childQs.product_tags = JSON.stringify(formattedProductTags);
        }
      }

      const childRequestOptions: IHttpRequestOptions = {
        headers: { accept: 'application/json,text/*;q=0.99' },
        method: 'POST',
        url: mediaUri,
        qs: childQs,
        json: true,
      };

      try {
        const childResponse = await requestWithLogging(
          ctx.logger,
          'operations/carousel.ts:handleCarousel',
          operation,
          childRequestOptions,
          () =>
            ctx.helpers.httpRequestWithAuthentication.call(
              ctx,
              'instagramApi',
              childRequestOptions,
            ),
        );

        const childId = childResponse.id as string | undefined;
        if (!childId || typeof childId !== 'string') {
          if (childResponse.error && typeof childResponse.error === 'object') {
            throw new NodeApiError(ctx.getNode(), childResponse as JsonObject);
          }
          throw new NodeOperationError(
            ctx.getNode(),
            `Carousel item ${i + 1}: Container creation did not return a valid ID.`,
            { itemIndex },
          );
        }

        // Wait for container to be ready
        await waitForContainerReady(ctx, {
          creationId: childId,
          hostUrl,
          graphApiVersion,
          itemIndex,
          pollIntervalMs: 60_000,
          maxTotalTimeMs: 5 * 60 * 1000,
        });

        childIds.push(childId);
      } catch (error) {
        throw toNodeError(ctx.getNode(), error);
      }
    }

    // Create carousel container
    const carouselQs: IDataObject = {
      media_type: 'CAROUSEL',
      children: childIds.join(','),
    };

    const additionalFields = ctx.getNodeParameter(
      'additionalFields',
      itemIndex,
      {},
    ) as IDataObject;

    if (caption.trim()) {
      carouselQs.caption = caption;
    }

    const locationId = (
      additionalFields.locationId as string | undefined
    )?.trim();
    if (locationId) {
      carouselQs.location_id = locationId;
    }

    const shareToFeed = additionalFields.shareToFeed as boolean | undefined;
    if (typeof shareToFeed === 'boolean') {
      carouselQs.share_to_feed = shareToFeed;
    }

    const rawCollaborators = additionalFields.collaborators as string | undefined;
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
        carouselQs.collaborators = JSON.stringify(collaborators);
      }
    }

    const carouselRequestOptions: IHttpRequestOptions = {
      headers: { accept: 'application/json,text/*;q=0.99' },
      method: 'POST',
      url: mediaUri,
      qs: carouselQs,
      json: true,
    };

    let carouselResponse: IDataObject;
    try {
      carouselResponse = await requestWithLogging(
        ctx.logger,
        'operations/carousel.ts:handleCarousel',
        operation,
        carouselRequestOptions,
        () =>
          ctx.helpers.httpRequestWithAuthentication.call(
            ctx,
            'instagramApi',
            carouselRequestOptions,
          ),
      );
    } catch (error) {
      throw toNodeError(ctx.getNode(), error);
    }

    const carouselContainerId = carouselResponse.id as string | undefined;
    if (!carouselContainerId || typeof carouselContainerId !== 'string') {
      if (carouselResponse.error && typeof carouselResponse.error === 'object') {
        throw new NodeApiError(ctx.getNode(), carouselResponse as JsonObject);
      }
      throw new NodeOperationError(
        ctx.getNode(),
        `Carousel container creation did not return a valid ID.`,
        { itemIndex },
      );
    }

    // Wait for carousel container to be ready
    let containerReadyResult;
    try {
      containerReadyResult = await waitForContainerReady(ctx, {
        creationId: carouselContainerId,
        hostUrl,
        graphApiVersion,
        itemIndex,
        pollIntervalMs: 60_000,
        maxTotalTimeMs: 5 * 60 * 1000,
      });
    } catch (error) {
      throw toNodeError(ctx.getNode(), error);
    }

    // Publish carousel
    const publishUri = `https://${hostUrl}/${graphApiVersion}/${node}/media_publish`;
    const publishQuery: IDataObject = { creation_id: carouselContainerId };
    const publishOptions: IHttpRequestOptions = {
      headers: { accept: 'application/json,text/*;q=0.99' },
      method: 'POST',
      url: publishUri,
      qs: { ...publishQuery },
      json: true,
    };

    let publishResponse: IDataObject;
    try {
      publishResponse = await requestWithLogging(
        ctx.logger,
        'operations/carousel.ts:handleCarousel',
        operation,
        publishOptions,
        () => ctx.helpers.httpRequestWithAuthentication.call(ctx, 'instagramApi', publishOptions),
      );
    } catch (error) {
      throw toNodeError(ctx.getNode(), error);
    }

    returnItems.push({
      json: {
        ...publishResponse,
        instagramPublishProgress: containerReadyResult,
      },
      pairedItem: { item: itemIndex },
    });
    return;
  } catch (error) {
    ctx.logger.error(
      `[operations/carousel.ts:handleCarousel] Operation failed: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );

    if (!ctx.continueOnFail()) {
      throw toNodeError(ctx.getNode(), error);
    }
    type GraphError = {
      message?: string;
      code?: number;
      error_subcode?: number;
    };
    type ErrorWithGraph = {
      response?: {
        body?: { error?: GraphError };
        headers?: IDataObject;
      };
      statusCode?: number;
    };
    const errorWithGraph = error as ErrorWithGraph;
    const errorItem =
      errorWithGraph.response !== undefined
        ? {
            statusCode: errorWithGraph.statusCode,
            ...(errorWithGraph.response.body?.error ?? {}),
            headers: errorWithGraph.response.headers,
          }
        : (error as IDataObject);
    const contextMessage =
      error instanceof Error ? error.message : String((error as IDataObject).message ?? error);
    returnItems.push({
      json: { ...errorItem, carouselErrorContext: contextMessage },
      pairedItem: { item: itemIndex },
    });
    return;
  }

  return;
}
