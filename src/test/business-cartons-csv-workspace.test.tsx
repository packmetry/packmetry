import { readFileSync } from 'node:fs';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import BusinessWorkspace from '../components/BusinessWorkspace.js';
import CartonCsvTools, {
  assignImportedCartonIds,
} from '../components/CartonCsvTools.js';
import {
  BUSINESS_CARTONS_CSV_FILENAME,
  BUSINESS_CARTONS_CSV_MAX_BYTES,
  downloadBusinessCartonsCsv,
  readBusinessCartonsCsvFile,
} from '../browser/business-cartons-csv-actions.js';
import {
  parseBusinessCartonsCsv,
  type ImportedBusinessCsvCarton,
} from '../browser/business-cartons-csv.js';
import { serializeBusinessCartonsCsv } from '../browser/business-cartons-csv-export.js';

const workspaceSource = readFileSync(
  new URL('../components/BusinessWorkspace.tsx', import.meta.url),
  'utf8'
);
const toolsSource = readFileSync(
  new URL('../components/CartonCsvTools.tsx', import.meta.url),
  'utf8'
);

const carton: ImportedBusinessCsvCarton = {
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

describe('Business cartons CSV workspace integration', () => {
  it('renders CSV controls within the Business workspace', () => {
    const html = renderToStaticMarkup(<BusinessWorkspace />);
    expect(html).toContain('Export cartons CSV');
    expect(html).toContain('Import cartons CSV (replaces current cartons)');
    expect(html).toContain('Saved carton library entries are not changed.');
    expect(html).toContain('.csv,text/csv');
    expect(html).toContain('Export products CSV');
    expect(html).toContain('Export project JSON');
  });

  it('renders standalone carton tools without requiring browser APIs', () => {
    const html = renderToStaticMarkup(
      <CartonCsvTools cartons={[{ id: 'business-carton-5', ...carton }]} onImport={() => {}} />
    );
    expect(html).toContain('Export cartons CSV');
    expect(html).toContain('Import cartons CSV');
    expect(html).toContain('replaces the current carton rows');
  });

  it('allocates stable workspace IDs only after parsing, preserving unknown values', () => {
    const second: ImportedBusinessCsvCarton = {
      name: '', cartonCode: 'BX-Z',
      lengthMm: 100, widthMm: 90, heightMm: 80,
      quantityAvailable: 0,
      maxGrossWeightG: undefined,
      emptyBoxWeightG: undefined,
      costPerBox: 0,
    };
    const source = [carton, second];
    const snapshot = JSON.stringify(source);
    const parsed = parseBusinessCartonsCsv(serializeBusinessCartonsCsv(source));
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) throw new Error('Expected valid CSV round trip.');

    const imported = assignImportedCartonIds(parsed.cartons);
    expect(imported.map(entry => entry.id)).toEqual([
      'business-carton-1', 'business-carton-2',
    ]);
    expect(imported[0]).toEqual({ ...carton, id: 'business-carton-1' });
    expect(imported[1]).toEqual({ ...second, id: 'business-carton-2' });
    expect(imported[0]).not.toHaveProperty('libraryId');
    expect(imported[1]).not.toHaveProperty('libraryId');
    expect(JSON.stringify(source)).toBe(snapshot);
  });

  it('delegates file reading, schema validation and export to dedicated modules', () => {
    expect(toolsSource).toContain('readBusinessCartonsCsvFile(');
    expect(toolsSource).toContain('parseBusinessCartonsCsv(');
    expect(toolsSource).toContain('downloadBusinessCartonsCsv(');
    expect(toolsSource).toContain("input.value = ''");
    expect(toolsSource.indexOf('if (!parsed.ok)')).toBeLessThan(
      toolsSource.indexOf('onImport(assignImportedCartonIds(')
    );
    expect(toolsSource).not.toContain('saveRecentBusinessProject(');
    expect(toolsSource).not.toContain('saveBusinessCarton(');
  });

  it('replaces carton state after a successful import and clears stale results', () => {
    expect(workspaceSource).toContain("import CartonCsvTools from './CartonCsvTools.js';");
    const start = workspaceSource.indexOf('<CartonCsvTools');
    const end = workspaceSource.indexOf('/>', start);
    expect(start).toBeGreaterThan(-1);
    expect(end).toBeGreaterThan(start);
    const callback = workspaceSource.slice(start, end);
    for (const expected of [
      'setCartons(importedCartons)', 'setPlan(null)', 'setRecommendedPlan(null)',
      'setAlternatives([])', 'setInventoryUsage(null)', 'setError(null)',
      'setCartonLibraryMessage(null)',
    ]) {
      expect(callback).toContain(expected);
    }
    expect(callback).toContain("objective === 'min-dim-weight'");
    expect(callback).toContain('isBusinessMinDimWeightObjectiveAvailable(');
    expect(callback).toContain("setObjective('balanced')");
    expect(callback).not.toContain('setProducts(');
    expect(callback).not.toContain('setRecentProjects(');
    expect(callback).not.toContain('setSavedCartons(');
    expect(callback).not.toContain('saveRecentBusinessProject(');
    expect(callback).not.toContain('writeBusinessObjectivePreference(');
  });

  it('rejects nonexistent, oversize or unreadable inputs before import', async () => {
    expect(await readBusinessCartonsCsvFile(null)).toEqual({ ok: false, reason: 'unavailable' });
    expect(await readBusinessCartonsCsvFile({ size: BUSINESS_CARTONS_CSV_MAX_BYTES + 1, text: async () => 'x' }))
      .toEqual({ ok: false, reason: 'too-large' });
    expect(await readBusinessCartonsCsvFile({ text: async () => 'x'.repeat(BUSINESS_CARTONS_CSV_MAX_BYTES + 1) }))
      .toEqual({ ok: false, reason: 'too-large' });
    expect(await readBusinessCartonsCsvFile({ text: async () => { throw new Error('IO'); } }))
      .toEqual({ ok: false, reason: 'read-failed' });
    expect(await readBusinessCartonsCsvFile({ size: 3, text: async () => 'abc' }))
      .toEqual({ ok: true, text: 'abc' });
  });

  it('rejects malformed carton CSV without applying partial data', () => {
    const serialized = serializeBusinessCartonsCsv([carton]);
    const bad = serialized + 'Bad,BX-2,0,1,1,mm,1,,,,,,,\r\n';
    const parsed = parseBusinessCartonsCsv(bad);
    expect(parsed.ok).toBe(false);
    expect(toolsSource).toContain('if (!parsed.ok)');
  });

  it('uses consistent export filename and validates before any browser side effects', () => {
    expect(BUSINESS_CARTONS_CSV_FILENAME).toBe('packmetry-business-cartons.csv');
    expect(downloadBusinessCartonsCsv([carton])).toBe(false);
    expect(() => downloadBusinessCartonsCsv([{ ...carton, lengthMm: -1 }]))
      .toThrow(/lengthMm/);
  });
});
