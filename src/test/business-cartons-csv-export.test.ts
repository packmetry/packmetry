import { describe, expect, it } from 'vitest';
import {
  BUSINESS_CARTONS_CSV_COLUMNS,
  parseBusinessCartonsCsv,
  type ImportedBusinessCsvCarton,
} from '../browser/business-cartons-csv.js';
import {
  serializeBusinessCartonsCsv,
  type BusinessCartonsCsvExportOptions,
} from '../browser/business-cartons-csv-export.js';

const mailer: ImportedBusinessCsvCarton = {
  name: 'Mailer',
  cartonCode: 'BX-01',
  lengthMm: 400,
  widthMm: 300,
  heightMm: 200,
  externalLengthMm: 410,
  externalWidthMm: 310,
  externalHeightMm: 210,
  quantityAvailable: 12,
  maxGrossWeightG: 10000,
  emptyBoxWeightG: 250,
  costPerBox: 1.5,
};

function roundTrip(
  cartons: readonly ImportedBusinessCsvCarton[],
  options?: BusinessCartonsCsvExportOptions
) {
  return parseBusinessCartonsCsv(serializeBusinessCartonsCsv(cartons, options));
}

describe('Business cartons CSV export', () => {
  it('uses the matching 14-column import schema, BOM and CRLF', () => {
    const csv = serializeBusinessCartonsCsv([mailer]);
    expect(csv).toBe(
      `\uFEFF${BUSINESS_CARTONS_CSV_COLUMNS.join(',')}\r\n` +
      'Mailer,BX-01,400,300,200,mm,12,410,310,210,10000,250,g,1.5\r\n'
    );
  });

  it('round-trips a complete canonical carton without assigning IDs', () => {
    expect(roundTrip([mailer])).toEqual({ ok: true, cartons: [mailer] });
  });

  it('does not export workspace IDs or saved carton library associations', () => {
    const carton = { id: 'business-carton-5', libraryId: 'saved-carton-7', ...mailer };
    const csv = serializeBusinessCartonsCsv([carton]);
    expect(csv).not.toContain('business-carton-5');
    expect(csv).not.toContain('saved-carton-7');
    expect(parseBusinessCartonsCsv(csv)).toEqual({ ok: true, cartons: [mailer] });
  });

  it('preserves stock zero, free cost and unknown optional values', () => {
    const carton: ImportedBusinessCsvCarton = {
      name: '', cartonCode: 'BX-Z', lengthMm: 100, widthMm: 90,
      heightMm: 80, quantityAvailable: 0, maxGrossWeightG: undefined,
      emptyBoxWeightG: undefined, costPerBox: 0,
    };
    expect(serializeBusinessCartonsCsv([carton])).toContain(
      'BX-Z,100,90,80,mm,0,,,,,,,0\r\n'
    );
    expect(roundTrip([carton])).toEqual({ ok: true, cartons: [carton] });
  });

  it('keeps optional cost blank rather than treating it as free', () => {
    const carton: ImportedBusinessCsvCarton = {
      ...mailer,
      maxGrossWeightG: undefined,
      emptyBoxWeightG: undefined,
      costPerBox: undefined,
    };
    expect(roundTrip([carton])).toEqual({ ok: true, cartons: [carton] });
    expect(serializeBusinessCartonsCsv([carton])).toContain('210,,,,\r\n');
  });

  it('escapes commas, quotes, newlines and non-ASCII text', () => {
    const carton = { ...mailer, name: 'Boîte, "grand"\nblue', cartonCode: 'BX,"A"' };
    const csv = serializeBusinessCartonsCsv([carton]);
    expect(csv).toContain('"Boîte, ""grand""\nblue"');
    expect(csv).toContain('"BX,""A"""');
    expect(roundTrip([carton])).toEqual({ ok: true, cartons: [carton] });
  });

  it('serializes multiple cartons in order without modifying them', () => {
    const second: ImportedBusinessCsvCarton = {
      name: 'Gift box', cartonCode: '', lengthMm: 120,
      widthMm: 80, heightMm: 60, quantityAvailable: 2,
      maxGrossWeightG: undefined, emptyBoxWeightG: undefined,
      costPerBox: undefined,
    };
    const source = [mailer, second];
    const before = JSON.stringify(source);
    expect(roundTrip(source)).toEqual({ ok: true, cartons: source });
    expect(JSON.stringify(source)).toBe(before);
  });

  it('round-trips centimeter and kilogram exports exactly for these values', () => {
    const csv = serializeBusinessCartonsCsv([mailer], { lengthUnit: 'cm', weightUnit: 'kg' });
    expect(csv).toContain('40,30,20,cm,12,41,31,21,10,0.25,kg,1.5');
    expect(parseBusinessCartonsCsv(csv)).toEqual({ ok: true, cartons: [mailer] });
  });

  it('round-trips inch and pound exports within numeric tolerance', () => {
    const result = roundTrip([mailer], { lengthUnit: 'in', weightUnit: 'lb' });
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error('Expected valid exported CSV.');
    const carton = result.cartons[0]!;
    expect(carton.lengthMm).toBeCloseTo(mailer.lengthMm, 8);
    expect(carton.widthMm).toBeCloseTo(mailer.widthMm, 8);
    expect(carton.heightMm).toBeCloseTo(mailer.heightMm, 8);
    expect(carton.externalLengthMm).toBeCloseTo(mailer.externalLengthMm!, 8);
    expect(carton.maxGrossWeightG).toBeCloseTo(mailer.maxGrossWeightG!, 8);
    expect(carton.emptyBoxWeightG).toBeCloseTo(mailer.emptyBoxWeightG!, 8);
  });

  it('allows cartons with only one of the two optional weights', () => {
    const first = { ...mailer, maxGrossWeightG: undefined };
    const second = { ...mailer, emptyBoxWeightG: undefined };
    expect(roundTrip([first, second])).toEqual({ ok: true, cartons: [first, second] });
  });

  it('rejects an empty list and unsupported units', () => {
    expect(() => serializeBusinessCartonsCsv([])).toThrow(/at least one carton/);
    expect(() => serializeBusinessCartonsCsv([mailer], { lengthUnit: 'yd' as 'mm' })).toThrow(/length unit/);
    expect(() => serializeBusinessCartonsCsv([mailer], { weightUnit: 'ton' as 'g' })).toThrow(/weight unit/);
  });

  it('rejects missing identity and unsafe spreadsheet formulas', () => {
    expect(() => serializeBusinessCartonsCsv([{ ...mailer, name: '', cartonCode: '' }])).toThrow(/name or cartonCode/);
    for (const unsafe of ['=SUM(1,2)', '+2+2', '-1+1', '@SUM(1)', '\t=cmd']) {
      expect(() => serializeBusinessCartonsCsv([{ ...mailer, name: unsafe }])).toThrow(/spreadsheet formula/);
      expect(() => serializeBusinessCartonsCsv([{ ...mailer, cartonCode: unsafe }])).toThrow(/spreadsheet formula/);
    }
  });

  it('rejects zero, invalid and non-finite internal dimensions', () => {
    for (const lengthMm of [0, -1, Number.POSITIVE_INFINITY, NaN]) {
      expect(() => serializeBusinessCartonsCsv([{ ...mailer, lengthMm }])).toThrow(/lengthMm/);
    }
  });

  it('rejects invalid quantity but preserves zero', () => {
    for (const quantityAvailable of [-1, 1.25, Number.MAX_SAFE_INTEGER + 1, NaN]) {
      expect(() => serializeBusinessCartonsCsv([{ ...mailer, quantityAvailable }])).toThrow(/quantityAvailable/);
    }
    expect(roundTrip([{ ...mailer, quantityAvailable: 0 }]).ok).toBe(true);
  });

  it('rejects incomplete, negative and non-finite external dimensions', () => {
    expect(() => serializeBusinessCartonsCsv([{ ...mailer, externalHeightMm: undefined }])).toThrow(/all three/);
    for (const externalLengthMm of [0, -3, Number.POSITIVE_INFINITY]) {
      expect(() => serializeBusinessCartonsCsv([{ ...mailer, externalLengthMm }])).toThrow(/externalLengthMm/);
    }
  });

  it('rejects negative or non-finite cost, but accepts zero', () => {
    for (const costPerBox of [-1, Infinity, NaN]) {
      expect(() => serializeBusinessCartonsCsv([{ ...mailer, costPerBox }])).toThrow(/costPerBox/);
    }
    expect(roundTrip([{ ...mailer, costPerBox: 0 }]).ok).toBe(true);
  });

  it('rejects zero, negative and invalid optional weights', () => {
    for (const maxGrossWeightG of [0, -1, NaN, Infinity]) {
      expect(() => serializeBusinessCartonsCsv([{ ...mailer, maxGrossWeightG }])).toThrow(/maxGrossWeightG/);
    }
    expect(() => serializeBusinessCartonsCsv([{ ...mailer, emptyBoxWeightG: 0 }])).toThrow(/emptyBoxWeightG/);
  });

  it('rejects converted numeric underflow rather than exporting zero', () => {
    expect(() => serializeBusinessCartonsCsv([
      { ...mailer, lengthMm: Number.MIN_VALUE },
    ], { lengthUnit: 'ft' })).toThrow(/converted lengthMm/);
  });
});
