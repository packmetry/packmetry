import { readFileSync } from 'node:fs';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import BusinessWorkspace from '../components/BusinessWorkspace.js';
import ProductCsvTools, {
  assignImportedProductIds,
} from '../components/ProductCsvTools.js';
import {
  BUSINESS_PRODUCTS_CSV_FILENAME,
  BUSINESS_PRODUCTS_CSV_MAX_BYTES,
  downloadBusinessProductsCsv,
  readBusinessProductsCsvFile,
} from '../browser/business-products-csv-actions.js';
import type { ImportedBusinessCsvProduct } from '../browser/business-products-csv.js';

const workspaceSource = readFileSync(
  new URL('../components/BusinessWorkspace.tsx', import.meta.url),
  'utf8'
);
const toolsSource = readFileSync(
  new URL('../components/ProductCsvTools.tsx', import.meta.url),
  'utf8'
);

const item: ImportedBusinessCsvProduct = {
  name: 'Ceramic mug', sku: 'MUG-01',
  lengthMm: 80, widthMm: 80, heightMm: 95,
  quantity: 12, unitWeightG: 500,
  rotationPolicy: 'upright',
};

describe('Business products CSV workspace integration', () => {
  it('shows import and export controls in the Business workspace', () => {
    const html = renderToStaticMarkup(<BusinessWorkspace />);
    expect(html).toContain('Export products CSV');
    expect(html).toContain('Import products CSV (replaces current products)');
    expect(html).toContain('.csv,text/csv');
    expect(html).toContain('CSV exchanges products only');
  });

  it('renders the controls independently of the parent workspace', () => {
    const html = renderToStaticMarkup(
      <ProductCsvTools products={[{ id: 'business-product-1', ...item }]} onImport={() => {}} />
    );
    expect(html).toContain('Export products CSV');
    expect(html).toContain('Import products CSV');
  });

  it('allocates deterministic unique IDs without mutating parsed rows', () => {
    const rows = [item, { ...item, name: 'Second', rotationPolicy: undefined }];
    const before = JSON.stringify(rows);
    const products = assignImportedProductIds(rows);
    expect(products.map(product => product.id)).toEqual([
      'business-product-1', 'business-product-2',
    ]);
    expect(products[0]).toEqual({ ...item, id: 'business-product-1' });
    expect(products[1]?.rotationPolicy).toBeUndefined();
    expect(JSON.stringify(rows)).toBe(before);
  });

  it('delegates CSV mechanics and parsing to dedicated browser modules', () => {
    expect(toolsSource).toContain('readBusinessProductsCsvFile(');
    expect(toolsSource).toContain('parseBusinessProductsCsv(');
    expect(toolsSource).toContain('downloadBusinessProductsCsv(');
    expect(toolsSource).toContain('if (!parsed.ok)');
    expect(toolsSource.indexOf('if (!parsed.ok)')).toBeLessThan(
      toolsSource.indexOf('onImport(assignImportedProductIds(')
    );
    expect(toolsSource).not.toContain('saveRecentBusinessProject(');
  });

  it('wires successful imported products to workspace state and clears prior packing results', () => {
    expect(workspaceSource).toContain("import ProductCsvTools from './ProductCsvTools.js';");
    const start = workspaceSource.indexOf('<ProductCsvTools');
    const end = workspaceSource.indexOf('/>', start);
    expect(start).toBeGreaterThan(-1);
    expect(end).toBeGreaterThan(start);
    const callback = workspaceSource.slice(start, end);
    for (const expected of [
      'setProducts(', 'setPlan(null)', 'setRecommendedPlan(null)',
      'setAlternatives([])', 'setInventoryUsage(null)', 'setError(null)',
    ]) {
      expect(callback).toContain(expected);
    }
    expect(callback).not.toContain('saveRecentBusinessProject(');
    expect(callback).not.toContain('setCartons(');
    expect(callback).not.toContain('setObjective(');
  });

  it('supports browser-local small text reads and repeat selection', async () => {
    const result = await readBusinessProductsCsvFile({
      size: 4,
      text: async () => 'abc\n',
    });
    expect(result).toEqual({ ok: true, text: 'abc\n' });
    expect(toolsSource).toContain("input.value = ''");
  });

  it('rejects oversized and unreadable input without partial state changes', async () => {
    expect(await readBusinessProductsCsvFile(null)).toEqual({ ok: false, reason: 'unavailable' });
    expect(await readBusinessProductsCsvFile({ size: BUSINESS_PRODUCTS_CSV_MAX_BYTES + 1, text: async () => 'x' }))
      .toEqual({ ok: false, reason: 'too-large' });
    expect(await readBusinessProductsCsvFile({ text: async () => 'x'.repeat(BUSINESS_PRODUCTS_CSV_MAX_BYTES + 1) }))
      .toEqual({ ok: false, reason: 'too-large' });
    expect(await readBusinessProductsCsvFile({ text: async () => { throw new Error('IO'); } }))
      .toEqual({ ok: false, reason: 'read-failed' });
  });

  it('names export consistently and does not require browser availability for SSR', () => {
    expect(BUSINESS_PRODUCTS_CSV_FILENAME).toBe('packmetry-business-products.csv');
    expect(downloadBusinessProductsCsv([item])).toBe(false);
    expect(() => downloadBusinessProductsCsv([{ ...item, lengthMm: -1 }]))
      .toThrow(/lengthMm/);
  });
});
