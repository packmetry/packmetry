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
  planHaveBoxes,
  planNeedBoxes,
  type HaveBoxesInventoryUsage,
  type PurchaseCartonRecommendation,
} from '../core/workflows/index.js';

export type WorkspaceMode = 'need-boxes' | 'have-boxes';

export interface WorkspaceValues {
  itemLengthMm: number;
  itemWidthMm: number;
  itemHeightMm: number;
  itemQuantity: number;
  cartonLengthMm: number;
  cartonWidthMm: number;
  cartonHeightMm: number;
}

export interface WorkspaceCartonValues {
  id: string;
  lengthMm: number;
  widthMm: number;
  heightMm: number;
  quantityAvailable: number;
}

export interface NeedBoxesWorkspaceResult {
  plan: PackingPlan;
  purchaseRecommendations: PurchaseCartonRecommendation[];
}

export interface HaveBoxesWorkspaceResult {
  plan: PackingPlan;
  inventoryUsage: HaveBoxesInventoryUsage;
}

export interface PackingWorkspaceProps {
  initialMode?: WorkspaceMode;
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

export const DEFAULT_WORKSPACE_CARTONS: WorkspaceCartonValues[] = [
  {
    id: 'workspace-carton-1',
    lengthMm: 100,
    widthMm: 100,
    heightMm: 100,
    quantityAvailable: 1,
  },
];

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

function createWorkspaceCarton(
  values: WorkspaceCartonValues,
  index: number
) {
  return createCarton({
    id: values.id,
    name: `Box ${index + 1}`,
    internalDimensions: {
      length: values.lengthMm,
      width: values.widthMm,
      height: values.heightMm,
    },
    quantityAvailable: values.quantityAvailable,
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

export async function runHaveBoxesWorkspace(
  values: WorkspaceValues,
  cartons: readonly WorkspaceCartonValues[]
): Promise<HaveBoxesWorkspaceResult> {
  const item = createWorkspaceItem(values);

  const result = await planHaveBoxes(
    'workspace-plan',
    new BaselineSolver(),
    {
      items: [item],
      cartons: cartons.map(createWorkspaceCarton),
      objective: {
        kind: 'fewest-cartons',
      },
    }
  );

  if (result.planningResult.kind === 'planned') {
    if (result.inventoryUsage === null) {
      throw new Error(
        'Existing box inventory usage was not produced'
      );
    }

    return {
      plan: result.planningResult.plan,
      inventoryUsage: result.inventoryUsage,
    };
  }

  switch (result.planningResult.selection.kind) {
    case 'no-valid-candidate':
      throw new Error(
        'No independently verified existing-box plan was produced'
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

function InventoryUsageSummary({
  usage,
}: {
  usage: HaveBoxesInventoryUsage;
}) {
  const totalUsed = usage.usedCartons.reduce(
    (sum, entry) => sum + entry.usedQuantity,
    0
  );

  return (
    <section
      aria-label="Existing box inventory usage"
      style={styles.inventorySummary}
    >
      <p style={styles.eyebrow}>Existing box inventory</p>
      <h2 style={styles.recommendationHeading}>
        Boxes used
      </h2>
      <p style={styles.inventoryLead}>
        {totalUsed} box{totalUsed === 1 ? '' : 'es'} used from the
        inventory you entered.
      </p>

      <div style={styles.recommendationList}>
        {usage.usedCartons.map(entry => {
          const dimensions = entry.carton.internalDimensions;

          return (
            <div
              key={entry.cartonId}
              style={styles.inventoryItem}
            >
              <div style={styles.inventoryItemMain}>
                <strong>
                  {entry.carton.name ?? entry.cartonId}
                </strong>
                <span style={styles.inventoryDimensions}>
                  {dimensions.length} × {dimensions.width} ×{' '}
                  {dimensions.height} mm
                </span>
              </div>

              <div style={styles.inventoryCounts}>
                <strong>
                  Used {entry.usedQuantity}
                  {entry.effectiveAvailability !== undefined
                    ? ` of ${entry.effectiveAvailability}`
                    : ''}
                </strong>
                <span>
                  {entry.remainingQuantity !== undefined
                    ? `${entry.remainingQuantity} remaining`
                    : 'Availability not limited'}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {usage.unusedCartons.length > 0 && (
        <>
          <h3 style={styles.inventorySubheading}>
            Unused box types
          </h3>

          <div style={styles.recommendationList}>
            {usage.unusedCartons.map(entry => {
              const dimensions = entry.carton.internalDimensions;

              return (
                <div
                  key={entry.cartonId}
                  style={styles.inventoryItem}
                >
                  <div style={styles.inventoryItemMain}>
                    <strong>
                      {entry.carton.name ?? entry.cartonId}
                    </strong>
                    <span style={styles.inventoryDimensions}>
                      {dimensions.length} × {dimensions.width} ×{' '}
                      {dimensions.height} mm
                    </span>
                  </div>

                  <div style={styles.inventoryCounts}>
                    <strong>Used 0</strong>
                    <span>
                      {entry.effectiveAvailability !== undefined
                        ? `${entry.effectiveAvailability} available`
                        : 'Availability not limited'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      <p style={styles.recommendationNote}>
        Packmetry used only the box types and available quantities
        entered in this mode. It did not generate purchase boxes.
      </p>
    </section>
  );
}

function nextCartonId(
  cartons: readonly WorkspaceCartonValues[]
): string {
  let index = 1;

  while (
    cartons.some(
      carton => carton.id === `workspace-carton-${index}`
    )
  ) {
    index++;
  }

  return `workspace-carton-${index}`;
}

export default function PackingWorkspace({
  initialMode = 'need-boxes',
}: PackingWorkspaceProps = {}) {
  const [mode, setMode] =
    useState<WorkspaceMode>(initialMode);
  const [values, setValues] = useState<WorkspaceValues>(
    DEFAULT_WORKSPACE_VALUES
  );
  const [cartons, setCartons] = useState<WorkspaceCartonValues[]>(
    () => DEFAULT_WORKSPACE_CARTONS.map(carton => ({ ...carton }))
  );
  const [plan, setPlan] = useState<PackingPlan | null>(null);
  const [
    purchaseRecommendations,
    setPurchaseRecommendations,
  ] = useState<PurchaseCartonRecommendation[]>([]);
  const [inventoryUsage, setInventoryUsage] =
    useState<HaveBoxesInventoryUsage | null>(null);
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

  const updateCarton = (
    id: string,
    key: Exclude<keyof WorkspaceCartonValues, 'id'>,
    value: number
  ) => {
    setCartons(current =>
      current.map(carton =>
        carton.id === id
          ? {
              ...carton,
              [key]: value,
            }
          : carton
      )
    );
  };

  const addCarton = () => {
    setCartons(current => [
      ...current,
      {
        id: nextCartonId(current),
        lengthMm: 100,
        widthMm: 100,
        heightMm: 100,
        quantityAvailable: 1,
      },
    ]);
  };

  const removeCarton = (id: string) => {
    setCartons(current => {
      if (current.length <= 1) {
        return current;
      }

      return current.filter(carton => carton.id !== id);
    });
  };

  const clearResult = () => {
    setPlan(null);
    setPurchaseRecommendations([]);
    setInventoryUsage(null);
    setError(null);
  };

  const chooseMode = (nextMode: WorkspaceMode) => {
    setMode(nextMode);
    clearResult();
  };

  const submit = async (
    event: SyntheticEvent<HTMLFormElement>
  ) => {
    event.preventDefault();
    setRunning(true);
    clearResult();

    try {
      if (mode === 'need-boxes') {
        const result =
          await runNeedBoxesWorkspace(values);

        setPlan(result.plan);
        setPurchaseRecommendations(
          result.purchaseRecommendations
        );
      } else {
        const result = await runHaveBoxesWorkspace(
          values,
          cartons
        );

        setPlan(result.plan);
        setInventoryUsage(result.inventoryUsage);
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
          recommend boxes or plan against the box inventory you
          already have, then independently verify the packing result.
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
              aria-pressed={mode === 'have-boxes'}
              onClick={() => chooseMode('have-boxes')}
              style={{
                ...styles.modeButton,
                ...(mode === 'have-boxes'
                  ? styles.modeButtonActive
                  : {}),
              }}
            >
              <strong>I Already Have Boxes</strong>
              <span style={styles.modeDescription}>
                Pack only with box types and quantities I have.
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
              <div style={styles.sectionHeadingRow}>
                <div>
                  <h2 style={styles.boxesHeading}>
                    Boxes you have
                  </h2>
                  <p style={styles.sectionHint}>
                    Add every box type Packmetry may use and how many
                    are currently available.
                  </p>
                </div>
              </div>

              <div style={styles.cartonList}>
                {cartons.map((carton, index) => (
                  <section
                    key={carton.id}
                    aria-label={`Box type ${index + 1}`}
                    style={styles.cartonEditor}
                  >
                    <div style={styles.cartonEditorHeader}>
                      <strong>Box type {index + 1}</strong>

                      {cartons.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeCarton(carton.id)}
                          style={styles.removeButton}
                        >
                          Remove
                        </button>
                      )}
                    </div>

                    <div style={styles.fields}>
                      <NumberField
                        label="Length (mm)"
                        value={carton.lengthMm}
                        min={0.001}
                        step={0.001}
                        onChange={value =>
                          updateCarton(
                            carton.id,
                            'lengthMm',
                            value
                          )
                        }
                      />
                      <NumberField
                        label="Width (mm)"
                        value={carton.widthMm}
                        min={0.001}
                        step={0.001}
                        onChange={value =>
                          updateCarton(
                            carton.id,
                            'widthMm',
                            value
                          )
                        }
                      />
                      <NumberField
                        label="Height (mm)"
                        value={carton.heightMm}
                        min={0.001}
                        step={0.001}
                        onChange={value =>
                          updateCarton(
                            carton.id,
                            'heightMm',
                            value
                          )
                        }
                      />
                      <NumberField
                        label="Available quantity"
                        value={carton.quantityAvailable}
                        min={0}
                        onChange={value =>
                          updateCarton(
                            carton.id,
                            'quantityAvailable',
                            value
                          )
                        }
                      />
                    </div>
                  </section>
                ))}
              </div>

              <button
                type="button"
                onClick={addCarton}
                style={styles.secondaryButton}
              >
                + Add another box type
              </button>

              <div style={styles.helper}>
                <strong>Inventory limits are enforced.</strong>
                <span>
                  Packmetry will not invent or purchase extra boxes
                  in this mode. A zero available quantity means that
                  box type cannot be opened.
                </span>
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

              {mode === 'have-boxes' &&
                inventoryUsage !== null && (
                  <InventoryUsageSummary
                    usage={inventoryUsage}
                  />
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
  sectionHeadingRow: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: '12px',
    alignItems: 'start',
    marginTop: '24px',
  },
  boxesHeading: {
    margin: '0 0 4px',
    fontSize: '18px',
  },
  sectionHint: {
    margin: 0,
    color: '#71717a',
    fontSize: '12px',
    lineHeight: 1.5,
  },
  cartonList: {
    display: 'grid',
    gap: '12px',
    marginTop: '14px',
  },
  cartonEditor: {
    border: '1px solid #e4e4e7',
    borderRadius: '12px',
    padding: '14px',
    background: '#fafafa',
  },
  cartonEditorHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '12px',
  },
  removeButton: {
    border: 0,
    padding: 0,
    background: 'transparent',
    color: '#71717a',
    font: 'inherit',
    fontSize: '12px',
    fontWeight: 700,
    cursor: 'pointer',
  },
  secondaryButton: {
    width: '100%',
    marginTop: '12px',
    border: '1px solid #d4d4d8',
    borderRadius: '10px',
    padding: '10px 14px',
    background: '#ffffff',
    color: '#18181b',
    font: 'inherit',
    fontWeight: 700,
    cursor: 'pointer',
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
  inventorySummary: {
    marginBottom: '22px',
    borderBottom: '1px solid #e4e4e7',
    paddingBottom: '20px',
  },
  inventoryLead: {
    margin: '-4px 0 12px',
    color: '#52525b',
    fontSize: '13px',
    lineHeight: 1.5,
  },
  inventorySubheading: {
    margin: '16px 0 8px',
    fontSize: '14px',
  },
  inventoryItem: {
    display: 'grid',
    gridTemplateColumns: 'minmax(0, 1fr) auto',
    gap: '12px',
    alignItems: 'center',
    border: '1px solid #e4e4e7',
    borderRadius: '10px',
    padding: '12px',
    background: '#fafafa',
  },
  inventoryItemMain: {
    display: 'grid',
    gap: '3px',
    minWidth: 0,
  },
  inventoryDimensions: {
    color: '#71717a',
    fontSize: '12px',
  },
  inventoryCounts: {
    display: 'grid',
    gap: '3px',
    textAlign: 'right' as const,
    fontSize: '12px',
    color: '#71717a',
  },
} as const;
