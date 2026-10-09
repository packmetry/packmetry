import { useState, type ChangeEvent } from 'react';

import {
  downloadBusinessCartonsCsv,
  readBusinessCartonsCsvFile,
} from '../browser/business-cartons-csv-actions.js';
import {
  parseBusinessCartonsCsv,
  type ImportedBusinessCsvCarton,
} from '../browser/business-cartons-csv.js';
import type { RecentBusinessProjectCarton } from '../browser/business-recent-projects.js';

export interface CartonCsvToolsProps {
  cartons: readonly RecentBusinessProjectCarton[];
  onImport: (cartons: RecentBusinessProjectCarton[]) => void;
}

/** IDs are allocated only after every row passes validation. */
export function assignImportedCartonIds(
  rows: readonly ImportedBusinessCsvCarton[]
): RecentBusinessProjectCarton[] {
  return rows.map((row, index) => ({
    ...row,
    id: `business-carton-${index + 1}`,
  }));
}

/** Local CSV transfer only: no automatic saves or solver execution. */
export default function CartonCsvTools({ cartons, onImport }: CartonCsvToolsProps) {
  const [message, setMessage] = useState<string | null>(null);

  const exportCartons = () => {
    try {
      const downloaded = downloadBusinessCartonsCsv(cartons);
      setMessage(
        downloaded
          ? 'Cartons CSV downloaded.'
          : 'Could not download cartons CSV from this browser.'
      );
    } catch (error) {
      setMessage(
        error instanceof Error
          ? `Could not export cartons: ${error.message}`
          : 'Could not export cartons CSV.'
      );
    }
  };

  const importCartons = async (event: ChangeEvent<HTMLInputElement>) => {
    const input = event.currentTarget;
    const file = input.files?.[0];
    if (file === undefined) return;
    input.value = ''; // Allow re-selecting the same file.
    setMessage(null);

    const readResult = await readBusinessCartonsCsvFile(file);
    if (!readResult.ok) {
      setMessage(
        readResult.reason === 'too-large'
          ? 'CSV file is too large (2 MB limit).'
          : 'Could not read cartons CSV file.'
      );
      return;
    }

    const parsed = parseBusinessCartonsCsv(readResult.text);
    if (!parsed.ok) {
      setMessage(`Could not import cartons: ${parsed.error.message}`);
      return;
    }

    // Replace the whole carton list once, and only after all rows validate.
    onImport(assignImportedCartonIds(parsed.cartons));
    setMessage(`Imported ${parsed.cartons.length} cartons into this workspace. Save project to keep changes locally.`);
  };

  return (
    <div aria-label="Carton CSV import and export">
      <div className="pm-business-project-actions">
        <button
          className="pm-add-button"
          type="button"
          onClick={exportCartons}
        >
          Export cartons CSV
        </button>
        <label className="pm-field">
          <span className="pm-field-label">
            Import cartons CSV (replaces current cartons)
          </span>
          <input
            className="pm-number-input"
            type="file"
            accept=".csv,text/csv"
            onChange={(event: ChangeEvent<HTMLInputElement>) => { void importCartons(event); }}
          />
        </label>
      </div>
      <p className="pm-submit-note">
        CSV exchanges carton inventory only, not products or project settings.
        Import replaces the current carton rows after every row validates.
        Saved carton library entries are not changed.
      </p>
      {message !== null && (
        <p className="pm-submit-note" role="status" aria-live="polite">
          {message}
        </p>
      )}
    </div>
  );
}
