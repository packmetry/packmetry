import type { BatchPlanningInput } from './contracts.js';
import {
  executeBatchPlanning,
  type BatchExecutionOptions,
  type BatchExecutionProgress,
  type BatchExecutionResult,
} from './execute.js';

/** One worker is created per job; only one start request is sent to it. */
export interface BatchWorkerStartMessage {
  type: 'start';
  requestId: string;
  input: BatchPlanningInput;
}

/** Structured-clone-safe messages: no solver functions or browser objects. */
export type BatchWorkerResponse =
  | {
      type: 'progress';
      requestId: string;
      progress: BatchExecutionProgress;
    }
  | {
      type: 'result';
      requestId: string;
      result: BatchExecutionResult;
    }
  | {
      type: 'failure';
      requestId: string;
      message: string;
    };

export type BatchWorkerExecutor = (
  input: BatchPlanningInput,
  options: BatchExecutionOptions
) => Promise<BatchExecutionResult>;

/**
 * The worker's testable message handler. Uses the SAME validated, verified
 * sequential batch pipeline as the non-worker execution foundation.
 *
 * Cancellation while one solver runs is handled by Worker.terminate() on the
 * main thread. It does not fabricate partial plans or mutate carton stock.
 */
export async function handleBatchWorkerStart(
  message: BatchWorkerStartMessage,
  send: (message: BatchWorkerResponse) => void,
  execute: BatchWorkerExecutor = executeBatchPlanning
): Promise<void> {
  try {
    const result = await execute(message.input, {
      onProgress: progress => {
        send({
          type: 'progress',
          requestId: message.requestId,
          progress,
        });
      },
    });
    send({ type: 'result', requestId: message.requestId, result });
  } catch (caught) {
    send({
      type: 'failure',
      requestId: message.requestId,
      message: caught instanceof Error ? caught.message : 'Batch processing failed.',
    });
  }
}
