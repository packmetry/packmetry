import {
  validateBatchPlanningInput,
  type BatchPlanningInput,
} from '../core/batch/contracts.js';
import type {
  BatchExecutionProgress,
  BatchExecutionResult,
} from '../core/batch/execute.js';
import type {
  BatchWorkerResponse,
  BatchWorkerStartMessage,
} from '../core/batch/worker-protocol.js';

/** A cancellation has no completed plan result; progress is informational. */
export type BatchWorkerJobOutcome =
  | { kind: 'result'; result: BatchExecutionResult }
  | { kind: 'cancelled'; lastProgress: BatchExecutionProgress | null };

export interface BatchWorkerJob {
  result: Promise<BatchWorkerJobOutcome>;
  cancel(): void;
}

/** Minimal worker surface for deterministic tests without a browser. */
export type BatchWorkerPort = Pick<
  Worker,
  'postMessage' | 'terminate' | 'onmessage' | 'onerror' | 'onmessageerror'
>;

export interface BatchWorkerClientOptions {
  onProgress?: (progress: BatchExecutionProgress) => void;
  /** Tests may supply an in-memory Worker stand-in. */
  createWorker?: () => BatchWorkerPort;
}

let nextRequestNumber = 0;

/**
 * Run a fully validated batch off the main thread in a fresh module Worker.
 * Browser-only at call time; safe to import during server-side rendering.
 *
 * Cancellation is immediate Worker termination, including during a solver.
 * Therefore it returns a cancelled marker, NOT invented partial plans.
 * A finished job releases its Worker and ignores late/stale events.
 */
export function startBatchWorker(
  input: BatchPlanningInput,
  options: BatchWorkerClientOptions = {}
): BatchWorkerJob {
  // No worker allocation or callback when input is invalid.
  validateBatchPlanningInput(input);

  // Keep this static URL construction recognizable to Astro/Vite's bundler.
  const worker: BatchWorkerPort = options.createWorker?.() ??
    new Worker(new URL('../workers/batch.worker.ts', import.meta.url), {
      type: 'module',
    });

  const requestId = `batch-worker-${++nextRequestNumber}`;
  let settled = false;
  let lastProgress: BatchExecutionProgress | null = null;
  let resolveJob!: (value: BatchWorkerJobOutcome) => void;
  let rejectJob!: (reason: Error) => void;

  const result = new Promise<BatchWorkerJobOutcome>((resolve, reject) => {
    resolveJob = resolve;
    rejectJob = reject;
  });

  const cleanup = () => {
    worker.onmessage = null;
    worker.onerror = null;
    worker.onmessageerror = null;
    try {
      worker.terminate();
    } catch {
      // A browser-level cleanup error must not prevent promise settlement.
    }
  };
  const finish = (outcome: BatchWorkerJobOutcome) => {
    if (settled) return;
    settled = true;
    cleanup();
    resolveJob(outcome);
  };
  const fail = (error: Error) => {
    if (settled) return;
    settled = true;
    cleanup();
    rejectJob(error);
  };

  worker.onmessage = (event: MessageEvent<BatchWorkerResponse>) => {
    if (settled) return;
    const message: unknown = event.data;
    if (message === null || typeof message !== 'object') {
      fail(new Error('Invalid batch worker message.'));
      return;
    }
    const response = message as Partial<BatchWorkerResponse>;
    if (response.requestId !== requestId) return;

    switch (response.type) {
      case 'progress':
        if (!response.progress) {
          fail(new Error('Missing batch worker progress.'));
          return;
        }
        lastProgress = response.progress;
        try {
          options.onProgress?.(response.progress);
        } catch (caught) {
          fail(caught instanceof Error ? caught : new Error('Batch progress handler failed.'));
        }
        return;
      case 'result':
        if (!response.result) {
          fail(new Error('Missing batch worker result.'));
          return;
        }
        finish({ kind: 'result', result: response.result });
        return;
      case 'failure':
        fail(new Error(response.message || 'Batch worker failed.'));
        return;
      default:
        fail(new Error('Unexpected batch worker message type.'));
    }
  };

  worker.onerror = () => {
    fail(new Error('Batch worker crashed or could not start.'));
  };
  worker.onmessageerror = () => {
    fail(new Error('Batch worker message could not be read.'));
  };

  const start: BatchWorkerStartMessage = {
    type: 'start',
    requestId,
    input,
  };
  try {
    worker.postMessage(start);
  } catch (caught) {
    fail(caught instanceof Error ? caught : new Error('Could not start batch worker.'));
  }

  return {
    result,
    cancel: () => finish({ kind: 'cancelled', lastProgress }),
  };
}
