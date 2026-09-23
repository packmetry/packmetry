import { useState, type SyntheticEvent } from 'react';

import ResultSummary from './ResultSummary.js';
import { createCarton } from '../core/domain/carton.js';
import { createItem } from '../core/domain/item.js';
import type { PackingPlan } from '../core/domain/packing-plan.js';
import { constructPackingPlan } from '../core/domain/plan-construction.js';
import { BaselineSolver } from '../core/solver/baseline.js';
import type { SolverInput } from '../core/solver/contracts.js';
import { solveAndVerify } from '../core/solver/integration.js';

export interface WorkspaceValues {
  itemLengthMm: number;
  itemWidthMm: number;
  itemHeightMm: number;
  itemQuantity: number;
  cartonLengthMm: number;
  cartonWidthMm: number;
  cartonHeightMm: number;
}

export const DEFAULT_WORKSPACE_VALUES: WorkspaceValues = {
  itemLengthMm: 80,
  itemWidthMm: 80,
  itemHeightMm: 80,
  itemQuantity: 1,
  cartonLengthMm: 100,
  cartonWidthMm: 100,
  cartonHeightMm: 100,
};

export async function runPackingWorkspace(
  values: WorkspaceValues
): Promise<PackingPlan> {
  const item = createItem({
    id: 'workspace-item',
    name: 'Item',
    dimensions: {
      length: values.itemLengthMm,
      width: values.itemWidthMm,
      height: values.itemHeightMm,
    },
    quantity: values.itemQuantity,
  });

  const carton = createCarton({
    id: 'workspace-carton',
    name: 'Box',
    internalDimensions: {
      length: values.cartonLengthMm,
      width: values.cartonWidthMm,
      height: values.cartonHeightMm,
    },
  });

  const input: SolverInput = {
    items: [item],
    cartons: [carton],
    objective: {
      kind: 'fewest-cartons',
    },
  };

  const verified = await solveAndVerify(new BaselineSolver(), input);
  const candidate = verified.candidates.find(
    result => result.verification.valid
  );

  if (!candidate) {
    throw new Error(
      'No independently verified solver candidate was produced'
    );
  }

  return constructPackingPlan(
    'workspace-plan',
    input,
    candidate,
    verified.solverMeta
  );
}

function NumberField({
  label,
  value,
  min,
  step = 1,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  step?: number;
  onChange: (value: number) => void;
}) {
  return (
    <label style={styles.field}>
      <span style={styles.label}>{label}</span>
      <input
        type="number"
        value={value}
        min={min}
        step={step}
        onChange={event => onChange(Number(event.target.value))}
        style={styles.input}
      />
    </label>
  );
}

export default function PackingWorkspace() {
  const [values, setValues] = useState<WorkspaceValues>(
    DEFAULT_WORKSPACE_VALUES
  );
  const [plan, setPlan] = useState<PackingPlan | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [running, setRunning] = useState(false);

  const update = (
    key: keyof WorkspaceValues,
    value: number
  ) => {
    setValues(current => ({
      ...current,
      [key]: value,
    }));
  };

  const submit = async (
    event: SyntheticEvent<HTMLFormElement>
  ) => {
    event.preventDefault();
    setRunning(true);
    setError(null);
    setPlan(null);

    try {
      setPlan(await runPackingWorkspace(values));
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : 'Packing calculation failed'
      );
    } finally {
      setRunning(false);
    }
  };

  return (
    <main style={styles.page}>
      <section style={styles.hero}>
        <p style={styles.eyebrow}>Packmetry workspace</p>
        <h1 style={styles.heading}>Pack an item into a box</h1>
        <p style={styles.intro}>
          Enter dimensions in millimetres. Packmetry will solve the
          arrangement, independently verify it, and return a canonical result.
        </p>
      </section>

      <div style={styles.grid}>
        <form onSubmit={submit} style={styles.card}>
          <h2 style={styles.cardHeading}>Item</h2>
          <div style={styles.fields}>
            <NumberField
              label="Length (mm)"
              value={values.itemLengthMm}
              min={0.001}
              step={0.001}
              onChange={value => update('itemLengthMm', value)}
            />
            <NumberField
              label="Width (mm)"
              value={values.itemWidthMm}
              min={0.001}
              step={0.001}
              onChange={value => update('itemWidthMm', value)}
            />
            <NumberField
              label="Height (mm)"
              value={values.itemHeightMm}
              min={0.001}
              step={0.001}
              onChange={value => update('itemHeightMm', value)}
            />
            <NumberField
              label="Quantity"
              value={values.itemQuantity}
              min={1}
              onChange={value => update('itemQuantity', value)}
            />
          </div>

          <h2 style={{ ...styles.cardHeading, marginTop: '1.5rem' }}>
            Box
          </h2>
          <div style={styles.fields}>
            <NumberField
              label="Length (mm)"
              value={values.cartonLengthMm}
              min={0.001}
              step={0.001}
              onChange={value => update('cartonLengthMm', value)}
            />
            <NumberField
              label="Width (mm)"
              value={values.cartonWidthMm}
              min={0.001}
              step={0.001}
              onChange={value => update('cartonWidthMm', value)}
            />
            <NumberField
              label="Height (mm)"
              value={values.cartonHeightMm}
              min={0.001}
              step={0.001}
              onChange={value => update('cartonHeightMm', value)}
            />
          </div>

          <button
            type="submit"
            disabled={running}
            style={{
              ...styles.button,
              opacity: running ? 0.65 : 1,
            }}
          >
            {running ? 'Calculating…' : 'Calculate packing'}
          </button>
        </form>

        <section style={styles.card} aria-live="polite">
          {!plan && !error && (
            <>
              <h2 style={styles.cardHeading}>Result</h2>
              <p style={styles.muted}>
                Run a calculation to see the verified result.
              </p>
            </>
          )}

          {error && (
            <>
              <h2 style={styles.cardHeading}>Result</h2>
              <div role="alert" style={styles.error}>
                {error}
              </div>
            </>
          )}

          {plan && <ResultSummary plan={plan} />}
        </section>
      </div>
    </main>
  );
}

const styles = {
  page: {
    maxWidth: '1100px',
    margin: '0 auto',
    padding: '48px 20px 72px',
    fontFamily:
      'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    color: '#18181b',
  },
  hero: {
    maxWidth: '720px',
    marginBottom: '32px',
  },
  eyebrow: {
    margin: '0 0 8px',
    fontSize: '13px',
    fontWeight: 700,
    letterSpacing: '0.08em',
    textTransform: 'uppercase' as const,
  },
  heading: {
    margin: '0 0 12px',
    fontSize: 'clamp(2rem, 6vw, 3.5rem)',
    lineHeight: 1,
    letterSpacing: '-0.04em',
  },
  intro: {
    margin: 0,
    maxWidth: '640px',
    fontSize: '17px',
    lineHeight: 1.6,
    color: '#52525b',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '20px',
    alignItems: 'start',
  },
  card: {
    border: '1px solid #e4e4e7',
    borderRadius: '16px',
    padding: '24px',
    background: '#ffffff',
    boxShadow: '0 12px 32px rgba(0,0,0,0.05)',
  },
  cardHeading: {
    margin: '0 0 16px',
    fontSize: '18px',
  },
  fields: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
    gap: '12px',
  },
  field: {
    display: 'grid',
    gap: '6px',
  },
  label: {
    fontSize: '13px',
    fontWeight: 600,
    color: '#52525b',
  },
  input: {
    width: '100%',
    boxSizing: 'border-box' as const,
    border: '1px solid #d4d4d8',
    borderRadius: '10px',
    padding: '10px 12px',
    font: 'inherit',
    background: '#fafafa',
  },
  button: {
    width: '100%',
    marginTop: '24px',
    border: 0,
    borderRadius: '10px',
    padding: '12px 16px',
    font: 'inherit',
    fontWeight: 700,
    cursor: 'pointer',
    background: '#18181b',
    color: '#ffffff',
  },
  muted: {
    margin: 0,
    color: '#71717a',
    lineHeight: 1.6,
  },
  error: {
    borderRadius: '10px',
    padding: '12px',
    background: '#fef2f2',
    color: '#991b1b',
    lineHeight: 1.5,
  },
} as const;