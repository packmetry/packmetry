import { describe, expect, it } from 'vitest';
import {
  BUSINESS_CARTONS_CSV_COLUMNS,
  parseBusinessCartonsCsv,
} from '../browser/business-cartons-csv.js';

const HEADER = BUSINESS_CARTONS_CSV_COLUMNS.join(',');
const row = (values: string[] = [
  'Mailer', 'BX-01', '40', '30', '20', 'cm', '12',
  '41', '31', '21', '10', '0.25', 'kg', '1.5',
]) => values.join(',');

function invalid(text: string, code: string, line?: number) {
  const result = parseBusinessCartonsCsv(text);
  expect(result.ok).toBe(false);
  if (result.ok) throw new Error('Expected invalid CSV.');
  expect(result.error.code).toBe(code);
  if (line !== undefined) expect(result.error.line).toBe(line);
  expect(result.error.message).toBeTruthy();
}

describe('Business cartons CSV import', () => {
  it('uses an explicit 14-column schema', () => {
    expect(BUSINESS_CARTONS_CSV_COLUMNS).toHaveLength(14);
    expect(BUSINESS_CARTONS_CSV_COLUMNS).toContain('length_unit');
    expect(BUSINESS_CARTONS_CSV_COLUMNS).toContain('weight_unit');
  });

  it('normalizes internal/external dimensions and mass without assigning IDs', () => {
    expect(parseBusinessCartonsCsv(`${HEADER}\n${row()}\n`)).toEqual({
      ok: true,
      cartons: [{
        name: 'Mailer', cartonCode: 'BX-01',
        lengthMm: 400, widthMm: 300, heightMm: 200,
        externalLengthMm: 410, externalWidthMm: 310, externalHeightMm: 210,
        quantityAvailable: 12, maxGrossWeightG: 10000,
        emptyBoxWeightG: 250, costPerBox: 1.5,
      }],
    });
  });

  it('preserves unavailable stock and free cartons as zero', () => {
    const result = parseBusinessCartonsCsv(`${HEADER}\n${row([
      '', 'BX-Z', '100', '90', '80', 'mm', '0',
      '', '', '', '', '', '', '0',
    ])}`);
    expect(result).toEqual({ ok: true, cartons: [{
      name: '', cartonCode: 'BX-Z',
      lengthMm: 100, widthMm: 90, heightMm: 80,
      quantityAvailable: 0, maxGrossWeightG: undefined,
      emptyBoxWeightG: undefined, costPerBox: 0,
    }] });
  });

  it('preserves unknown optional values, not invented zeros', () => {
    const result = parseBusinessCartonsCsv(`${HEADER}\n${row([
      'Box', '', '1', '2', '3', 'm', '2',
      '', '', '', '', '', '', '',
    ])}`);
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error('Expected valid CSV.');
    const carton = result.cartons[0];
    expect(carton?.lengthMm).toBe(1000);
    expect(carton?.maxGrossWeightG).toBeUndefined();
    expect(carton?.costPerBox).toBeUndefined();
    expect(carton).not.toHaveProperty('externalLengthMm');
    expect(carton).not.toHaveProperty('id');
    expect(carton).not.toHaveProperty('libraryId');
  });

  it('converts inches/ounces and feet/pounds', () => {
    const rows = [
      row(['Inch box', '', '1', '2', '3', 'in', '1', '', '', '', '4', '', 'oz', '']),
      row(['Foot box', '', '1', '1', '1', 'ft', '1', '', '', '', '', '1', 'lb', '']),
    ];
    const result = parseBusinessCartonsCsv(`${HEADER}\n${rows.join('\n')}`);
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error('Expected valid CSV.');
    expect(result.cartons[0]?.lengthMm).toBeCloseTo(25.4);
    expect(result.cartons[0]?.maxGrossWeightG).toBeCloseTo(113.3980925);
    expect(result.cartons[1]?.lengthMm).toBeCloseTo(304.8);
    expect(result.cartons[1]?.emptyBoxWeightG).toBeCloseTo(453.59237);
  });

  it('supports reordered headers, BOM, CRLF, quoted commas and multiline values', () => {
    const columns = [...BUSINESS_CARTONS_CSV_COLUMNS];
    const data: Record<string, string> = {
      name: '"Mail, \"\"premium\"\"\nlarge"',
      carton_code: 'BX-1', internal_length: '10', internal_width: '20', internal_height: '30',
      length_unit: 'cm', quantity_available: '1', external_length: '', external_width: '',
      external_height: '', max_gross_weight: '', empty_box_weight: '', weight_unit: '', cost_per_box: '',
    };
    columns.reverse();
    const csv = `\uFEFF${columns.map(x => x.toUpperCase()).join(',')}\r\n\r\n${columns.map(x => data[x]).join(',')}\r\n`;
    const result = parseBusinessCartonsCsv(csv);
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error('Expected valid CSV.');
    expect(result.cartons[0]?.name).toBe('Mail, "premium"\nlarge');
    expect(result.cartons[0]?.lengthMm).toBe(100);
  });

  it('rejects empty and header-only files', () => {
    invalid('', 'empty-file');
    invalid(`${HEADER}\r\n`, 'empty-file');
  });

  it('rejects duplicate, missing or unknown headers', () => {
    invalid(`${HEADER.replace('carton_code', 'name')}\n${row()}`, 'invalid-header');
    invalid('name,carton_code\na,b', 'invalid-header');
    invalid(`${HEADER.replace('carton_code', 'other')}\n${row()}`, 'invalid-header');
  });

  it('rejects malformed quotes and incorrect column counts', () => {
    invalid(`${HEADER}\n"Unclosed,code,1`, 'invalid-csv', 2);
    invalid(`${HEADER}\n"Closed"oops,code,1`, 'invalid-csv', 2);
    invalid(`${HEADER}\nBad"quote,code,1`, 'invalid-csv', 2);
    invalid(`${HEADER}\n${row()}\nBox,code`, 'invalid-row', 3);
  });

  it('requires a name or carton code and valid length units', () => {
    invalid(`${HEADER}\n${row(['', '', '1', '2', '3', 'cm', '1', '', '', '', '', '', '', ''])}`, 'invalid-row', 2);
    invalid(`${HEADER}\n${row(['B', '', '1', '2', '3', 'yards', '1', '', '', '', '', '', '', ''])}`, 'invalid-row', 2);
  });

  it('rejects zero/negative/nonfinite dimensions and converted overflow', () => {
    for (const length of ['0', '-2', 'Infinity', 'bad', '']) {
      invalid(`${HEADER}\n${row(['B', '', length, '2', '3', 'cm', '1', '', '', '', '', '', '', ''])}`, 'invalid-row', 2);
    }
    invalid(`${HEADER}\n${row(['B', '', '1e308', '2', '3', 'm', '1', '', '', '', '', '', '', ''])}`, 'invalid-row', 2);
  });

  it('rejects fractional, negative, unsafe and missing stock quantity', () => {
    for (const quantity of ['-1', '1.5', '9007199254740992', '']) {
      invalid(`${HEADER}\n${row(['B', '', '1', '2', '3', 'cm', quantity, '', '', '', '', '', '', ''])}`, 'invalid-row', 2);
    }
  });

  it('rejects partial external dimensions and nonfinite converted externals', () => {
    invalid(`${HEADER}\n${row(['B', '', '1', '2', '3', 'cm', '1', '4', '', '5', '', '', '', ''])}`, 'invalid-row', 2);
    invalid(`${HEADER}\n${row(['B', '', '1', '2', '3', 'm', '1', '1e308', '2', '3', '', '', '', ''])}`, 'invalid-row', 2);
  });

  it('rejects unsupported, orphan and missing weight units or invalid mass', () => {
    for (const [mass, unit] of [['1', ''], ['', 'g'], ['1', 'cm'], ['-1', 'kg'], ['0', 'g'], ['1e308', 'kg']]) {
      invalid(`${HEADER}\n${row(['B', '', '1', '2', '3', 'cm', '1', '', '', '', mass!, '', unit!, ''])}`, 'invalid-row', 2);
    }
  });

  it('rejects negative/nonfinite cost but accepts cost zero', () => {
    for (const cost of ['-1', 'Infinity', 'x']) {
      invalid(`${HEADER}\n${row(['B', '', '1', '2', '3', 'cm', '1', '', '', '', '', '', '', cost])}`, 'invalid-row', 2);
    }
  });

  it('rejects the whole file if any later row fails', () => {
    invalid(`${HEADER}\n${row()}\n${row(['B', '', '0', '2', '3', 'cm', '1', '', '', '', '', '', '', ''])}`, 'invalid-row', 3);
  });
});
