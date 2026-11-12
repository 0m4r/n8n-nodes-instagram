import type { IExecuteFunctions, IHttpRequestOptions } from 'n8n-workflow';

type HttpLogger = Pick<IExecuteFunctions['logger'], 'debug' | 'error'>;
type HttpRequestFailure = {
  message?: string;
  name?: string;
  statusCode?: number;
  response?: unknown;
};

const isSensitiveKey = (key: string) => {
  const normalized = key.toLowerCase().replace(/[^a-z0-9]/g, '');
  return (
    normalized.includes('token') ||
    normalized.includes('secret') ||
    normalized.includes('authorization') ||
    normalized.includes('password')
  );
};

const sanitizeUrl = (value: string) => {
  try {
    const url = new URL(value);
    for (const key of url.searchParams.keys()) {
      if (isSensitiveKey(key)) url.searchParams.set(key, '[REDACTED]');
    }
    return url.toString();
  } catch {
    return value;
  }
};

export const sanitizeHttpLogValue = (value: unknown, seen = new WeakSet<object>()): unknown => {
  if (typeof value === 'string') return sanitizeUrl(value);
  if (Array.isArray(value)) return value.map((entry) => sanitizeHttpLogValue(entry, seen));
  if (!value || typeof value !== 'object') return value;
  if (seen.has(value)) return '[Circular]';
  seen.add(value);

  if (value instanceof Error) {
    const error = value as Error & { response?: unknown; statusCode?: number };
    return sanitizeHttpLogValue(
      {
        name: error.name,
        message: error.message,
        statusCode: error.statusCode,
        response: error.response,
      },
      seen,
    );
  }

  return Object.fromEntries(
    Object.entries(value).map(([key, entry]) => [
      key,
      isSensitiveKey(key) ? '[REDACTED]' : sanitizeHttpLogValue(entry, seen),
    ]),
  );
};

export const requestWithLogging = async <T>(
  logger: HttpLogger,
  source: string,
  action: string,
  requestOptions: IHttpRequestOptions,
  request: () => Promise<T>,
): Promise<T> => {
  const requestDetails = sanitizeHttpLogValue({
    method: requestOptions.method,
    url: requestOptions.url,
    headers: requestOptions.headers,
    query: requestOptions.qs,
    body: requestOptions.body,
  });

  const [file, functionName] = source.split(':');
  const sourceMetadata = { file, function: functionName };
  logger.debug(`[${source}] ${action} HTTP request`, {
    ...sourceMetadata,
    ...(requestDetails as Record<string, unknown>),
  });
  const startedAt = Date.now();

  try {
    const response = await request();
    logger.debug(`[${source}] ${action} HTTP response`, {
      ...sourceMetadata,
      durationMs: Date.now() - startedAt,
      response: sanitizeHttpLogValue(response),
    });
    return response;
  } catch (error) {
    const failure = error as HttpRequestFailure;
    logger.error(`[${source}] ${action} HTTP request failed`, {
      ...sourceMetadata,
      durationMs: Date.now() - startedAt,
      request: requestDetails,
      statusCode: failure?.statusCode,
      error: sanitizeHttpLogValue(error),
      apiResponse: sanitizeHttpLogValue(failure?.response),
    });
    // Preserve the original error so the calling operation can add its item-aware node context.
    // eslint-disable-next-line @n8n/community-nodes/require-node-api-error
    throw error;
  }
};
