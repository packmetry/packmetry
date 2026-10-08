
import { describe, expect, it } from 'vitest';
import {
  BUSINESS_PRODUCTS_CSV_COLUMNS,
  parseBusinessProductsCsv,
  type ImportedBusinessCsvProduct,
} from '../browser/business-products-csv.js';
import { serializeBusinessProductsCsv } from '../browser/business-products-csv-export.js';

const example: ImportedBusinessCsvProduct = {
  name: 'Ceramic mug',
  sku: 'MUG-01',
  lengthMm: 80,
  widthMm: 80,
  heightMm: 95,
  quantity: 12,
  unitWeightG: 500,
  rotationPolicy: 'upright',
};

function roundTrip(products: readonly ImportedBusinessCsvProduct[], options?: Parameters<typeof serializeBusinessProductsCsv>[1]) {
  return parseBusinessProductsCsv(serializeBusinessProductsCsv(products, options));
}

describe('Business products CSV export', () => {
  it('uses the existing import schema, UTF-8 BOM and CRLF rows', () => {
    const csv = serializeBusinessProductsCsv([example]);
    expect(csv).toBe(`\uFEFF${BUSINESS_PRODUCTS_CSV_COLUMNS.join(',')}\r\nCeramic mug,MUG-01,80,80,95,mm,12,500,g,upright\r\n`);
  });

  it('round-trips a product with canonical mm and grams', () => {
    expect(roundTrip([example])).toEqual({ ok: true, products: [example] });
  });

  it('supports workspace products with IDs but does not leak IDs into CSV', () => {
    const workspaceProduct = { id: 'business-product-17', ...example };
    const csv = serializeBusinessProductsCsv([workspaceProduct]);
    expect(csv).not.toContain('business-product-17');
    expect(parseBusinessProductsCsv(csv)).toEqual({ ok: true, products: [example] });
  });

  it('keeps missing weight and rotation blank, without defaults', () => {
    const product: ImportedBusinessCsvProduct = {
      name: '', sku: 'SKU-11', lengthMm: 30, widthMm: 40,
      heightMm: 50, quantity: 1, unitWeightG: undefined,
    };
    const csv = serializeBusinessProductsCsv([product]);
    expect(csv).toContain('SKU-11,30,40,50,mm,1,,,\r\n');
    expect(roundTrip([product])).toEqual({ ok: true, products: [product] });
  });

  it('escapes commas, double quotes, multiline text and Unicode without breaking import', () => {
    const product: ImportedBusinessCsvProduct = {
      ...example,
      name: 'Café, "large"\nblue',
      sku: 'MUG,"XL"',
    };
    const csv = serializeBusinessProductsCsv([product]);
    expect(csv).toContain('"Café, ""large""\nblue"');
    expect(csv).toContain('"MUG,""XL"""');
    expect(roundTrip([product])).toEqual({ ok: true, products: [product] });
  });

  it('serializes multiple items in stable input order without modifying the inputs', () => {
    const second: ImportedBusinessCsvProduct = {
      name: 'Gift box', sku: '', lengthMm: 100, widthMm: 200,
      heightMm: 30, quantity: 2, unitWeightG: undefined,
      rotationPolicy: 'fixed',
    };
    const source = [example, second];
    const snapshot = JSON.stringify(source);
    expect(roundTrip(source)).toEqual({ ok: true, products: source });
    expect(JSON.stringify(source)).toBe(snapshot);
  });

  it('converts dimensions and weights with explicit units', () => {
    const result = roundTrip([example], { lengthUnit: 'cm', weightUnit: 'kg' });
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error('Expected valid CSV export.');
    expect(result.products[0]?.lengthMm).toBe(80);
    expect(result.products[0]?.heightMm).toBe(95);
    expect(result.products[0]?.unitWeightG).toBe(500);
    const csv = serializeBusinessProductsCsv([example], { lengthUnit: 'cm', weightUnit: 'kg' });
    expect(csv).toContain('8,8,9.5,cm,12,0.5,kg,upright');
  });

  it('round-trips imperial export with conversion tolerance', () => {
    const result = roundTrip([example], { lengthUnit: 'in', weightUnit: 'lb' });
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error('Expected valid CSV export.');
    expect(result.products[0]?.lengthMm).toBeCloseTo(example.lengthMm, 8);
    expect(result.products[0]?.widthMm).toBeCloseTo(example.widthMm, 8);
    expect(result.products[0]?.heightMm).toBeCloseTo(example.heightMm, 8);
    expect(result.products[0]?.unitWeightG).toBeCloseTo(500, 8);
  });

  it('rejects empty arrays and invalid unit choices', () => {
    expect(() => serializeBusinessProductsCsv([])).toThrow(/at least one product/);
    expect(() => serializeBusinessProductsCsv([example], { lengthUnit: 'yd' as 'mm' })).toThrow(/length unit/);
    expect(() => serializeBusinessProductsCsv([example], { weightUnit: 'ton' as 'g' })).toThrow(/weight unit/);
  });

  it('rejects missing identifiers, malformed dimensions, quantities or mass', () => {
    expect(() => serializeBusinessProductsCsv([{ ...example, name: '', sku: '' }])).toThrow(/name or SKU/);
    for (const lengthMm of [0, -1, Number.POSITIVE_INFINITY, NaN]) {
      expect(() => serializeBusinessProductsCsv([{ ...example, lengthMm }])).toThrow(/lengthMm/);
    }
    for (const quantity of [0, 1.5, Number.MAX_SAFE_INTEGER + 1]) {
      expect(() => serializeBusinessProductsCsv([{ ...example, quantity }])).toThrow(/quantity/);
    }
    expect(() => serializeBusinessProductsCsv([{ ...example, unitWeightG: 0 }])).toThrow(/unitWeightG/);
  });

  it('rejects unsupported rotation rather than silently changing handling', () => {
    const invalid = { ...example, rotationPolicy: 'vertical-axis-only' as 'any' };
    expect(() => serializeBusinessProductsCsv([invalid])).toThrow(/rotationPolicy/);
  });

  it('rejects spreadsheet-formula prefixes without rewriting user data', () => {
    for (const unsafe of ['=SUM(1,2)', '+2+2', '-1+1', '@SUM(1)', '\t=cmd']) {
      expect(() => serializeBusinessProductsCsv([{ ...example, name: unsafe }])).toThrow(/spreadsheet formula/);
      expect(() => serializeBusinessProductsCsv([{ ...example, sku: unsafe }])).toThrow(/spreadsheet formula/);
    }
  });

  it('rejects numeric export underflow and does not fabricate zero dimensions', () => {
    expect(() => serializeBusinessProductsCsv([
      { ...example, lengthMm: Number.MIN_VALUE },
    ], { lengthUnit: 'ft' })).toThrow(/converted length/);
  });
});
