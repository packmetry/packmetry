import type { PackingPlan } from '../core/domain/packing-plan.js';

export type SharePackingPlanResult =
  | 'shared'
  | 'copied'
  | 'cancelled'
  | 'unavailable';

const JSON_MIME_TYPE = 'application/json';

export function serializePackingPlan(
  plan: PackingPlan
): string {
  return JSON.stringify(plan, null, 2);
}

export function packingPlanFilename(
  plan: PackingPlan
): string {
  const safeId = plan.id
    .trim()
    .replace(/[^a-zA-Z0-9_-]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return `packmetry-${safeId || 'packing-plan'}.json`;
}

export function savePackingPlan(
  plan: PackingPlan
): boolean {
  if (
    typeof document === 'undefined' ||
    typeof Blob === 'undefined' ||
    typeof URL === 'undefined' ||
    typeof URL.createObjectURL !== 'function'
  ) {
    return false;
  }

  try {
    const blob = new Blob(
      [serializePackingPlan(plan)],
      {
        type: JSON_MIME_TYPE,
      }
    );

    const objectUrl =
      URL.createObjectURL(blob);

    const anchor =
      document.createElement('a');

    anchor.href = objectUrl;
    anchor.download =
      packingPlanFilename(plan);
    anchor.style.display = 'none';

    document.body.appendChild(
      anchor
    );

    anchor.click();
    anchor.remove();

    URL.revokeObjectURL(
      objectUrl
    );

    return true;
  } catch {
    return false;
  }
}

function isAbortError(
  error: unknown
): boolean {
  return (
    error instanceof Error &&
    error.name === 'AbortError'
  );
}

async function copyPlanToClipboard(
  serializedPlan: string
): Promise<boolean> {
  if (
    typeof navigator ===
      'undefined' ||
    navigator.clipboard ===
      undefined ||
    typeof navigator.clipboard
      .writeText !== 'function'
  ) {
    return false;
  }

  try {
    await navigator.clipboard.writeText(
      serializedPlan
    );

    return true;
  } catch {
    return false;
  }
}

export async function sharePackingPlan(
  plan: PackingPlan
): Promise<SharePackingPlanResult> {
  const serializedPlan =
    serializePackingPlan(plan);

  if (
    typeof navigator !==
      'undefined' &&
    typeof navigator.share ===
      'function'
  ) {
    try {
      if (
        typeof File !==
          'undefined' &&
        typeof navigator.canShare ===
          'function'
      ) {
        const file = new File(
          [serializedPlan],
          packingPlanFilename(plan),
          {
            type: JSON_MIME_TYPE,
          }
        );

        const fileShareData: ShareData =
          {
            title:
              'Packmetry packing plan',
            text:
              'Verified packing plan from Packmetry.',
            files: [file],
          };

        if (
          navigator.canShare(
            fileShareData
          )
        ) {
          await navigator.share(
            fileShareData
          );

          return 'shared';
        }
      }

      await navigator.share({
        title:
          'Packmetry packing plan',
        text: serializedPlan,
      });

      return 'shared';
    } catch (error) {
      if (
        isAbortError(error)
      ) {
        return 'cancelled';
      }
    }
  }

  const copied =
    await copyPlanToClipboard(
      serializedPlan
    );

  return copied
    ? 'copied'
    : 'unavailable';
}