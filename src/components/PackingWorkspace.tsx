import { useState, type SyntheticEvent } from 'react';

import PackingVisualization from './PackingVisualization.js';
import ResultSummary from './ResultSummary.js';
import { createCarton } from '../core/domain/carton.js';
import { createItem } from '../core/domain/item.js';
import type { PackingPlan } from '../core/domain/packing-plan.js';
import {
  BaselineSolver,
  planPacking,
  type SolverInput,
} from '../core/solver/index.js';
import {
  planNeedBoxes,
  type PurchaseCartonRecommendation,
} from '../core/workflows/index.js';

export type WorkspaceMode = 'need-boxes' | 'have-box';

export interface WorkspaceValues {
  itemLengthMm: number;
  itemWidthMm: number;
  itemHeightMm: number;
  itemQuantity: number;
  cartonLengthMm: number;
  cartonWidthMm: number;
  cartonHeightMm: number;
}

export interface NeedBoxesWorkspaceResult {
  plan: PackingPlan;
  purchaseRecommendations: PurchaseCartonRecommendation[];
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

function createWorkspaceItem(values: WorkspaceValues) {
  return createItem({
    id: 'workspace-item',
    name: 'Item',
    dimensions: {
      length: values.itemLengthMm,
      width: values.itemWidthMm,
      height: values.itemHeightMm,
    },
    quantity: values.itemQuantity,
  });
}

export async function runPackingWorkspace(
  values: WorkspaceValues
): Promise<PackingPlan> {
  const item = createWorkspaceItem(values);

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

  const result = await planPacking(
    'workspace-plan',
    new BaselineSolver(),
    input
  );

  if (result.kind === 'planned') {
    return result.plan;
  }

  switch (result.selection.kind) {
    case 'no-valid-candidate':
      throw new Error(
        'No independently verified solver candidate was produced'
      );

    case 'objective-unsupported':
      throw new Error(
        `Packing objective is not supported: ${result.selection.objective}`
      );

    case 'insufficient-data':
      throw new Error(
        `Packing objective requires additional data: ${result.selection.missingMetric}`
      );
  }
}

export async function runNeedBoxesWorkspace(
  values: WorkspaceValues
): Promise<NeedBoxesWorkspaceResult> {
  const item = createWorkspaceItem(values);

  const result = await planNeedBoxes(
    'workspace-plan',
    new BaselineSolver(),
    {
      items: [item],
      objective: {
        kind: 'fewest-cartons',
      },
    }
  );

  if (result.planningResult.kind === 'planned') {
    return {
      plan: result.planningResult.plan,
      purchaseRecommendations:
        result.purchaseRecommendations,
    };
  }

  switch (result.planningResult.selection.kind) {
    case 'no-valid-candidate':
      throw new Error(
        'No independently verified box recommendation was produced'
      );

    case 'objective-unsupported':
      throw new Error(
        `Packing objective is not supported: ${result.planningResult.selection.objective}`
      );

    case 'insufficient-data':
      throw new Error(
        `Packing objective requires additional data: ${result.planningResult.selection.missingMetric}`
      );
  }
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
  const [mode, setMode] =
    useState<WorkspaceMode>('need-boxes');
  const [values, setValues] = useState<WorkspaceValues>(
    DEFAULT_WORKSPACE_VALUES
  );
  const [plan, setPlan] = useState<PackingPlan | null>(null);
  const [
    purchaseRecommendations,
    setPurchaseRecommendations,
  ] = useState<PurchaseCartonRecommendation[]>([]);
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

  const chooseMode = (nextMode: WorkspaceMode) => {
    setMode(nextMode);
    setPlan(null);
    setPurchaseRecommendations([]);
    setError(null);
  };

  const submit = async (
    event: SyntheticEvent<HTMLFormElement>
  ) => {
    event.preventDefault();
    setRunning(true);
    setError(null);
    setPlan(null);
    setPurchaseRecommendations([]);

    try {
      if (mode === 'need-boxes') {
        const result =
          await runNeedBoxesWorkspace(values);

        setPlan(result.plan);
        setPurchaseRecommendations(
          result.purchaseRecommendations
        );
      } else {
        setPlan(await runPackingWorkspace(values));
      }
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
          Enter item dimensions in millimetres. Packmetry can
          recommend a box or use dimensions for a box you already
          have, then independently verify the packing result.
        </p>
      </section>

      <div style={styles.grid}>
        <form onSubmit={submit} style={styles.card}>
          <h2 style={styles.cardHeading}>
            How are you packing?
          </h2>

          <div
            role="group"
            aria-label="Box availability"
            style={styles.modeGroup}
          >
            <button
              type="button"
              aria-pressed={mode === 'need-boxes'}
              onClick={() => chooseMode('need-boxes')}
              style={{
                ...styles.modeButton,
                ...(mode === 'need-boxes'
                  ? styles.modeButtonActive
                  : {}),
              }}
            >
              <strong>I Need Boxes</strong>
              <span style={styles.modeDescription}>
                Recommend box dimensions for these items.
              </span>
            </button>

            <button
              type="button"
              aria-pressed={mode === 'have-box'}
              onClick={() => chooseMode('have-box')}
              style={{
                ...styles.modeButton,
                ...(mode === 'have-box'
                  ? styles.modeButtonActive
                  : {}),
              }}
            >
              <strong>I Already Have a Box</strong>
              <span style={styles.modeDescription}>
                Check packing against dimensions I provide.
              </span>
            </button>
          </div>

          <h2
            style={{
              ...styles.cardHeading,
              marginTop: '1.5rem',
            }}
          >
            Item
          </h2>

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

          {mode === 'need-boxes' ? (
            <div style={styles.helper}>
              <strong>No box dimensions needed.</strong>
              <span>
                Packmetry will generate box candidates, solve them,
                independently verify the result, and recommend the
                internal dimensions actually used by the canonical
                plan.
              </span>
            </div>
          ) : (
            <>
              <h2
                style={{
                  ...styles.cardHeading,
                  marginTop: '1.5rem',
                }}
              >
                Box
              </h2>

              <div style={styles.fields}>
                <NumberField
                  label="Length (mm)"
                  value={values.cartonLengthMm}
                  min={0.001}
                  step={0.001}
                  onChange={value =>
                    update('cartonLengthMm', value)
                  }
                />
                <NumberField
                  label="Width (mm)"
                  value={values.cartonWidthMm}
                  min={0.001}
                  step={0.001}
                  onChange={value =>
                    update('cartonWidthMm', value)
                  }
                />
                <NumberField
                  label="Height (mm)"
                  value={values.cartonHeightMm}
                  min={0.001}
                  step={0.001}
                  onChange={value =>
                    update('cartonHeightMm', value)
                  }
                />
              </div>
            </>
          )}

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

          {plan && (
            <>
              {mode === 'need-boxes' &&
                purchaseRecommendations.length > 0 && (
                  <section
                    aria-label="Box recommendation"
                    style={styles.recommendation}
                  >
                    <p style={styles.eyebrow}>
                      Box recommendation
                    </p>
                    <h2 style={styles.recommendationHeading}>
                      What to buy
                    </h2>

                    <div style={styles.recommendationList}>
                      {purchaseRecommendations.map(
                        recommendation => {
                          const dimensions =
                            recommendation.carton
                              .internalDimensions;

                          return (
                            <div
                              key={recommendation.cartonId}
                              style={styles.recommendationItem}
                            >
                              <strong>
                                Quantity{' '}
                                {recommendation.quantity}
                              </strong>
                              <span
                                style={
                                  styles.recommendationSize
                                }
                              >
                                {dimensions.length} ×{' '}
                                {dimensions.width} ×{' '}
                                {dimensions.height} mm
                              </span>
                            </div>
                          );
                        }
                      )}
                    </div>

                    <p style={styles.recommendationNote}>
                      Recommended internal dimensions from the
                      verified packing plan. Supplier availability
                      and external dimensions are not claimed.
                    </p>
                  </section>
                )}

              <ResultSummary plan={plan} />
              <PackingVisualization plan={plan} />
            </>
          )}
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
    maxWidth: '680px',
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
  modeGroup: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
    gap: '10px',
  },
  modeButton: {
    display: 'grid',
    gap: '5px',
    minHeight: '92px',
    border: '1px solid #d4d4d8',
    borderRadius: '12px',
    padding: '14px',
    textAlign: 'left' as const,
    font: 'inherit',
    color: '#18181b',
    background: '#fafafa',
    cursor: 'pointer',
  },
  modeButtonActive: {
    borderColor: '#18181b',
    background: '#f4f4f5',
    boxShadow: 'inset 0 0 0 1px #18181b',
  },
  modeDescription: {
    fontSize: '12px',
    lineHeight: 1.45,
    color: '#71717a',
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
  helper: {
    display: 'grid',
    gap: '5px',
    marginTop: '20px',
    borderRadius: '10px',
    padding: '12px',
    background: '#f4f4f5',
    color: '#3f3f46',
    fontSize: '13px',
    lineHeight: 1.5,
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
  recommendation: {
    marginBottom: '22px',
    borderBottom: '1px solid #e4e4e7',
    paddingBottom: '20px',
  },
  recommendationHeading: {
    margin: '0 0 12px',
    fontSize: '22px',
  },
  recommendationList: {
    display: 'grid',
    gap: '8px',
  },
  recommendationItem: {
    display: 'grid',
    gridTemplateColumns: 'auto 1fr',
    gap: '12px',
    alignItems: 'center',
    border: '1px solid #e4e4e7',
    borderRadius: '10px',
    padding: '12px',
    background: '#fafafa',
  },
  recommendationSize: {
    textAlign: 'right' as const,
    fontWeight: 700,
  },
  recommendationNote: {
    margin: '10px 0 0',
    fontSize: '12px',
    lineHeight: 1.5,
    color: '#71717a',
  },
} as const;
