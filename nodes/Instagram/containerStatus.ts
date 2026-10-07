import type { IDataObject } from 'n8n-workflow';

const FAILURE_STATUSES = new Set(['ERROR', 'FAILED']);
const READY_STATUSES = new Set(['FINISHED', 'PUBLISHED', 'READY']);

export type ContainerStatusState = 'failure' | 'ready' | 'pending';

export type ContainerStatusInterpretation = {
  state: ContainerStatusState;
  authoritativeStatus?: string;
  statusCode?: string;
  status?: string;
};

const normalizeStatus = (value: unknown): string | undefined => {
  if (typeof value !== 'string') return undefined;

  const normalized = value.trim().toUpperCase();
  return normalized || undefined;
};

/**
 * Resolves Graph container status fields using failure-first precedence.
 * A failure in either field blocks publishing, even if the other is ready.
 */
export const interpretContainerStatus = (
  response: Partial<Pick<IDataObject, 'status_code' | 'status'>>,
): ContainerStatusInterpretation => {
  const statusCode = normalizeStatus(response.status_code);
  const status = normalizeStatus(response.status);
  const values = [statusCode, status].filter((value): value is string => value !== undefined);
  const failure = values.find((value) => FAILURE_STATUSES.has(value));

  if (failure) {
    return {
      state: 'failure',
      authoritativeStatus: failure,
      statusCode,
      status,
    };
  }

  const ready = values.find((value) => READY_STATUSES.has(value));
  if (ready) {
    return {
      state: 'ready',
      authoritativeStatus: ready,
      statusCode,
      status,
    };
  }

  return {
    state: 'pending',
    statusCode,
    status,
  };
};
