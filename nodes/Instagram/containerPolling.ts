import type { IDataObject, IExecuteFunctions, IHttpRequestOptions } from 'n8n-workflow';
import { NodeOperationError, sleep } from 'n8n-workflow';
import { interpretContainerStatus } from './containerStatus';
import { toNodeError } from './utils';

type ContainerReadyResult = {
  containerId: string;
  finalStatusCode: string;
  finalStatusMessage?: string;
  pollingDurationSeconds: number;
  pollIntervalMs: number;
  maxTotalTimeMs: number;
  maxPollAttempts: number;
  pollCount: number;
};

export const waitForContainerReady = async (
  ctx: IExecuteFunctions,
  {
    creationId,
    hostUrl,
    graphApiVersion,
    itemIndex,
    pollIntervalMs = 60_000,
    maxTotalTimeMs = 5 * 60 * 1000,
    maxPollAttempts = Infinity,
  }: {
    creationId: string;
    hostUrl: string;
    graphApiVersion: string;
    itemIndex: number;
    pollIntervalMs?: number;
    maxTotalTimeMs?: number;
    maxPollAttempts?: number;
  },
): Promise<ContainerReadyResult> => {
  if (!creationId || typeof creationId !== 'string') {
    throw new NodeOperationError(
      ctx.getNode(),
      `Invalid creation ID provided: ${creationId}. Creation ID must be a non-empty string.`,
      { itemIndex },
    );
  }

  if (!graphApiVersion || typeof graphApiVersion !== 'string') {
    throw new NodeOperationError(
      ctx.getNode(),
      `Invalid Graph API version provided: ${graphApiVersion}. Graph API version must be a non-empty string.`,
      { itemIndex },
    );
  }

  const statusUri = `https://${hostUrl}/${graphApiVersion}/${creationId}`;

  const pollRequestOptions: IHttpRequestOptions = {
    headers: {
      accept: 'application/json,text/*;q=0.99',
    },
    method: 'GET',
    url: statusUri,
    qs: {
      fields: 'status_code,status',
    },
    json: true,
  };

  const startTime = Date.now();
  const deadline = startTime + maxTotalTimeMs;

  let lastStatusCode: string | undefined;
  let lastStatusMessage: string | undefined;
  let lastError: unknown;
  let consecutiveErrors = 0;
  let pollCount = 0;
  let slowWarningSent = false;

  const maxConsecutiveErrors = 5;

  ctx.logger.info(
    `Instagram: waiting for container ${creationId} to become ready (max ${Math.round(
      maxTotalTimeMs / 1000,
    )}s, polling every ${Math.round(pollIntervalMs / 1000)}s).`,
  );

  while (Date.now() < deadline) {
    pollCount++;

    if (pollCount > maxPollAttempts) {
      throw new NodeOperationError(
        ctx.getNode(),
        `Container ${creationId} not ready after ${maxPollAttempts} poll attempts. Last status: ${lastStatusCode ?? 'unknown'}.`,
        { itemIndex },
      );
    }

    try {
      ctx.logger.debug('Instagram: polling container status request:', {
        creationId,
        pollCount,
      });

      const statusResponse = (await ctx.helpers.httpRequestWithAuthentication.call(
        ctx,
        'instagramApi',
        pollRequestOptions,
      )) as IDataObject;

      ctx.logger.debug('Instagram: polling container status response:', {
        creationId,
        statusResponse,
      });

      if (!statusResponse || typeof statusResponse !== 'object') {
        consecutiveErrors++;

        ctx.logger.warn(
          `Instagram: received invalid status response for container ${creationId} (${consecutiveErrors}/${maxConsecutiveErrors}).`,
        );

        if (consecutiveErrors >= maxConsecutiveErrors) {
          throw new NodeOperationError(
            ctx.getNode(),
            `Invalid response format received while polling Instagram container. Container ID: ${creationId}. Response: ${JSON.stringify(
              statusResponse,
            )}`,
            { itemIndex },
          );
        }

        await sleep(pollIntervalMs);
        continue;
      }

      consecutiveErrors = 0;

      const containerStatus = interpretContainerStatus(statusResponse);
      lastStatusCode = containerStatus.statusCode;

      const rawStatus = statusResponse.status;
      lastStatusMessage =
        typeof rawStatus === 'string'
          ? rawStatus
          : rawStatus && typeof rawStatus === 'object'
            ? JSON.stringify(rawStatus)
            : undefined;

      const elapsedSeconds = Math.round((Date.now() - startTime) / 1000);
      const authoritativeStatus = containerStatus.authoritativeStatus ?? 'unknown';

      ctx.logger.info(
        `Instagram: container ${creationId} status=${authoritativeStatus}, elapsed=${elapsedSeconds}s, poll=${pollCount}.`,
      );

      // A failure in either Graph status field always wins over a ready value.
      if (containerStatus.state === 'failure') {
        const statusError =
          typeof statusResponse.error_message === 'string'
            ? statusResponse.error_message
            : undefined;

        ctx.logger.error(
          `Instagram: container ${creationId} failed with status ${authoritativeStatus} on poll ${pollCount}. ${
            statusError ? `Details: ${statusError}` : ''
          }`,
        );

        throw new NodeOperationError(
          ctx.getNode(),
          `Instagram container failed. Container ID: ${creationId}. Authoritative status: ${authoritativeStatus}. Poll attempt: ${pollCount}. ${
            statusError ? `Error details: ${statusError}.` : ''
          }`,
          { itemIndex },
        );
      }

      if (containerStatus.state === 'ready') {
        ctx.logger.info(`Instagram: container ${creationId} is ready after ${elapsedSeconds}s.`);

        return {
          containerId: creationId,
          finalStatusCode: authoritativeStatus,
          finalStatusMessage: lastStatusMessage,
          pollingDurationSeconds: elapsedSeconds,
          pollIntervalMs,
          maxTotalTimeMs,
          maxPollAttempts,
          pollCount,
        };
      }

      // Optional warning for long-running processing.
      if (
        !slowWarningSent &&
        lastStatusCode === 'IN_PROGRESS' &&
        Date.now() - startTime >= 60_000
      ) {
        slowWarningSent = true;

        ctx.logger.warn(
          `Instagram: container ${creationId} has been processing for over 60 seconds.`,
        );
      }

      // IN_PROGRESS and any other non-final status: keep waiting.
      await sleep(pollIntervalMs);
    } catch (error) {
      lastError = error;

      // A definitive Instagram status error should stop immediately.
      if (error instanceof NodeOperationError) {
        throw toNodeError(ctx.getNode(), error);
      }

      consecutiveErrors++;

      const errorMessage =
        error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();

      const isFatalRequestError =
        errorMessage.includes('invalid') ||
        errorMessage.includes('not found') ||
        errorMessage.includes('does not exist') ||
        errorMessage.includes('404') ||
        errorMessage.includes('401') ||
        errorMessage.includes('403');

      if (isFatalRequestError || consecutiveErrors >= maxConsecutiveErrors) {
        ctx.logger.error(
          `Instagram: failed to poll container ${creationId}. Last status: ${
            lastStatusCode ?? 'unknown'
          }. Error: ${error instanceof Error ? error.message : String(error)}`,
        );

        throw new NodeOperationError(
          ctx.getNode(),
          `Failed to poll Instagram container status. Container ID: ${creationId}. Last status: ${
            lastStatusCode ?? 'unknown'
          }. Last error: ${error instanceof Error ? error.message : String(error)}`,
          { itemIndex },
        );
      }

      ctx.logger.warn(
        `Instagram: transient error while polling container ${creationId} (${consecutiveErrors}/${maxConsecutiveErrors}): ${
          error instanceof Error ? error.message : String(error)
        }`,
      );

      // Transient network/API issue: retry until the deadline.
      await sleep(pollIntervalMs);
    }
  }

  const elapsedSeconds = Math.round((Date.now() - startTime) / 1000);

  ctx.logger.error(
    `Instagram: timed out waiting for container ${creationId} after ${elapsedSeconds}s. Last status: ${
      lastStatusCode ?? 'unknown'
    }.`,
  );

  throw new NodeOperationError(
    ctx.getNode(),
    `Timed out waiting for Instagram container after ${
      maxTotalTimeMs / 1000
    } seconds. Container ID: ${creationId}. Last status code: ${
      lastStatusCode ?? 'unknown'
    }. Last status: ${
      lastStatusMessage ?? 'unknown'
    }. Polls completed: ${pollCount}. Last polling error: ${
      lastError instanceof Error ? lastError.message : lastError ? String(lastError) : 'none'
    }.`,
    { itemIndex },
  );
};

export const isMediaNotReadyError = (error: unknown) => {
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
    };
  };
  const errorWithGraph = error as ErrorWithGraph;
  const graphError = errorWithGraph?.response?.body?.error;
  if (!graphError) return false;
  const message = graphError.message?.toLowerCase() ?? '';
  const code = graphError.code;
  const subcode = graphError.error_subcode;
  return (
    message.includes('not ready') ||
    message.includes('not finished') ||
    message.includes('not yet') ||
    code === 900 ||
    subcode === 2207055
  );
};
