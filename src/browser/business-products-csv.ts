import type {
  RecentBusinessProjectHandlingPolicy,
  RecentBusinessProjectProduct,
} from './business-recent-projects.js';
import {
  isLengthUnit,
  isMassUnit,
} from '../core/units/types.js';
import { normalizeDimensions } from '../core/units/dimensions.js';
import { toGrams } from '../core/units/mass.js';

/**
 * A validated CSV product without an assigned workspace ID.
 * The UI will allocate unique IDs when imported products are applied.
 */
export type ImportedBusinessCsvProduct = Omit<
  RecentBusinessProjectProduct,
  'id'
>;

export const BUSINESS_PRODUCTS_CSV_COLUMNS = [
  'name',
  'sku',
  'length',
  'width',
  'height',
  'length_unit',
  'quantity',
  'unit_weight',
  'weight_unit',
  'rotation_policy',
] as const;

export type BusinessProductsCsvErrorCode =
  | 'empty-file'
  | 'invalid-csv'
  | 'invalid-header'
  | 'invalid-row';

export interface BusinessProductsCsvError {
  code: BusinessProductsCsvErrorCode;
  message: string;
  line: number;
}

export type BusinessProductsCsvImportResult =
  | {
      ok: true;
      products: ImportedBusinessCsvProduct[];
    }
  | {
      ok: false;
      error: BusinessProductsCsvError;
    };

interface CsvRecord {
  line: number;
  cells: string[];
}

class CsvImportFailure extends Error {
  constructor(
    readonly code: BusinessProductsCsvErrorCode,
    readonly line: number,
    message: string
  ) {
    super(message);
    this.name = 'CsvImportFailure';
  }
}

/**
 * Strict comma-separated records with RFC-style quoted fields.
 * Supports escaped quotes, UTF-8 BOM, LF/CRLF and multiline values.
 * Rejects malformed quotes instead of silently changing cell positions.
 */
function readCsvRecords(text: string): CsvRecord[] {
  const input = text.startsWith('\uFEFF')
    ? text.slice(1)
    : text;
  const records: CsvRecord[] = [];
  let line = 1;
  let recordLine = 1;
  let cells: string[] = [];
  let cell = '';
  let state: 'start' | 'plain' | 'quoted' | 'closed' = 'start';

  const endCell = () => {
    cells.push(cell);
    cell = '';
    state = 'start';
  };

  const endRecord = () => {
    if (cells.some(value => value.trim() !== '')) {
      records.push({ line: recordLine, cells });
    }
    cells = [];
    recordLine = line;
  };

  for (let index = 0; index < input.length; index++) {
    const character = input[index];

    if (character === undefined) {
      continue;
    }

    const newline = character === '\r' || character === '\n';
    const sequence = character === '\r' && input[index + 1] === '\n'
      ? '\r\n'
      : character;

    if (state === 'quoted') {
      if (character === '"') {
        if (input[index + 1] === '"') {
          cell += '"';
          index++;
        } else {
          state = 'closed';
        }
      } else {
        cell += sequence;
        if (newline) {
          line++;
          if (sequence === '\r\n') {
            index++;
          }
        }
      }
      continue;
    }

    if (character === ',') {
      endCell();
      continue;
    }

    if (newline) {
      endCell();
      line++;
      endRecord();
      if (sequence === '\r\n') {
        index++;
      }
      continue;
    }

    if (character === '"') {
      if (state === 'start') {
        state = 'quoted';
        continue;
      }
      throw new CsvImportFailure(
        'invalid-csv',
        line,
        `Line ${line}: unexpected quote in CSV field.`
      );
    }

    if (state === 'closed') {
      throw new CsvImportFailure(
        'invalid-csv',
        line,
        `Line ${line}: unexpected text after closing quote.`
      );
    }

    state = 'plain';
    cell += character;
  }

  if (state === 'quoted') {
    throw new CsvImportFailure(
      'invalid-csv',
      recordLine,
      `Line ${recordLine}: CSV field has an unclosed quote.`
    );
  }

  if (state !== 'start' || cell !== '' || cells.length > 0) {
    endCell();
    endRecord();
  }

  return records;
}

function failRow(line: number, message: string): never {
  throw new CsvImportFailure(
    'invalid-row',
    line,
    `Line ${line}: ${message}`
  );
}

function requiredPositive(
  value: string,
  column: string,
  line: number
): number {
  const trimmed = value.trim();
  const number = Number(trimmed);
  if (trimmed === '' || !Number.isFinite(number) || number <= 0) {
    return failRow(line, `${column} must be a positive finite number.`);
  }
  return number;
}

function requiredQuantity(value: string, line: number): number {
  const quantity = requiredPositive(value, 'quantity', line);
  if (!Number.isSafeInteger(quantity)) {
    return failRow(line, 'quantity must be a positive safe whole number.');
  }
  return quantity;
}

function parseProduct(
  record: CsvRecord,
  positions: ReadonlyMap<string, number>
): ImportedBusinessCsvProduct {
  const get = (column: string): string =>
    record.cells[positions.get(column) ?? -1] ?? '';

  const name = get('name').trim();
  const sku = get('sku').trim();
  if (name === '' && sku === '') {
    return failRow(record.line, 'provide a product name or SKU.');
  }

  const lengthUnitValue = get('length_unit').trim().toLowerCase();
  if (!isLengthUnit(lengthUnitValue)) {
    return failRow(record.line, 'length_unit must be mm, cm, m, in, or ft.');
  }

  const rawDimensions = {
    length: requiredPositive(get('length'), 'length', record.line),
    width: requiredPositive(get('width'), 'width', record.line),
    height: requiredPositive(get('height'), 'height', record.line),
  };

  const dimensions = normalizeDimensions(rawDimensions, lengthUnitValue);
  if (
    !Number.isFinite(dimensions.length) ||
    !Number.isFinite(dimensions.width) ||
    !Number.isFinite(dimensions.height) ||
    dimensions.length <= 0 ||
    dimensions.width <= 0 ||
    dimensions.height <= 0
  ) {
    return failRow(record.line, 'converted dimensions are outside the numeric range.');
  }

  const weightValue = get('unit_weight').trim();
  const weightUnitValue = get('weight_unit').trim().toLowerCase();
  let unitWeightG: number | undefined;

  if (weightValue === '') {
    if (weightUnitValue !== '') {
      return failRow(record.line, 'weight_unit requires a unit_weight value.');
    }
  } else {
    const weight = requiredPositive(weightValue, 'unit_weight', record.line);
    if (!isMassUnit(weightUnitValue)) {
      return failRow(record.line, 'weight_unit must be g, kg, oz, or lb when unit_weight is given.');
    }
    unitWeightG = toGrams(weight, weightUnitValue);
    if (!Number.isFinite(unitWeightG) || unitWeightG <= 0) {
      return failRow(record.line, 'converted unit_weight is outside the numeric range.');
    }
  }

  const rotation = get('rotation_policy').trim().toLowerCase();
  const validRotations: readonly RecentBusinessProjectHandlingPolicy[] = [
    'any',
    'upright',
    'fixed',
  ];
  if (rotation !== '' && !validRotations.some(policy => policy === rotation)) {
    return failRow(record.line, 'rotation_policy must be any, upright, fixed, or blank.');
  }

  const product: ImportedBusinessCsvProduct = {
    name,
    sku,
    lengthMm: dimensions.length,
    widthMm: dimensions.width,
    heightMm: dimensions.height,
    quantity: requiredQuantity(get('quantity'), record.line),
    unitWeightG,
  };

  if (rotation !== '') {
    product.rotationPolicy = rotation as RecentBusinessProjectHandlingPolicy;
  }

  return product;
}

/**
 * Validate a business-products CSV as one transaction.
 * No workspace state is changed; invalid rows reject the entire import.
 * Column order is flexible but the ten documented columns are required.
 */
export function parseBusinessProductsCsv(
  text: string
): BusinessProductsCsvImportResult {
  try {
    const records = readCsvRecords(text);
    if (records.length === 0) {
      throw new CsvImportFailure('empty-file', 1, 'CSV file is empty.');
    }

    const header = records[0];
    if (!header) {
      throw new CsvImportFailure('empty-file', 1, 'CSV file is empty.');
    }

    const headers = header.cells.map(cell => cell.trim().toLowerCase());
    const expected = new Set<string>(BUSINESS_PRODUCTS_CSV_COLUMNS);
    if (
      headers.length !== BUSINESS_PRODUCTS_CSV_COLUMNS.length ||
      new Set(headers).size !== expected.size ||
      headers.some(column => !expected.has(column))
    ) {
      throw new CsvImportFailure(
        'invalid-header',
        header.line,
        `Line ${header.line}: CSV headers must include exactly: ${BUSINESS_PRODUCTS_CSV_COLUMNS.join(', ')}.`
      );
    }

    if (records.length === 1) {
      throw new CsvImportFailure(
        'empty-file',
        header.line,
        'CSV has a header but no product rows.'
      );
    }

    const positions = new Map(headers.map((column, index) => [column, index]));
    const products = records.slice(1).map(record => {
      if (record.cells.length !== headers.length) {
        return failRow(
          record.line,
          `expected ${headers.length} columns but found ${record.cells.length}.`
        );
      }
      return parseProduct(record, positions);
    });

    return { ok: true, products };
  } catch (error) {
    if (error instanceof CsvImportFailure) {
      return {
        ok: false,
        error: {
          code: error.code,
          message: error.message,
          line: error.line,
        },
      };
    }
    // Fail closed: do not accept partial imports for unexpected input failures.
    return {
      ok: false,
      error: {
        code: 'invalid-csv',
        message: 'CSV import could not be validated.',
        line: 1,
      },
    };
  }
}
