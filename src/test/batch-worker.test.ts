import { describe, expect, it } from 'vitest';
import { createItem } from '../core/domain/item.js';
import { createCarton } from '../core/domain/carton.js';
import type { BatchPlanningInput } from '../core/batch/contracts.js';
import {
  handleBatchWorkerStart,
  type BatchWorkerResponse,
  type BatchWorkerStartMessage,
} from '../core/batch/worker-protocol.js';
import {
  executeBatchPlanning,
  type BatchExecutionProgress,
} from '../core/batch/execute.js';
import {
  startBatchWorker,
  type BatchWorkerPort,
} from '../browser/batch-worker-client.js';

function input(count = 2): BatchPlanningInput {
  return {
    orders: Array.from({ length: count }, (_, index) => ({
      orderId: `order-${index + 1}`,
      items: [createItem({
        id: 'item-1',
        dimensions: { length: 20, width: 20, height: 20 },
        quantity: 1,
      })],
    })),
    cartons: [createCarton({
      id: 'box-1',
      internalDimensions: { length: 40, width: 40, height: 40 },
      quantityAvailable: 1,
    })],
    objective: { kind: 'balanced' },
  };
}

const progress = (completed: number, total = 2): BatchExecutionProgress => ({
  completed, total, plansProduced: completed, unselected: 0, errors: 0,
});

class FakeWorker {
  onmessage: Worker['onmessage'] = null;
  onerror: Worker['onerror'] = null;
  onmessageerror: Worker['onmessageerror'] = null;
  sent: BatchWorkerStartMessage[] = [];
  terminated = 0;
  throwOnPost = false;

  postMessage(value: BatchWorkerStartMessage): void {
    if (this.throwOnPost) throw new Error('structured clone failed');
    this.sent.push(value);
  }
  terminate(): void {
    this.terminated++;
  }
  emit(value: BatchWorkerResponse): void {
    this.onmessage?.call(
      this as unknown as Worker,
      { data: value } as MessageEvent<BatchWorkerResponse>
    );
  }
  emitInvalid(value: unknown): void {
    this.onmessage?.call(
      this as unknown as Worker,
      { data: value } as MessageEvent<unknown>
    );
  }
  crash(): void {
    this.onerror?.call(this as unknown as Worker, {} as ErrorEvent);
  }
  badMessage(): void {
    this.onmessageerror?.call(
      this as unknown as Worker,
      {} as MessageEvent<unknown>
    );
  }
  asPort(): BatchWorkerPort {
    return this as unknown as BatchWorkerPort;
  }
}

describe('Phase 15 module worker execution bridge', () => {
  it('worker handler reuses independently verified per-order pipeline and sends correlated progress', async () => {
    const messages: BatchWorkerResponse[] = [];
    const request: BatchWorkerStartMessage = {
      type: 'start', requestId: 'test-run', input: input(),
    };
    await handleBatchWorkerStart(request, message => messages.push(message));
    expect(messages.map(message => message.type)).toEqual([
      'progress', 'progress', 'progress', 'result',
    ]);
    expect(messages.every(message => message.requestId === 'test-run')).toBe(true);
    expect(messages.slice(0, 3).map(message =>
      message.type === 'progress' ? message.progress.completed : -1
    )).toEqual([0, 1, 2]);
    const last = messages.at(-1);
    expect(last?.type).toBe('result');
    if (last?.type !== 'result') throw new Error('Expected worker result.');
    expect(last.result).toMatchObject({
      status: 'completed', completed: 2, plansProduced: 2, errors: 0,
    });
    expect(last.result.outcomes.map(outcome => outcome.orderId)).toEqual([
      'order-1', 'order-2',
    ]);
    for (const outcome of last.result.outcomes) {
      expect(outcome.kind).toBe('plan');
      if (outcome.kind !== 'plan') continue;
      expect(outcome.plan.status).toBe('feasible');
      expect(outcome.inventoryUsage.usedCartons[0]?.usedQuantity).toBe(1);
    }
  });

  it('worker handler reports invalid input as failure, not a completed packing result', async () => {
    const messages: BatchWorkerResponse[] = [];
    await handleBatchWorkerStart({
      type: 'start', requestId: 'bad-run', input: { ...input(), orders: [] },
    }, message => messages.push(message));
    expect(messages).toHaveLength(1);
    expect(messages[0]).toMatchObject({
      type: 'failure', requestId: 'bad-run',
    });
    expect(messages[0]?.type === 'failure' ? messages[0].message : '').toMatch(/orders must contain/);
  });

  it('validates before creating or posting to a browser worker', () => {
    let created = 0;
    expect(() => startBatchWorker({ ...input(), orders: [] }, {
      createWorker: () => { created++; return new FakeWorker().asPort(); },
    })).toThrow(/orders must contain/);
    expect(created).toBe(0);
  });

  it('starts one module-worker job, forwards progress, and resolves an actual result', async () => {
    const fake = new FakeWorker();
    const updates: BatchExecutionProgress[] = [];
    const batch = input();
    const job = startBatchWorker(batch, {
      createWorker: () => fake.asPort(),
      onProgress: update => updates.push(update),
    });
    expect(fake.sent).toHaveLength(1);
    expect(fake.sent[0]).toMatchObject({ type: 'start', input: batch });
    expect(fake.sent[0]?.requestId).toMatch(/^batch-worker-/);
    const requestId = fake.sent[0]!.requestId;
    fake.emit({ type: 'progress', requestId: 'different-job', progress: progress(1) });
    fake.emit({ type: 'progress', requestId, progress: progress(0) });
    fake.emit({ type: 'progress', requestId, progress: progress(1) });
    const actual = await executeBatchPlanning(batch);
    fake.emit({ type: 'result', requestId, result: actual });
    const outcome = await job.result;
    expect(outcome).toEqual({ kind: 'result', result: actual });
    expect(updates.map(update => update.completed)).toEqual([0, 1]);
    expect(fake.terminated).toBe(1);
    fake.emit({ type: 'progress', requestId, progress: progress(2) });
    expect(updates).toHaveLength(2);
  });

  it('hard-cancels a running job without manufacturing partial plans', async () => {
    const fake = new FakeWorker();
    const updates: BatchExecutionProgress[] = [];
    const job = startBatchWorker(input(), {
      createWorker: () => fake.asPort(),
      onProgress: p => updates.push(p),
    });
    const requestId = fake.sent[0]!.requestId;
    fake.emit({ type: 'progress', requestId, progress: progress(1) });
    job.cancel();
    job.cancel();
    expect(await job.result).toEqual({ kind: 'cancelled', lastProgress: progress(1) });
    expect(fake.terminated).toBe(1);
    fake.emit({ type: 'progress', requestId, progress: progress(2) });
    expect(updates).toHaveLength(1);
  });

  it('supports cancelling before any progress, preserving unknown progress', async () => {
    const fake = new FakeWorker();
    const job = startBatchWorker(input(), { createWorker: () => fake.asPort() });
    job.cancel();
    expect(await job.result).toEqual({ kind: 'cancelled', lastProgress: null });
    expect(fake.terminated).toBe(1);
  });

  it('reports worker-side errors and releases the worker', async () => {
    const fake = new FakeWorker();
    const job = startBatchWorker(input(), { createWorker: () => fake.asPort() });
    fake.emit({ type: 'failure', requestId: fake.sent[0]!.requestId, message: 'solver failed' });
    await expect(job.result).rejects.toThrow('solver failed');
    expect(fake.terminated).toBe(1);
  });

  it('reports worker crashes and message deserialization errors without hanging', async () => {
    const crashed = new FakeWorker();
    const a = startBatchWorker(input(), { createWorker: () => crashed.asPort() });
    crashed.crash();
    await expect(a.result).rejects.toThrow(/crashed/);
    expect(crashed.terminated).toBe(1);

    const bad = new FakeWorker();
    const b = startBatchWorker(input(), { createWorker: () => bad.asPort() });
    bad.badMessage();
    await expect(b.result).rejects.toThrow(/could not be read/);
    expect(bad.terminated).toBe(1);
  });

  it('reports serialization failures without leaving an orphan worker', async () => {
    const fake = new FakeWorker();
    fake.throwOnPost = true;
    const job = startBatchWorker(input(), { createWorker: () => fake.asPort() });
    await expect(job.result).rejects.toThrow('structured clone failed');
    expect(fake.terminated).toBe(1);
  });

  it('does not mislabel UI progress callback failures as solver failures', async () => {
    const fake = new FakeWorker();
    const job = startBatchWorker(input(), {
      createWorker: () => fake.asPort(),
      onProgress: () => { throw new Error('progress display failed'); },
    });
    fake.emit({ type: 'progress', requestId: fake.sent[0]!.requestId, progress: progress(0) });
    await expect(job.result).rejects.toThrow('progress display failed');
    expect(fake.terminated).toBe(1);
  });

  it('rejects malformed or unexpected messages from the current worker', async () => {
    const bad = new FakeWorker();
    const a = startBatchWorker(input(), { createWorker: () => bad.asPort() });
    bad.emitInvalid(null);
    await expect(a.result).rejects.toThrow(/Invalid batch worker message/);
    const unexpected = new FakeWorker();
    const b = startBatchWorker(input(), { createWorker: () => unexpected.asPort() });
    unexpected.emitInvalid({ requestId: unexpected.sent[0]!.requestId, type: 'unknown' });
    await expect(b.result).rejects.toThrow(/Unexpected batch worker message/);
  });

  it('does not mix progress or results from separate worker jobs', async () => {
    const left = new FakeWorker();
    const right = new FakeWorker();
    const a = startBatchWorker(input(1), { createWorker: () => left.asPort() });
    const b = startBatchWorker(input(1), { createWorker: () => right.asPort() });
    const aId = left.sent[0]!.requestId;
    const bId = right.sent[0]!.requestId;
    expect(aId).not.toBe(bId);
    left.emit({ type: 'progress', requestId: bId, progress: progress(1, 1) });
    const actual = await executeBatchPlanning(input(1));
    left.emit({ type: 'result', requestId: aId, result: actual });
    right.emit({ type: 'result', requestId: bId, result: actual });
    expect((await a.result).kind).toBe('result');
    expect((await b.result).kind).toBe('result');
    expect(left.terminated).toBe(1);
    expect(right.terminated).toBe(1);
  });
});
