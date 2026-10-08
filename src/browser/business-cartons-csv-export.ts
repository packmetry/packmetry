import type { ImportedBusinessCsvCarton } from './business-cartons-csv.js';
import { BUSINESS_CARTONS_CSV_COLUMNS } from './business-cartons-csv.js';
import {
  isLengthUnit,
  isMassUnit,
  type LengthUnit,
  type MassUnit,
} from '../core/units/types.js';
import { fromMillimeters } from '../core/units/length.js';
import { fromGrams } from '../core/units/mass.js';

/**
 * Export units apply to all dimensions and any supplied carton weights.
 * Canonical workspace values remain in millimeters and grams.
 */
export interface BusinessCartonsCsvExportOptions {
  lengthUnit?: LengthUnit;
  weightUnit?: MassUnit;
}

function invalidCarton(index: number, message: string): never {
  throw new Error(`Carton ${index + 1}: ${message}`);
}

function safeText(value: string, field: string, index: number): string {
  if (typeof value !== 'string') {
    return invalidCarton(index, `${field} must be text.`);
  }

  const trimmed = value.trim();
  // Quoting alone does not prevent spreadsheet CSV formula execution.
  // Reject dangerous prefixes instead of silently altering round-trip data.
  if (/^[=+\-@]/u.test(trimmed)) {
    return invalidCarton(index, `${field} starts with a spreadsheet formula character.`);
  }
  return trimmed;
}

function positiveFinite(value: number, field: string, index: number): number {
  if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) {
    return invalidCarton(index, `${field} must be a positive finite number.`);
  }
  return value;
}

function nonnegativeFinite(value: number, field: string, index: number): number {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) {
    return invalidCarton(index, `${field} must be a nonnegative finite number.`);
  }
  return value;
}

function convertedDimension(
  value: number,
  unit: LengthUnit,
  field: string,
  index: number
): string {
  const millimeters = positiveFinite(value, field, index);
  return String(positiveFinite(
    fromMillimeters(millimeters, unit),
    `converted ${field}`,
    index
  ));
}

function convertedWeight(
  value: number | undefined,
  unit: MassUnit,
  field: string,
  index: number
): string {
  if (value === undefined) return '';
  const grams = positiveFinite(value, field, index);
  return String(positiveFinite(fromGrams(grams, unit), `converted ${field}`, index));
}

function csvCell(value: string): string {
  return /[",\r\n]/u.test(value)
    ? `"${value.replaceAll('"', '""')}"`
    : value;
}

/**
 * Serialize Business carton inventory using the exact 14-column CSV import
 * schema. Workspace IDs and saved-library IDs are never exported.
 *
 * Missing external dimensions and optional weights stay blank, not zero.
 * Stock zero and box cost zero remain valid. Cost has no assumed currency.
 * Produces a UTF-8 BOM plus CRLF rows for spreadsheet compatibility.
 *
 * Throws on invalid data; it never edits carton data or browser storage.
 */
export function serializeBusinessCartonsCsv(
  cartons: readonly ImportedBusinessCsvCarton[],
  options: BusinessCartonsCsvExportOptions = {}
): string {
  const lengthUnit = options.lengthUnit ?? 'mm';
  const weightUnit = options.weightUnit ?? 'g';

  if (!isLengthUnit(lengthUnit)) {
    throw new Error('Export length unit must be mm, cm, m, in, or ft.');
  }
  if (!isMassUnit(weightUnit)) {
    throw new Error('Export weight unit must be g, kg, oz, or lb.');
  }
  if (!Array.isArray(cartons) || cartons.length === 0) {
    throw new Error('CSV export requires at least one carton.');
  }

  const rows = cartons.map((carton, index) => {
    if (typeof carton !== 'object' || carton === null) {
      return invalidCarton(index, 'carton must be an object.');
    }

    const name = safeText(carton.name, 'name', index);
    const cartonCode = safeText(carton.cartonCode, 'cartonCode', index);
    if (name === '' && cartonCode === '') {
      return invalidCarton(index, 'provide a carton name or cartonCode.');
    }

    const internalLength = convertedDimension(carton.lengthMm, lengthUnit, 'lengthMm', index);
    const internalWidth = convertedDimension(carton.widthMm, lengthUnit, 'widthMm', index);
    const internalHeight = convertedDimension(carton.heightMm, lengthUnit, 'heightMm', index);

    if (!Number.isSafeInteger(carton.quantityAvailable) || carton.quantityAvailable < 0) {
      return invalidCarton(index, 'quantityAvailable must be a nonnegative safe whole number.');
    }

    const external = [
      carton.externalLengthMm,
      carton.externalWidthMm,
      carton.externalHeightMm,
    ] as const;
    const suppliedExternal = external.filter(value => value !== undefined).length;
    if (suppliedExternal !== 0 && suppliedExternal !== 3) {
      return invalidCarton(index, 'external dimensions must include all three values or none.');
    }
    const externalLength = suppliedExternal === 3
      ? convertedDimension(carton.externalLengthMm!, lengthUnit, 'externalLengthMm', index)
      : '';
    const externalWidth = suppliedExternal === 3
      ? convertedDimension(carton.externalWidthMm!, lengthUnit, 'externalWidthMm', index)
      : '';
    const externalHeight = suppliedExternal === 3
      ? convertedDimension(carton.externalHeightMm!, lengthUnit, 'externalHeightMm', index)
      : '';

    const maxGrossWeight = convertedWeight(
      carton.maxGrossWeightG,
      weightUnit,
      'maxGrossWeightG',
      index
    );
    const emptyBoxWeight = convertedWeight(
      carton.emptyBoxWeightG,
      weightUnit,
      'emptyBoxWeightG',
      index
    );
    const rowWeightUnit = maxGrossWeight !== '' || emptyBoxWeight !== '' ? weightUnit : '';

    const costPerBox = carton.costPerBox === undefined
      ? ''
      : String(nonnegativeFinite(carton.costPerBox, 'costPerBox', index));

    return [
      name,
      cartonCode,
      internalLength,
      internalWidth,
      internalHeight,
      lengthUnit,
      String(carton.quantityAvailable),
      externalLength,
      externalWidth,
      externalHeight,
      maxGrossWeight,
      emptyBoxWeight,
      rowWeightUnit,
      costPerBox,
    ].map(csvCell).join(',');
  });

  return `\uFEFF${BUSINESS_CARTONS_CSV_COLUMNS.join(',')}\r\n${rows.join('\r\n')}\r\n`;
}
