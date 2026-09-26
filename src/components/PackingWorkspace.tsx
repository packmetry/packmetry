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
  planHybridBoxes,
  planNeedBoxes,
  type HaveBoxesInventoryUsage,
  type HybridRemainderInstanceMapping,
  type PurchaseCartonRecommendation,
} from '../core/workflows/index.js';

export type WorkspaceMode =
  | 'need-boxes'
  | 'have-boxes'
  | 'hybrid-boxes';

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

export interface HybridBoxesWorkspaceResult {
  existingPlan: PackingPlan;
  existingInventoryUsage: HaveBoxesInventoryUsage;
  remainderItemCount: number;
  remainderInstanceMapping: HybridRemainderInstanceMapping[];
  supplementalPlan: PackingPlan | null;
  supplementalPurchaseRecommendations: PurchaseCartonRecommendation[];
  replacementPlan: PackingPlan | null;
  replacementPurchaseRecommendations: PurchaseCartonRecommendation[];
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

function selectionError(
  prefix: string,
  selection:
    | {
        kind: 'no-valid-candidate';
      }
    | {
        kind: 'objective-unsupported';
        objective: string;
      }
    | {
        kind: 'insufficient-data';
        objective: string;
        missingMetric: string;
      }
): Error {
  switch (selection.kind) {
    case 'no-valid-candidate':
      return new Error(prefix);

    case 'objective-unsupported':
      return new Error(
        `Packing objective is not supported: ${selection.objective}`
      );

    case 'insufficient-data':
      return new Error(
        `Packing objective requires additional data: ${selection.missingMetric}`
      );
  }
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

  throw selectionError(
    'No independently verified solver candidate was produced',
    result.selection
  );
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

  throw selectionError(
    'No independently verified box recommendation was produced',
    result.planningResult.selection
  );
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

  if (result.planningResult.kind !== 'planned') {
    throw selectionError(
      'No independently verified existing-box plan was produced',
      result.planningResult.selection
    );
  }

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

export async function runHybridBoxesWorkspace(
  values: WorkspaceValues,
  cartons: readonly WorkspaceCartonValues[]
): Promise<HybridBoxesWorkspaceResult> {
  const item = createWorkspaceItem(values);

  const result = await planHybridBoxes(
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

  if (result.existing.planningResult.kind !== 'planned') {
    throw selectionError(
      'No independently verified existing-box stage was produced',
      result.existing.planningResult.selection
    );
  }

  if (result.existing.inventoryUsage === null) {
    throw new Error(
      'Existing box inventory usage was not produced'
    );
  }

  let supplementalPlan: PackingPlan | null = null;
  let supplementalPurchaseRecommendations:
    PurchaseCartonRecommendation[] = [];

  if (result.supplemental !== null) {
    if (result.supplemental.planningResult.kind !== 'planned') {
      throw selectionError(
        'No independently verified supplemental-box stage was produced',
        result.supplemental.planningResult.selection
      );
    }

    supplementalPlan =
      result.supplemental.planningResult.plan;
    supplementalPurchaseRecommendations =
      result.supplemental.purchaseRecommendations;
  }

  let replacementPlan: PackingPlan | null = null;
  let replacementPurchaseRecommendations:
    PurchaseCartonRecommendation[] = [];

  if (result.replacementAlternative !== null) {
    if (
      result.replacementAlternative.planningResult.kind !==
      'planned'
    ) {
      throw selectionError(
        'No independently verified replacement comparison was produced',
        result.replacementAlternative.planningResult.selection
      );
    }

    replacementPlan =
      result.replacementAlternative.planningResult.plan;
    replacementPurchaseRecommendations =
      result.replacementAlternative.purchaseRecommendations;
  }

  return {
    existingPlan: result.existing.planningResult.plan,
    existingInventoryUsage: result.existing.inventoryUsage,
    remainderItemCount: result.remainderItems.reduce(
      (sum, remainderItem) => sum + remainderItem.quantity,
      0
    ),
    remainderInstanceMapping:
      result.remainderInstanceMapping.map(entry => ({
        ...entry,
      })),
    supplementalPlan,
    supplementalPurchaseRecommendations,
    replacementPlan,
    replacementPurchaseRecommendations,
  };
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

function PurchaseRecommendationSummary({
  title,
  recommendations,
  note,
}: {
  title: string;
  recommendations: readonly PurchaseCartonRecommendation[];
  note: string;
}) {
  return (
    <section
      aria-label={title}
      style={styles.recommendation}
    >
      <p style={styles.eyebrow}>Box recommendation</p>
      <h2 style={styles.recommendationHeading}>{title}</h2>

      <div style={styles.recommendationList}>
        {recommendations.map(recommendation => {
          const dimensions =
            recommendation.carton.internalDimensions;

          return (
            <div
              key={recommendation.cartonId}
              style={styles.recommendationItem}
            >
              <strong>
                Quantity {recommendation.quantity}
              </strong>
              <span style={styles.recommendationSize}>
                {dimensions.length} × {dimensions.width} ×{' '}
                {dimensions.height} mm
              </span>
            </div>
          );
        })}
      </div>

      <p style={styles.recommendationNote}>{note}</p>
    </section>
  );
}

function InventoryUsageSummary({
  usage,
  note = 'Packmetry used only the box types and available quantities entered in this mode. It did not generate purchase boxes.',
}: {
  usage: HaveBoxesInventoryUsage;
  note?: string;
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

      <p style={styles.recommendationNote}>{note}</p>
    </section>
  );
}

function PlanStage({
  label,
  title,
  detail,
  plan,
}: {
  label: string;
  title: string;
  detail: string;
  plan: PackingPlan;
}) {
  return (
    <section
      aria-label={title}
      style={styles.planStage}
    >
      <div style={styles.planStageHeader}>
        <p style={styles.eyebrow}>{label}</p>
        <h2 style={styles.planStageTitle}>{title}</h2>
        <p style={styles.planStageDetail}>{detail}</p>
      </div>

      <ResultSummary plan={plan} />
      <PackingVisualization plan={plan} />
    </section>
  );
}

function HybridResult({
  result,
}: {
  result: HybridBoxesWorkspaceResult;
}) {
  const existingPacked =
    result.existingPlan.metrics.placedItemCount;

  return (
    <>
      <section
        aria-label="Hybrid packing overview"
        style={styles.hybridOverview}
      >
        <p style={styles.eyebrow}>Hybrid packing result</p>
        <h2 style={styles.recommendationHeading}>
          Use what you have, then buy only what is still needed
        </h2>

        {result.remainderItemCount === 0 ? (
          <p style={styles.hybridOverviewText}>
            Your existing box inventory covers every requested item.
            Nothing additional needs to be purchased.
          </p>
        ) : (
          <p style={styles.hybridOverviewText}>
            Existing inventory packs {existingPacked}{' '}
            {existingPacked === 1 ? 'item' : 'items'}. The verified
            remainder contains {result.remainderItemCount}{' '}
            {result.remainderItemCount === 1 ? 'item' : 'items'} and
            is planned separately with purchase boxes below.
          </p>
        )}

        <p style={styles.hybridBoundaryNote}>
          The existing, supplemental, and replacement results remain
          separate independently verified canonical plans. Packmetry
          does not fabricate one merged PackingPlan.
        </p>
      </section>

      <InventoryUsageSummary
        usage={result.existingInventoryUsage}
        note={
          result.remainderItemCount === 0
            ? 'These existing boxes cover the complete request, so no supplemental purchase stage was needed.'
            : 'These existing boxes are used first. Purchase recommendations below cover only the verified remainder.'
        }
      />

      <PlanStage
        label="Step 1"
        title="Existing boxes"
        detail="This canonical plan uses only the box inventory and quantities you entered."
        plan={result.existingPlan}
      />

      {result.supplementalPlan !== null && (
        <>
          {result.supplementalPurchaseRecommendations.length >
            0 && (
            <PurchaseRecommendationSummary
              title="What to buy for the remainder"
              recommendations={
                result.supplementalPurchaseRecommendations
              }
              note="These internal box dimensions are derived only from the verified items left unpacked after the existing-inventory stage."
            />
          )}

          <PlanStage
            label="Step 2"
            title="Supplemental boxes for the remainder"
            detail="This is a separate canonical plan for the verified remainder only."
            plan={result.supplementalPlan}
          />
        </>
      )}

      {result.replacementPlan !== null && (
        <section
          aria-label="Complete purchase replacement comparison"
          style={styles.comparisonSection}
        >
          <p style={styles.eyebrow}>Comparison only</p>
          <h2 style={styles.recommendationHeading}>
            Buy boxes for everything instead
          </h2>
          <p style={styles.hybridOverviewText}>
            This alternative ignores the existing inventory and
            plans the complete item request with generated purchase
            boxes. It is shown separately; Packmetry has not chosen
            it as a winner.
          </p>

          {result.replacementPurchaseRecommendations.length >
            0 && (
            <PurchaseRecommendationSummary
              title="Complete replacement box list"
              recommendations={
                result.replacementPurchaseRecommendations
              }
              note="This box list belongs only to the complete purchase-only comparison plan."
            />
          )}

          <PlanStage
            label="Alternative"
            title="Purchase-only replacement plan"
            detail="This independently verified plan covers the full request without using your existing boxes."
            plan={result.replacementPlan}
          />
        </section>
      )}
    </>
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
  const [hybridResult, setHybridResult] =
    useState<HybridBoxesWorkspaceResult | null>(null);
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
    setHybridResult(null);
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
      } else if (mode === 'have-boxes') {
        const result = await runHaveBoxesWorkspace(
          values,
          cartons
        );

        setPlan(result.plan);
        setInventoryUsage(result.inventoryUsage);
      } else {
        const result = await runHybridBoxesWorkspace(
          values,
          cartons
        );

        setHybridResult(result);
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

  const showsInventoryEditor =
    mode === 'have-boxes' || mode === 'hybrid-boxes';

  return (
    <main style={styles.page}>
      <section style={styles.hero}>
        <p style={styles.eyebrow}>Packmetry workspace</p>
        <h1 style={styles.heading}>Pack an item into a box</h1>
        <p style={styles.intro}>
          Enter item dimensions in millimetres. Packmetry can
          recommend boxes, use only boxes you already have, or use
          your inventory first and recommend boxes for the verified
          remainder.
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

            <button
              type="button"
              aria-pressed={mode === 'hybrid-boxes'}
              onClick={() => chooseMode('hybrid-boxes')}
              style={{
                ...styles.modeButton,
                ...(mode === 'hybrid-boxes'
                  ? styles.modeButtonActive
                  : {}),
              }}
            >
              <strong>
                Use What I Have, Then Tell Me What to Buy
              </strong>
              <span style={styles.modeDescription}>
                Use existing inventory first, then recommend boxes
                only for the verified remainder.
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

          {mode === 'need-boxes' && (
            <div style={styles.helper}>
              <strong>No box dimensions needed.</strong>
              <span>
                Packmetry will generate box candidates, solve them,
                independently verify the result, and recommend the
                internal dimensions actually used by the canonical
                plan.
              </span>
            </div>
          )}

          {showsInventoryEditor && (
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

              {mode === 'have-boxes' ? (
                <div style={styles.helper}>
                  <strong>Inventory limits are enforced.</strong>
                  <span>
                    Packmetry will not invent or purchase extra boxes
                    in this mode. A zero available quantity means that
                    box type cannot be opened.
                  </span>
                </div>
              ) : (
                <div style={styles.helper}>
                  <strong>Use existing boxes first.</strong>
                  <span>
                    Packmetry will independently verify what your
                    inventory can pack, derive the exact remainder,
                    recommend purchase boxes only for that remainder,
                    and keep a full purchase-only alternative
                    separate for comparison.
                  </span>
                </div>
              )}
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
          {!plan && !hybridResult && !error && (
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
                  <PurchaseRecommendationSummary
                    title="What to buy"
                    recommendations={purchaseRecommendations}
                    note="Recommended internal dimensions from the verified packing plan. Supplier availability and external dimensions are not claimed."
                  />
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

          {mode === 'hybrid-boxes' &&
            hybridResult !== null && (
              <HybridResult result={hybridResult} />
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
    maxWidth: '760px',
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
    maxWidth: '720px',
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
    gridTemplateColumns:
      'repeat(auto-fit, minmax(150px, 1fr))',
    gap: '10px',
  },
  modeButton: {
    display: 'grid',
    gap: '5px',
    minHeight: '104px',
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
  hybridOverview: {
    marginBottom: '22px',
    borderBottom: '1px solid #e4e4e7',
    paddingBottom: '20px',
  },
  hybridOverviewText: {
    margin: '0 0 10px',
    color: '#52525b',
    fontSize: '13px',
    lineHeight: 1.55,
  },
  hybridBoundaryNote: {
    margin: 0,
    borderRadius: '10px',
    padding: '10px 12px',
    background: '#f4f4f5',
    color: '#52525b',
    fontSize: '12px',
    lineHeight: 1.5,
  },
  planStage: {
    marginTop: '24px',
    borderTop: '1px solid #e4e4e7',
    paddingTop: '20px',
  },
  planStageHeader: {
    marginBottom: '18px',
  },
  planStageTitle: {
    margin: '0 0 6px',
    fontSize: '20px',
    color: '#18181b',
  },
  planStageDetail: {
    margin: 0,
    color: '#71717a',
    fontSize: '12px',
    lineHeight: 1.5,
  },
  comparisonSection: {
    marginTop: '28px',
    borderTop: '2px solid #d4d4d8',
    paddingTop: '22px',
  },
} as const;
