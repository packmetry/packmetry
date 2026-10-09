import { describe, expect, it } from 'vitest';
import {
  BUSINESS_PRODUCTS_CSV_COLUMNS,
  parseBusinessProductsCsv,
} from '../browser/business-products-csv.js';

const HEADER = BUSINESS_PRODUCTS_CSV_COLUMNS.join(',');
const line = (
  fields: string[] = [
    'Ceramic mug', 'MUG-01', '8', '8', '9.5', 'cm', '12',
    '0.5', 'kg', 'upright',
  ]
) => fields.join(',');

function expectError(csv: string, code: string, atLine?: number) {
  const result = parseBusinessProductsCsv(csv);
  expect(result.ok).toBe(false);
  if (result.ok) throw new Error('Expected invalid CSV.');
  expect(result.error.code).toBe(code);
  if (atLine !== undefined) expect(result.error.line).toBe(atLine);
  expect(result.error.message.length).toBeGreaterThan(3);
}

describe('Business products CSV import', () => {
  it('documents a stable explicit unit-bearing schema', () => {
    expect(BUSINESS_PRODUCTS_CSV_COLUMNS).toEqual([
      'name', 'sku', 'length', 'width', 'height',
      'length_unit', 'quantity', 'unit_weight',
      'weight_unit', 'rotation_policy',
    ]);
  });

  it('parses dimensions into mm, weight into grams and keeps handling', () => {
    const result = parseBusinessProductsCsv(`${HEADER}\n${line()}\n`);
    expect(result).toEqual({
      ok: true,
      products: [{
        name: 'Ceramic mug',
        sku: 'MUG-01',
        lengthMm: 80,
        widthMm: 80,
        heightMm: 95,
        quantity: 12,
        unitWeightG: 500,
        rotationPolicy: 'upright',
      }],
    });
  });

  it('keeps missing optional mass and handling unknown rather than inventing values', () => {
    const result = parseBusinessProductsCsv(
      `${HEADER}\n${line(['Gift box', '', '10', '8', '4', 'cm', '3', '', '', ''])}\n`
    );
    expect(result).toEqual({
      ok: true,
      products: [{
        name: 'Gift box', sku: '',
        lengthMm: 100, widthMm: 80, heightMm: 40,
        quantity: 3, unitWeightG: undefined,
      }],
    });
  });

  it('accepts a SKU when the product name is empty', () => {
    const result = parseBusinessProductsCsv(
      `${HEADER}\n${line(['', 'SKU1', '1', '2', '3', 'in', '1', '', '', 'fixed'])}`
    );
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error('Expected valid CSV.');
    expect(result.products[0]?.lengthMm).toBeCloseTo(25.4);
    expect(result.products[0]?.rotationPolicy).toBe('fixed');
  });

  it('accepts reordered case-insensitive column headers', () => {
    const headers = ['QUANTITY', ...BUSINESS_PRODUCTS_CSV_COLUMNS.filter(x => x !== 'quantity')];
    const values = ['2', 'Tape', 'T-01', '5', '4', '3', 'cm', '', '', ''];
    const result = parseBusinessProductsCsv(`${headers.join(',')}\n${values.join(',')}`);
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error('Expected valid CSV.');
    expect(result.products[0]?.quantity).toBe(2);
    expect(result.products[0]?.lengthMm).toBe(50);
  });

  it('handles UTF-8 BOM, CRLF and blank lines', () => {
    const result = parseBusinessProductsCsv(
      `\uFEFF${HEADER}\r\n\r\n${line()}\r\n\r\n`
    );
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error('Expected valid CSV.');
    expect(result.products).toHaveLength(1);
  });

  it('handles quoted commas, escaped quotes and multiline names', () => {
    const row = '"Mug, \"\"large\"\"\nblue",M-01,80,80,90,mm,1,,,any';
    const result = parseBusinessProductsCsv(`${HEADER}\n${row}\n`);
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error('Expected valid CSV.');
    expect(result.products[0]?.name).toBe('Mug, "large"\nblue');
  });

  it('handles inches, feet, meters, ounces and pounds via canonical helpers', () => {
    const rows = [
      line(['Inch item', '', '1', '2', '3', 'in', '1', '2', 'oz', 'any']),
      line(['Foot item', '', '1', '1', '1', 'ft', '1', '1', 'lb', 'any']),
      line(['Meter item', '', '1', '1', '1', 'm', '1', '1', 'g', 'any']),
    ];
    const result = parseBusinessProductsCsv(`${HEADER}\n${rows.join('\n')}`);
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error('Expected valid CSV.');
    expect(result.products[0]?.lengthMm).toBeCloseTo(25.4);
    expect(result.products[0]?.unitWeightG).toBeCloseTo(56.69904625);
    expect(result.products[1]?.lengthMm).toBeCloseTo(304.8);
    expect(result.products[1]?.unitWeightG).toBeCloseTo(453.59237);
    expect(result.products[2]?.lengthMm).toBe(1000);
  });

  it('does not add workspace IDs or mutate any existing project', () => {
    const result = parseBusinessProductsCsv(`${HEADER}\n${line()}`);
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error('Expected valid CSV.');
    expect(result.products[0]).not.toHaveProperty('id');
  });

  it('rejects empty input or header-only files', () => {
    expectError('', 'empty-file');
    expectError(' \r\n ', 'empty-file');
    expectError(`${HEADER}\n`, 'empty-file');
  });

  it('rejects missing, duplicate and unknown headers', () => {
    expectError('name,sku,length\na,b,1', 'invalid-header');
    expectError(`${HEADER.replace('sku', 'name')}\n${line()}`, 'invalid-header');
    expectError(`${HEADER.replace('sku', 'unknown')}\n${line()}`, 'invalid-header');
  });

  it('rejects mismatched column counts with the correct row line', () => {
    expectError(`${HEADER}\n${line()}\nName,SKU`, 'invalid-row', 3);
  });

  it('rejects malformed quoted CSV instead of shifting fields', () => {
    expectError(`${HEADER}\n"Unclosed,SKU,1,2,3,cm,1,,,any`, 'invalid-csv', 2);
    expectError(`${HEADER}\n"Closed"oops,SKU,1,2,3,cm,1,,,any`, 'invalid-csv', 2);
    expectError(`${HEADER}\nBad"quote,SKU,1,2,3,cm,1,,,any`, 'invalid-csv', 2);
  });

  it('rejects zero, negative, nonnumeric and nonfinite dimensions', () => {
    for (const value of ['0', '-1', 'abc', 'Infinity', '']) {
      const fields = ['Product', '', value, '2', '3', 'cm', '1', '', '', ''];
      expectError(`${HEADER}\n${line(fields)}`, 'invalid-row', 2);
    }
  });

  it('rejects overflow after canonical dimension conversion', () => {
    expectError(
      `${HEADER}\n${line(['Huge', '', '1e308', '1', '1', 'm', '1', '', '', ''])}`,
      'invalid-row', 2
    );
  });

  it('rejects invalid quantity and non-safe integers', () => {
    for (const quantity of ['0', '-2', '1.5', 'Infinity', '9007199254740992', '']) {
      expectError(
        `${HEADER}\n${line(['P', '', '1', '1', '1', 'mm', quantity, '', '', ''])}`,
        'invalid-row', 2
      );
    }
  });

  it('rejects unsupported or missing length units', () => {
    for (const unit of ['yards', '', 'kg']) {
      expectError(
        `${HEADER}\n${line(['P', '', '1', '1', '1', unit, '1', '', '', ''])}`,
        'invalid-row', 2
      );
    }
  });

  it('rejects orphan weight units and missing or invalid weight units', () => {
    for (const pair of [['', 'g'], ['10', ''], ['10', 'cm'], ['0', 'kg'], ['-2', 'kg']]) {
      expectError(
        `${HEADER}\n${line(['P', '', '1', '1', '1', 'mm', '1', pair[0]!, pair[1]!, ''])}`,
        'invalid-row', 2
      );
    }
  });

  it('rejects invalid handling and requires a name or SKU', () => {
    expectError(
      `${HEADER}\n${line(['P', '', '1', '1', '1', 'mm', '1', '', '', 'fragile'])}`,
      'invalid-row', 2
    );
    expectError(
      `${HEADER}\n${line(['', '', '1', '1', '1', 'mm', '1', '', '', ''])}`,
      'invalid-row', 2
    );
  });

  it('rejects an entire multi-row import if any later row is bad', () => {
    const result = parseBusinessProductsCsv(
      `${HEADER}\n${line()}\n${line(['Bad', '', '1', '0', '3', 'cm', '1', '', '', ''])}`
    );
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error('Expected failed import.');
    expect(result.error.line).toBe(3);
      });
  it('rejects formula-prefixed product names and SKUs', () => {
    for (const unsafe of [
      '=1+1',
      '+1+1',
      '-10',
      '@SUM(1)',
      '\t=2+2',
    ]) {
      expectError(
        `${HEADER}\n${line([
          unsafe, '', '1', '2', '3', 'mm',
          '1', '', '', '',
        ])}`,
        'invalid-row',
        2
      );

      expectError(
        `${HEADER}\n${line([
          'Safe product', unsafe, '1', '2', '3',
          'mm', '1', '', '', '',
        ])}`,
        'invalid-row',
        2
      );
    }
  });
  });
