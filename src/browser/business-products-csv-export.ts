
import type { ImportedBusinessCsvProduct } from './business-products-csv.js';
import { BUSINESS_PRODUCTS_CSV_COLUMNS } from './business-products-csv.js';
import { isLengthUnit, isMassUnit, type LengthUnit, type MassUnit } from '../core/units/types.js';
import { fromMillimeters } from '../core/units/length.js';
import { fromGrams } from '../core/units/mass.js';

/**
 * Export uses the exact ten-column schema accepted by parseBusinessProductsCsv.
 * Existing workspace products (with IDs) are structurally compatible; IDs are
 * intentionally excluded because the CSV import allocates new workspace IDs.
 */
export interface BusinessProductsCsvExportOptions {
  /** Explicit output unit for all three dimensions; defaults to mm. */
  lengthUnit?: LengthUnit;
  /** Explicit output unit for known individual item weights; defaults to g. */
  weightUnit?: MassUnit;
}

const ALLOWED_ROTATIONS = ['any', 'upright', 'fixed'] as const;

function invalidRow(index: number, message: string): never {
  throw new Error(`Product ${index + 1}: ${message}`);
}

function positiveFinite(value: number, label: string, index: number): number {
  if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) {
    return invalidRow(index, `${label} must be a positive finite number.`);
  }
  return value;
}

/**
 * Do not produce cells which spreadsheet programs may interpret as formulas.
 * Adding an apostrophe would silently alter the data on re-import, so reject
 * rather than rewriting user data. Quoting a CSV field alone is not protection.
 */
function safeText(value: string, label: string, index: number): string {
  if (typeof value !== 'string') {
    return invalidRow(index, `${label} must be text.`);
  }
  const trimmed = value.trim();
  if (/^[\s\uFEFF]*[=+\-@]/u.test(trimmed)) {
    return invalidRow(index, `${label} starts with a spreadsheet formula character.`);
  }
  return trimmed;
}

function csvCell(value: string): string {
  return /[",\r\n]/.test(value)
    ? `"${value.replaceAll('"', '""')}"`
    : value;
}

/**
 * Serialize product rows for local CSV export, with an explicit unit column.
 * Returns UTF-8 text with a BOM and CRLF line endings for spreadsheet support.
 * Throws on invalid/unsafe input; never mutates products or changes project state.
 *
 * Missing unit weight stays blank (unknown, not zero). Missing rotation policy
 * stays blank rather than inventing a handling constraint. Existing product IDs
 * are not exported in the ten-column interchange format.
 */
export function serializeBusinessProductsCsv(
  products: readonly ImportedBusinessCsvProduct[],
  options: BusinessProductsCsvExportOptions = {}
): string {
  const lengthUnit = options.lengthUnit ?? 'mm';
  const weightUnit = options.weightUnit ?? 'g';

  if (!isLengthUnit(lengthUnit)) {
    throw new Error('Export length unit must be mm, cm, m, in, or ft.');
  }
  if (!isMassUnit(weightUnit)) {
    throw new Error('Export weight unit must be g, kg, oz, or lb.');
  }
  if (!Array.isArray(products) || products.length === 0) {
    throw new Error('CSV export requires at least one product.');
  }

  const rows = products.map((product, index) => {
    if (typeof product !== 'object' || product === null) {
      return invalidRow(index, 'product must be an object.');
    }
    const name = safeText(product.name, 'name', index);
    const sku = safeText(product.sku, 'sku', index);
    if (name === '' && sku === '') {
      return invalidRow(index, 'provide a product name or SKU.');
    }

    const lengthMm = positiveFinite(product.lengthMm, 'lengthMm', index);
    const widthMm = positiveFinite(product.widthMm, 'widthMm', index);
    const heightMm = positiveFinite(product.heightMm, 'heightMm', index);
    if (!Number.isSafeInteger(product.quantity) || product.quantity < 1) {
      return invalidRow(index, 'quantity must be a positive safe whole number.');
    }
    if (
      product.rotationPolicy !== undefined &&
      !ALLOWED_ROTATIONS.some(policy => policy === product.rotationPolicy)
    ) {
      return invalidRow(index, 'rotationPolicy must be any, upright, fixed, or missing.');
    }

    const length = positiveFinite(fromMillimeters(lengthMm, lengthUnit), 'converted length', index);
    const width = positiveFinite(fromMillimeters(widthMm, lengthUnit), 'converted width', index);
    const height = positiveFinite(fromMillimeters(heightMm, lengthUnit), 'converted height', index);

    let unitWeight = '';
    let rowWeightUnit = '';
    if (product.unitWeightG !== undefined) {
      const grams = positiveFinite(product.unitWeightG, 'unitWeightG', index);
      const converted = positiveFinite(fromGrams(grams, weightUnit), 'converted unit weight', index);
      unitWeight = String(converted);
      rowWeightUnit = weightUnit;
    }

    return [
      name,
      sku,
      String(length),
      String(width),
      String(height),
      lengthUnit,
      String(product.quantity),
      unitWeight,
      rowWeightUnit,
      product.rotationPolicy ?? '',
    ].map(csvCell).join(',');
  });

  return `\uFEFF${BUSINESS_PRODUCTS_CSV_COLUMNS.join(',')}\r\n${rows.join('\r\n')}\r\n`;
}
