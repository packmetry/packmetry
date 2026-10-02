import type { RecentBusinessProject } from './business-recent-projects.js';
import { serializeBusinessProjectJson } from './business-project-json.js';

export const BUSINESS_PROJECT_JSON_MIME_TYPE =
  'application/json';

export type BusinessProjectJsonFileReadFailureReason =
  | 'unavailable'
  | 'read-failed';

export type BusinessProjectJsonFileReadResult =
  | {
      ok: true;
      text: string;
    }
  | {
      ok: false;
      reason:
        BusinessProjectJsonFileReadFailureReason;
    };

export interface BusinessProjectJsonReadableFile {
  text?: () => Promise<string>;
}

function safeFilenamePart(
  value: string
): string {
  return value
    .trim()
    .replace(
      /[^a-zA-Z0-9_-]+/g,
      '-'
    )
    .replace(
      /-+/g,
      '-'
    )
    .replace(
      /^[-_]+|[-_]+$/g,
      ''
    );
}

export function businessProjectJsonFilename(
  project:
    Pick<
      RecentBusinessProject,
      'id' | 'name'
    >
): string {
  const safeName =
    safeFilenamePart(
      project.name
    );

  const safeId =
    safeFilenamePart(
      project.id
    );

  const stem =
    safeName ||
    safeId ||
    'project';

  return `packmetry-business-${stem}.json`;
}

export async function readBusinessProjectJsonFile(
  file:
    BusinessProjectJsonReadableFile |
    null |
    undefined
): Promise<BusinessProjectJsonFileReadResult> {
  if (
    file === null ||
    file === undefined ||
    typeof file.text !==
      'function'
  ) {
    return {
      ok: false,
      reason:
        'unavailable',
    };
  }

  try {
    const text =
      await file.text();

    if (
      typeof text !==
      'string'
    ) {
      return {
        ok: false,
        reason:
          'read-failed',
      };
    }

    return {
      ok: true,
      text,
    };
  } catch {
    return {
      ok: false,
      reason:
        'read-failed',
    };
  }
}

export function downloadBusinessProjectJson(
  project:
    RecentBusinessProject
): boolean {
  if (
    typeof document ===
      'undefined' ||
    typeof Blob ===
      'undefined' ||
    typeof URL ===
      'undefined' ||
    typeof URL.createObjectURL !==
      'function' ||
    typeof URL.revokeObjectURL !==
      'function'
  ) {
    return false;
  }

  let objectUrl:
    string | null = null;

  let anchor:
    HTMLAnchorElement | null =
      null;

  try {
    const serialized =
      serializeBusinessProjectJson(
        project
      );

    const blob =
      new Blob(
        [serialized],
        {
          type:
            BUSINESS_PROJECT_JSON_MIME_TYPE,
        }
      );

    objectUrl =
      URL.createObjectURL(
        blob
      );

    anchor =
      document.createElement(
        'a'
      );

    anchor.href =
      objectUrl;

    anchor.download =
      businessProjectJsonFilename(
        project
      );

    anchor.style.display =
      'none';

    document.body.appendChild(
      anchor
    );

    anchor.click();

    return true;
  } catch {
    return false;
  } finally {
    if (anchor !== null) {
      try {
        anchor.remove();
      } catch {
        // Best-effort browser cleanup.
      }
    }

    if (objectUrl !== null) {
      try {
        URL.revokeObjectURL(
          objectUrl
        );
      } catch {
        // Best-effort browser cleanup.
      }
    }
  }
}
