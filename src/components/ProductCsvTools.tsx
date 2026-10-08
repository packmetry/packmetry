import { useState, type ChangeEvent } from 'react';

import {
  downloadBusinessProductsCsv,
  readBusinessProductsCsvFile,
} from '../browser/business-products-csv-actions.js';
import {
  parseBusinessProductsCsv,
  type ImportedBusinessCsvProduct,
} from '../browser/business-products-csv.js';
import type { RecentBusinessProjectProduct } from '../browser/business-recent-projects.js';

export interface ProductCsvToolsProps {
  products: readonly RecentBusinessProjectProduct[];
  onImport: (products: RecentBusinessProjectProduct[]) => void;
}

/** Assign local workspace IDs only after every CSV row validates. */
export function assignImportedProductIds(
  rows: readonly ImportedBusinessCsvProduct[]
): RecentBusinessProjectProduct[] {
  return rows.map((row, index) => ({
    ...row,
    id: `business-product-${index + 1}`,
  }));
}

/** Browser-only import/export controls. No storage, solver or auto-save behavior. */
export default function ProductCsvTools({
  products,
  onImport,
}: ProductCsvToolsProps) {
  const [message, setMessage] = useState<string | null>(null);

  const exportProducts = () => {
    try {
      const downloaded = downloadBusinessProductsCsv(products);
      setMessage(
        downloaded
          ? 'Products CSV downloaded.'
          : 'Could not download products CSV from this browser.'
      );
    } catch (error) {
      setMessage(
        error instanceof Error
          ? `Could not export products: ${error.message}`
          : 'Could not export products CSV.'
      );
    }
  };

  const importProducts = async (event: ChangeEvent<HTMLInputElement>) => {
    const input = event.currentTarget;
    const file = input.files?.[0];
    if (file === undefined) return;
    input.value = ''; // Allow selecting the same file again.
    setMessage(null);

    const readResult = await readBusinessProductsCsvFile(file);
    if (!readResult.ok) {
      setMessage(
        readResult.reason === 'too-large'
          ? 'CSV file is too large (2 MB limit).'
          : 'Could not read products CSV file.'
      );
      return;
    }

    const parsed = parseBusinessProductsCsv(readResult.text);
    if (!parsed.ok) {
      setMessage(`Could not import products: ${parsed.error.message}`);
      return;
    }

    // Replace products in a single update; never apply partial invalid rows.
    onImport(assignImportedProductIds(parsed.products));
    setMessage(`Imported ${parsed.products.length} products into this workspace. Save project to keep changes locally.`);
  };

  return (
    <div aria-label="Product CSV import and export">
      <div className="pm-business-project-actions">
        <button
          className="pm-add-button"
          type="button"
          onClick={exportProducts}
        >
          Export products CSV
        </button>
        <label className="pm-field">
          <span className="pm-field-label">
            Import products CSV (replaces current products)
          </span>
          <input
            className="pm-number-input"
            type="file"
            accept=".csv,text/csv"
            onChange={event => { void importProducts(event); }}
          />
        </label>
      </div>
      <p className="pm-submit-note">
        CSV exchanges products only, not carton inventory or project settings.
        Import replaces the current product rows after all rows validate.
      </p>
      {message !== null && (
        <p className="pm-submit-note" role="status" aria-live="polite">
          {message}
        </p>
      )}
    </div>
  );
}
