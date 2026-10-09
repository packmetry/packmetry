import type { ImportedBusinessCsvCarton } from './business-cartons-csv.js';
import { serializeBusinessCartonsCsv } from './business-cartons-csv-export.js';

export const BUSINESS_CARTONS_CSV_MAX_BYTES = 2_000_000;
export const BUSINESS_CARTONS_CSV_MIME_TYPE = 'text/csv;charset=utf-8';
export const BUSINESS_CARTONS_CSV_FILENAME = 'packmetry-business-cartons.csv';

export interface BusinessCartonsCsvReadableFile {
  size?: number;
  text?: () => Promise<string>;
}

export type BusinessCartonsCsvFileReadResult =
  | { ok: true; text: string }
  | { ok: false; reason: 'unavailable' | 'too-large' | 'read-failed' };

/** Read a small CSV locally. Schema validation is performed separately. */
export async function readBusinessCartonsCsvFile(
  file: BusinessCartonsCsvReadableFile | null | undefined
): Promise<BusinessCartonsCsvFileReadResult> {
  if (file === null || file === undefined || typeof file.text !== 'function') {
    return { ok: false, reason: 'unavailable' };
  }
  if (typeof file.size === 'number' && file.size > BUSINESS_CARTONS_CSV_MAX_BYTES) {
    return { ok: false, reason: 'too-large' };
  }

  try {
    const content = await file.text();
    if (typeof content !== 'string') {
      return { ok: false, reason: 'read-failed' };
    }
    // A second bound also covers mock readers without a size property.
    if (content.length > BUSINESS_CARTONS_CSV_MAX_BYTES) {
      return { ok: false, reason: 'too-large' };
    }
    return { ok: true, text: content };
  } catch {
    return { ok: false, reason: 'read-failed' };
  }
}

/**
 * Validates first, then downloads only through supported browser APIs.
 * Returns false if downloading is unavailable. Invalid cartons throw.
 */
export function downloadBusinessCartonsCsv(
  cartons: readonly ImportedBusinessCsvCarton[]
): boolean {
  const csv = serializeBusinessCartonsCsv(cartons);
  if (
    typeof document === 'undefined' ||
    typeof Blob === 'undefined' ||
    typeof URL === 'undefined' ||
    typeof URL.createObjectURL !== 'function' ||
    typeof URL.revokeObjectURL !== 'function'
  ) {
    return false;
  }

  let objectUrl: string | null = null;
  let anchor: HTMLAnchorElement | null = null;
  try {
    const blob = new Blob([csv], { type: BUSINESS_CARTONS_CSV_MIME_TYPE });
    objectUrl = URL.createObjectURL(blob);
    anchor = document.createElement('a');
    anchor.href = objectUrl;
    anchor.download = BUSINESS_CARTONS_CSV_FILENAME;
    anchor.style.display = 'none';
    document.body.appendChild(anchor);
    anchor.click();
    return true;
  } catch {
    return false;
  } finally {
    if (anchor !== null) {
      try { anchor.remove(); } catch { /* Best-effort browser cleanup. */ }
    }
    if (objectUrl !== null) {
      try { URL.revokeObjectURL(objectUrl); } catch { /* Best-effort browser cleanup. */ }
    }
  }
}
