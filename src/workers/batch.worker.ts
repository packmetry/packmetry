import {
  handleBatchWorkerStart,
  type BatchWorkerResponse,
  type BatchWorkerStartMessage,
} from '../core/batch/worker-protocol.js';

/** Dedicated module worker. This file is loaded only through new Worker(). */
const scope = self as unknown as {
  postMessage(message: BatchWorkerResponse): void;
  onmessage: ((event: MessageEvent<unknown>) => void) | null;
};

let started = false;

scope.onmessage = event => {
  const value = event.data;
  const request = value as Partial<BatchWorkerStartMessage> | null;
  const requestId =
    request !== null && typeof request === 'object' &&
    typeof request.requestId === 'string'
      ? request.requestId
      : '';

  if (
    started || request === null || typeof request !== 'object' ||
    request.type !== 'start' || requestId.trim() === '' ||
    !('input' in request)
  ) {
    scope.postMessage({
      type: 'failure',
      requestId,
      message: 'Invalid or duplicate batch worker start request.',
    });
    return;
  }

  started = true;
  // Each job owns its worker. Main-thread cancel() terminates this worker.
  void handleBatchWorkerStart(
    request as BatchWorkerStartMessage,
    response => scope.postMessage(response)
  );
};
