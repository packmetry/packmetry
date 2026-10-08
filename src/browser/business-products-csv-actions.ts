import type { ImportedBusinessCsvProduct } from './business-products-csv.js';
import { serializeBusinessProductsCsv } from './business-products-csv-export.js';

export const BUSINESS_PRODUCTS_CSV_MAX_BYTES = 2_000_000;
export const BUSINESS_PRODUCTS_CSV_MIME_TYPE = 'text/csv;charset=utf-8';
export const BUSINESS_PRODUCTS_CSV_FILENAME = 'packmetry-business-products.csv';

export interface BusinessProductsCsvReadableFile {
  size?: number;
  text?: () => Promise<string>;
}

export type BusinessProductsCsvFileReadResult =
  | { ok: true; text: string }
  | { ok: false; reason: 'unavailable' | 'too-large' | 'read-failed' };

/** Read only a small browser-local CSV file; parsing is a separate validated step. */
export async function readBusinessProductsCsvFile(
  file: BusinessProductsCsvReadableFile | null | undefined
): Promise<BusinessProductsCsvFileReadResult> {
  if (file === null || file === undefined || typeof file.text !== 'function') {
    return { ok: false, reason: 'unavailable' };
  }
  if (typeof file.size === 'number' && file.size > BUSINESS_PRODUCTS_CSV_MAX_BYTES) {
    return { ok: false, reason: 'too-large' };
  }
  try {
    const content = await file.text();
    if (typeof content !== 'string') {
      return { ok: false, reason: 'read-failed' };
    }
    // Also bound mock/non-File readers which do not expose .size.
    if (content.length > BUSINESS_PRODUCTS_CSV_MAX_BYTES) {
      return { ok: false, reason: 'too-large' };
    }
    return { ok: true, text: content };
  } catch {
    return { ok: false, reason: 'read-failed' };
  }
}

/** Returns false if browser download is unavailable. Invalid product data throws. */
export function downloadBusinessProductsCsv(
  products: readonly ImportedBusinessCsvProduct[]
): boolean {
  // Validate and serialize before attempting any browser side effects.
  const csv = serializeBusinessProductsCsv(products);
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
    const blob = new Blob([csv], { type: BUSINESS_PRODUCTS_CSV_MIME_TYPE });
    objectUrl = URL.createObjectURL(blob);
    anchor = document.createElement('a');
    anchor.href = objectUrl;
    anchor.download = BUSINESS_PRODUCTS_CSV_FILENAME;
    anchor.style.display = 'none';
    document.body.appendChild(anchor);
    anchor.click();
    return true;
  } catch {
    return false;
  } finally {
    if (anchor !== null) {
      try { anchor.remove(); } catch { /* Best-effort cleanup. */ }
    }
    if (objectUrl !== null) {
      try { URL.revokeObjectURL(objectUrl); } catch { /* Best-effort cleanup. */ }
    }
  }
}
