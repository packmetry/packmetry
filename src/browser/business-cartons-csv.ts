import type { RecentBusinessProjectCarton } from './business-recent-projects.js';
import { isLengthUnit, isMassUnit } from '../core/units/types.js';
import { normalizeDimensions } from '../core/units/dimensions.js';
import { toGrams } from '../core/units/mass.js';

/** CSV cartons have no workspace ID or saved-library association. */
export type ImportedBusinessCsvCarton = Omit<
  RecentBusinessProjectCarton,
  'id' | 'libraryId'
>;

export const BUSINESS_CARTONS_CSV_COLUMNS = [
  'name',
  'carton_code',
  'internal_length',
  'internal_width',
  'internal_height',
  'length_unit',
  'quantity_available',
  'external_length',
  'external_width',
  'external_height',
  'max_gross_weight',
  'empty_box_weight',
  'weight_unit',
  'cost_per_box',
] as const;

export type BusinessCartonsCsvErrorCode =
  | 'empty-file'
  | 'invalid-csv'
  | 'invalid-header'
  | 'invalid-row';

export interface BusinessCartonsCsvError {
  code: BusinessCartonsCsvErrorCode;
  message: string;
  line: number;
}

export type BusinessCartonsCsvImportResult =
  | { ok: true; cartons: ImportedBusinessCsvCarton[] }
  | { ok: false; error: BusinessCartonsCsvError };

interface CsvRecord {
  line: number;
  cells: string[];
}

class CsvFailure extends Error {
  constructor(
    readonly code: BusinessCartonsCsvErrorCode,
    readonly line: number,
    message: string
  ) {
    super(message);
    this.name = 'CsvFailure';
  }
}

/** Parse quoted CSV, escaped quotes, BOM, CRLF and multiline fields. */
function readCsvRecords(text: string): CsvRecord[] {
  const input = text.startsWith('\uFEFF') ? text.slice(1) : text;
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

  for (let i = 0; i < input.length; i++) {
    const ch = input[i];
    if (ch === undefined) continue;
    const newline = ch === '\r' || ch === '\n';
    const sequence = ch === '\r' && input[i + 1] === '\n' ? '\r\n' : ch;

    if (state === 'quoted') {
      if (ch === '"') {
        if (input[i + 1] === '"') {
          cell += '"';
          i++;
        } else {
          state = 'closed';
        }
      } else {
        cell += sequence;
        if (newline) {
          line++;
          if (sequence === '\r\n') i++;
        }
      }
      continue;
    }
    if (ch === ',') {
      endCell();
      continue;
    }
    if (newline) {
      endCell();
      line++;
      endRecord();
      if (sequence === '\r\n') i++;
      continue;
    }
    if (ch === '"') {
      if (state === 'start') {
        state = 'quoted';
        continue;
      }
      throw new CsvFailure('invalid-csv', line, `Line ${line}: unexpected quote.`);
    }
    if (state === 'closed') {
      throw new CsvFailure('invalid-csv', line, `Line ${line}: text after closing quote.`);
    }
    state = 'plain';
    cell += ch;
  }

  if (state === 'quoted') {
    throw new CsvFailure('invalid-csv', recordLine, `Line ${recordLine}: unclosed quote.`);
  }
  if (state !== 'start' || cell !== '' || cells.length > 0) {
    endCell();
    endRecord();
  }
  return records;
}

function invalidRow(line: number, message: string): never {
  throw new CsvFailure('invalid-row', line, `Line ${line}: ${message}`);
}

function numberCell(
  text: string,
  label: string,
  line: number,
  allowZero = false
): number {
  const value = Number(text.trim());
  if (
    text.trim() === '' ||
    !Number.isFinite(value) ||
    (allowZero ? value < 0 : value <= 0)
  ) {
    return invalidRow(line, `${label} must be a ${allowZero ? 'nonnegative' : 'positive'} finite number.`);
  }
  return value;
}

function optionalNumber(
  text: string,
  label: string,
  line: number,
  allowZero = false
): number | undefined {
  return text.trim() === '' ? undefined : numberCell(text, label, line, allowZero);
}

function parseCarton(
  record: CsvRecord,
  positions: ReadonlyMap<string, number>
): ImportedBusinessCsvCarton {
  const get = (column: string) => record.cells[positions.get(column) ?? -1] ?? '';
  const line = record.line;
  const name = get('name').trim();
  const cartonCode = get('carton_code').trim();
  if (name === '' && cartonCode === '') {
    return invalidRow(line, 'provide a carton name or carton_code.');
  }

  const lengthUnit = get('length_unit').trim().toLowerCase();
  if (!isLengthUnit(lengthUnit)) {
    return invalidRow(line, 'length_unit must be mm, cm, m, in, or ft.');
  }

  const internal = normalizeDimensions({
    length: numberCell(get('internal_length'), 'internal_length', line),
    width: numberCell(get('internal_width'), 'internal_width', line),
    height: numberCell(get('internal_height'), 'internal_height', line),
  }, lengthUnit);
  if (Object.values(internal).some(value => !Number.isFinite(value) || value <= 0)) {
    return invalidRow(line, 'converted internal dimensions are outside the numeric range.');
  }

  const quantityAvailable = numberCell(get('quantity_available'), 'quantity_available', line, true);
  if (!Number.isSafeInteger(quantityAvailable)) {
    return invalidRow(line, 'quantity_available must be a nonnegative safe whole number.');
  }

  const externalText = [get('external_length'), get('external_width'), get('external_height')];
  const supplied = externalText.filter(text => text.trim() !== '').length;
  if (supplied !== 0 && supplied !== 3) {
    return invalidRow(line, 'external dimensions require all three values or none.');
  }
  let external: { length: number; width: number; height: number } | undefined;
  if (supplied === 3) {
    external = normalizeDimensions({
      length: numberCell(externalText[0]!, 'external_length', line),
      width: numberCell(externalText[1]!, 'external_width', line),
      height: numberCell(externalText[2]!, 'external_height', line),
    }, lengthUnit);
    if (Object.values(external).some(value => !Number.isFinite(value) || value <= 0)) {
      return invalidRow(line, 'converted external dimensions are outside the numeric range.');
    }
  }

  const grossText = get('max_gross_weight');
  const tareText = get('empty_box_weight');
  const hasWeight = grossText.trim() !== '' || tareText.trim() !== '';
  const weightUnit = get('weight_unit').trim().toLowerCase();
  if (hasWeight ? !isMassUnit(weightUnit) : weightUnit !== '') {
    return invalidRow(line, hasWeight
      ? 'weight_unit must be g, kg, oz, or lb when a weight is supplied.'
      : 'weight_unit requires max_gross_weight or empty_box_weight.');
  }

  let maxGrossWeightG: number | undefined;
  let emptyBoxWeightG: number | undefined;
  if (hasWeight && isMassUnit(weightUnit)) {
    const max = optionalNumber(grossText, 'max_gross_weight', line);
    const tare = optionalNumber(tareText, 'empty_box_weight', line);
    if (max !== undefined) maxGrossWeightG = toGrams(max, weightUnit);
    if (tare !== undefined) emptyBoxWeightG = toGrams(tare, weightUnit);
    if (
      (maxGrossWeightG !== undefined && (!Number.isFinite(maxGrossWeightG) || maxGrossWeightG <= 0)) ||
      (emptyBoxWeightG !== undefined && (!Number.isFinite(emptyBoxWeightG) || emptyBoxWeightG <= 0))
    ) {
      return invalidRow(line, 'converted weight is outside the numeric range.');
    }
  }

  const costPerBox = optionalNumber(get('cost_per_box'), 'cost_per_box', line, true);
  return {
    name,
    cartonCode,
    lengthMm: internal.length,
    widthMm: internal.width,
    heightMm: internal.height,
    ...(external !== undefined ? {
      externalLengthMm: external.length,
      externalWidthMm: external.width,
      externalHeightMm: external.height,
    } : {}),
    quantityAvailable,
    maxGrossWeightG,
    emptyBoxWeightG,
    costPerBox,
  };
}

/**
 * Parse the entire CSV transactionally. No workspace/library state is changed.
 * Only the 14 documented columns are accepted, in any order.
 */
export function parseBusinessCartonsCsv(text: string): BusinessCartonsCsvImportResult {
  try {
    const records = readCsvRecords(text);
    const header = records[0];
    if (!header) {
      throw new CsvFailure('empty-file', 1, 'CSV file is empty.');
    }
    const columns = header.cells.map(cell => cell.trim().toLowerCase());
    const expected = new Set<string>(BUSINESS_CARTONS_CSV_COLUMNS);
    if (
      columns.length !== BUSINESS_CARTONS_CSV_COLUMNS.length ||
      new Set(columns).size !== expected.size ||
      columns.some(column => !expected.has(column))
    ) {
      throw new CsvFailure('invalid-header', header.line,
        `Line ${header.line}: CSV headers must include exactly: ${BUSINESS_CARTONS_CSV_COLUMNS.join(', ')}.`);
    }
    if (records.length === 1) {
      throw new CsvFailure('empty-file', header.line, 'CSV has a header but no carton rows.');
    }

    const positions = new Map(columns.map((column, index) => [column, index]));
    const cartons = records.slice(1).map(record => {
      if (record.cells.length !== columns.length) {
        return invalidRow(record.line,
          `expected ${columns.length} columns but found ${record.cells.length}.`);
      }
      return parseCarton(record, positions);
    });
    return { ok: true, cartons };
  } catch (error) {
    if (error instanceof CsvFailure) {
      return { ok: false, error: { code: error.code, message: error.message, line: error.line } };
    }
    return { ok: false, error: {
      code: 'invalid-csv', line: 1, message: 'CSV import could not be validated.',
    } };
  }
}
