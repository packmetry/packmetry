import { useEffect, useState, type SyntheticEvent } from 'react';

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

export interface WorkspaceItemValues {
  id: string;
  name?: string;
  lengthMm: number;
  widthMm: number;
  heightMm: number;
  quantity: number;
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

export const DEFAULT_WORKSPACE_ITEMS: WorkspaceItemValues[] = [
  {
    id: 'workspace-item-1',
    name: '',
    lengthMm: 80,
    widthMm: 80,
    heightMm: 80,
    quantity: 1,
  },
];

export const DEFAULT_WORKSPACE_CARTONS: WorkspaceCartonValues[] = [
  {
    id: 'workspace-carton-1',
    lengthMm: 100,
    widthMm: 100,
    heightMm: 100,
    quantityAvailable: 1,
  },
];

const MODE_COPY: Record<
  WorkspaceMode,
  {
    short: string;
    full: string;
    description: string;
  }
> = {
  'need-boxes': {
    short: 'Need boxes',
    full: 'I Need Boxes',
    description:
      'Tell Packmetry what you are packing. It will recommend internal box dimensions from a verified packing plan.',
  },
  'have-boxes': {
    short: 'Have boxes',
    full: 'I Already Have Boxes',
    description:
      'Use only the box types and available quantities you enter. Inventory limits are enforced.',
  },
  'hybrid-boxes': {
    short: 'Use mine + buy rest',
    full: 'Use What I Have, Then Tell Me What to Buy',
    description:
      'Use your existing inventory first, then recommend purchase boxes only for the verified remainder.',
  },
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

function createWorkspaceItems(
  items: readonly WorkspaceItemValues[]
) {
  return items.map((item, index) =>
    createItem({
      id: item.id,
      name: item.name?.trim() || `Item ${index + 1}`,
      dimensions: {
        length: item.lengthMm,
        width: item.widthMm,
        height: item.heightMm,
      },
      quantity: item.quantity,
    })
  );
}

function createWorkspaceItemLabels(
  items: readonly WorkspaceItemValues[]
): Readonly<Record<string, string>> {
  return Object.fromEntries(
    items.map((item, index) => [
      item.id,
      item.name?.trim() || `Item ${index + 1}`,
    ])
  );
}

function legacyWorkspaceItemValues(
  values: WorkspaceValues
): WorkspaceItemValues {
  return {
    id: 'workspace-item',
    name: '',
    lengthMm: values.itemLengthMm,
    widthMm: values.itemWidthMm,
    heightMm: values.itemHeightMm,
    quantity: values.itemQuantity,
  };
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

export async function runNeedBoxesWorkspaceItems(
  items: readonly WorkspaceItemValues[]
): Promise<NeedBoxesWorkspaceResult> {
  const result = await planNeedBoxes(
    'workspace-plan',
    new BaselineSolver(),
    {
      items: createWorkspaceItems(items),
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

export async function runNeedBoxesWorkspace(
  values: WorkspaceValues
): Promise<NeedBoxesWorkspaceResult> {
  return runNeedBoxesWorkspaceItems([
    legacyWorkspaceItemValues(values),
  ]);
}

export async function runHaveBoxesWorkspaceItems(
  items: readonly WorkspaceItemValues[],
  cartons: readonly WorkspaceCartonValues[]
): Promise<HaveBoxesWorkspaceResult> {
  const result = await planHaveBoxes(
    'workspace-plan',
    new BaselineSolver(),
    {
      items: createWorkspaceItems(items),
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

export async function runHaveBoxesWorkspace(
  values: WorkspaceValues,
  cartons: readonly WorkspaceCartonValues[]
): Promise<HaveBoxesWorkspaceResult> {
  return runHaveBoxesWorkspaceItems(
    [legacyWorkspaceItemValues(values)],
    cartons
  );
}

export async function runHybridBoxesWorkspaceItems(
  items: readonly WorkspaceItemValues[],
  cartons: readonly WorkspaceCartonValues[]
): Promise<HybridBoxesWorkspaceResult> {
  const result = await planHybridBoxes(
    'workspace-plan',
    new BaselineSolver(),
    {
      items: createWorkspaceItems(items),
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

export async function runHybridBoxesWorkspace(
  values: WorkspaceValues,
  cartons: readonly WorkspaceCartonValues[]
): Promise<HybridBoxesWorkspaceResult> {
  return runHybridBoxesWorkspaceItems(
    [legacyWorkspaceItemValues(values)],
    cartons
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
    <label className="pm-field">
      <span className="pm-field-label">{label}</span>
      <input
        className="pm-number-input"
        type="number"
        value={value}
        min={min}
        step={step}
        onChange={event =>
          onChange(Number(event.target.value))
        }
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
      className="pm-result-section pm-recommendation"
    >
      <div className="pm-section-kicker">
        Box recommendation
      </div>

      <div className="pm-section-heading-row">
        <h2 className="pm-result-section-title">
          {title}
        </h2>
        <span className="pm-verified-mark">
          Verified plan
        </span>
      </div>

      <div className="pm-recommendation-list">
        {recommendations.map(recommendation => {
          const dimensions =
            recommendation.carton.internalDimensions;

          return (
            <div
              key={recommendation.cartonId}
              className="pm-recommendation-row"
            >
              <div>
                <span className="pm-recommendation-quantity">
                  {recommendation.quantity} ×
                </span>{' '}
                <strong>
                  {recommendation.carton.name ??
                    'Recommended box'}
                </strong>
              </div>

              <span className="pm-dimension-value">
                {dimensions.length} × {dimensions.width} ×{' '}
                {dimensions.height} mm
              </span>
            </div>
          );
        })}
      </div>

      <p className="pm-fine-print">{note}</p>
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
      className="pm-result-section"
    >
      <div className="pm-section-kicker">
        Existing box inventory
      </div>

      <div className="pm-section-heading-row">
        <h2 className="pm-result-section-title">
          Boxes used
        </h2>

        <span className="pm-count-summary">
          {totalUsed} box{totalUsed === 1 ? '' : 'es'}
        </span>
      </div>

      <div className="pm-inventory-result-list">
        {usage.usedCartons.map(entry => {
          const dimensions =
            entry.carton.internalDimensions;

          return (
            <div
              key={entry.cartonId}
              className="pm-inventory-result-row"
            >
              <div className="pm-inventory-result-main">
                <strong>
                  {entry.carton.name ?? entry.cartonId}
                </strong>

                <span className="pm-dimension-value">
                  {dimensions.length} × {dimensions.width} ×{' '}
                  {dimensions.height} mm
                </span>
              </div>

              <div className="pm-inventory-result-count">
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
        <details className="pm-details">
          <summary>
            Unused box types ({usage.unusedCartons.length})
          </summary>

          <div className="pm-details-body">
            {usage.unusedCartons.map(entry => {
              const dimensions =
                entry.carton.internalDimensions;

              return (
                <div
                  key={entry.cartonId}
                  className="pm-inventory-result-row"
                >
                  <div className="pm-inventory-result-main">
                    <strong>
                      {entry.carton.name ?? entry.cartonId}
                    </strong>

                    <span className="pm-dimension-value">
                      {dimensions.length} × {dimensions.width} ×{' '}
                      {dimensions.height} mm
                    </span>
                  </div>

                  <div className="pm-inventory-result-count">
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
        </details>
      )}

      <p className="pm-fine-print">{note}</p>
    </section>
  );
}

type HybridView =
  | 'existing'
  | 'supplemental'
  | 'replacement';

function HybridResult({
  result,
  itemLabels,
}: {
  result: HybridBoxesWorkspaceResult;
  itemLabels: Readonly<Record<string, string>>;
}) {
  const preferredView: HybridView =
    result.supplementalPlan !== null
      ? 'supplemental'
      : 'existing';

  const [requestedView, setRequestedView] =
    useState<HybridView>(preferredView);

  useEffect(() => {
    setRequestedView(preferredView);
  }, [result, preferredView]);

  const existingPacked =
    result.existingPlan.metrics.placedItemCount;

  const activeView: HybridView =
    requestedView === 'supplemental' &&
    result.supplementalPlan === null
      ? 'existing'
      : requestedView === 'replacement' &&
          result.replacementPlan === null
        ? 'existing'
        : requestedView;

  const activePlan =
    activeView === 'supplemental'
      ? result.supplementalPlan ??
        result.existingPlan
      : activeView === 'replacement'
        ? result.replacementPlan ??
          result.existingPlan
        : result.existingPlan;

  const activeTitle =
    activeView === 'existing'
      ? 'Existing boxes'
      : activeView === 'supplemental'
        ? 'Buy for the remainder'
        : 'Buy boxes for everything instead';

  const activeDescription =
    activeView === 'existing'
      ? 'This verified plan uses only the box inventory and quantities you entered.'
      : activeView === 'supplemental'
        ? 'This is a separate verified plan for the exact remainder left after existing inventory was used.'
        : 'Comparison only. This separate verified plan ignores existing inventory and packs the complete request with generated purchase boxes.';

  return (
    <div className="pm-hybrid-result">
      <section
        aria-label="Hybrid packing overview"
        className="pm-result-section pm-result-lead"
      >
        <div className="pm-section-kicker">
          Hybrid packing result
        </div>

        <h2 className="pm-result-headline">
          Use what you have, then buy only what is still needed
        </h2>

        {result.remainderItemCount === 0 ? (
          <p className="pm-result-copy">
            Your existing box inventory covers every requested item.
            Nothing additional needs to be purchased.
          </p>
        ) : (
          <p className="pm-result-copy">
            Existing inventory packs {existingPacked}{' '}
            {existingPacked === 1
              ? 'item'
              : 'items'}
            . Buy boxes only for the{' '}
            {result.remainderItemCount}{' '}
            {result.remainderItemCount === 1
              ? 'item'
              : 'items'}{' '}
            in the verified remainder.
          </p>
        )}

        <details className="pm-details pm-technical-details">
          <summary>
            How this result is verified
          </summary>

          <div className="pm-details-body">
            The existing, supplemental, and replacement results remain
            separate independently verified canonical plans. Packmetry
            does not fabricate one merged PackingPlan.
          </div>
        </details>
      </section>

      <InventoryUsageSummary
        usage={result.existingInventoryUsage}
        note={
          result.remainderItemCount === 0
            ? 'These existing boxes cover the complete request, so no supplemental purchase stage was needed.'
            : 'These existing boxes are used first. Purchase recommendations cover only the verified remainder.'
        }
      />

      {result.supplementalPlan !== null &&
        result.supplementalPurchaseRecommendations.length >
          0 && (
          <PurchaseRecommendationSummary
            title="What to buy for the remainder"
            recommendations={
              result.supplementalPurchaseRecommendations
            }
            note="Recommended internal dimensions are derived only from the items left unpacked after the existing-inventory stage."
          />
        )}

      <section className="pm-result-section pm-plan-view">
        <div className="pm-plan-view-header">
          <div>
            <div className="pm-section-kicker">
              Packing view
            </div>

            <h2 className="pm-result-section-title">
              {activeTitle}
            </h2>

            <p className="pm-plan-description">
              {activeDescription}
            </p>
          </div>

          {(result.supplementalPlan !== null ||
            result.replacementPlan !== null) && (
            <div
              className="pm-result-tabs"
              role="group"
              aria-label="Hybrid result view"
            >
              <button
                type="button"
                aria-pressed={
                  activeView === 'existing'
                }
                onClick={() =>
                  setRequestedView('existing')
                }
              >
                Existing
              </button>

              {result.supplementalPlan !==
                null && (
                <button
                  type="button"
                  aria-pressed={
                    activeView === 'supplemental'
                  }
                  onClick={() =>
                    setRequestedView('supplemental')
                  }
                >
                  Buy remainder
                </button>
              )}

              {result.replacementPlan !== null && (
                <button
                  type="button"
                  aria-pressed={
                    activeView === 'replacement'
                  }
                  onClick={() =>
                    setRequestedView('replacement')
                  }
                >
                  Compare
                </button>
              )}
            </div>
          )}
        </div>

        {activeView === 'replacement' &&
          result.replacementPurchaseRecommendations
            .length > 0 && (
            <div className="pm-inline-comparison">
              <span className="pm-section-kicker">
                Comparison only
              </span>

              <span>
                {result.replacementPurchaseRecommendations
                  .map(recommendation => {
                    const dimensions =
                      recommendation.carton
                        .internalDimensions;

                    return `${recommendation.quantity} × ${dimensions.length} × ${dimensions.width} × ${dimensions.height} mm`;
                  })
                  .join(' · ')}
              </span>
            </div>
          )}

        <div className="pm-plan-output">
          <ResultSummary plan={activePlan} />
          <PackingVisualization
            plan={activePlan}
            itemLabels={itemLabels}
          />
        </div>
      </section>
    </div>
  );
}

function nextItemId(
  items: readonly WorkspaceItemValues[]
): string {
  let index = 1;

  while (
    items.some(
      item =>
        item.id === `workspace-item-${index}`
    )
  ) {
    index++;
  }

  return `workspace-item-${index}`;
}

function nextCartonId(
  cartons: readonly WorkspaceCartonValues[]
): string {
  let index = 1;

  while (
    cartons.some(
      carton =>
        carton.id === `workspace-carton-${index}`
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

  const [items, setItems] =
    useState<WorkspaceItemValues[]>(
      () =>
        DEFAULT_WORKSPACE_ITEMS.map(item => ({
          ...item,
        }))
    );

  const [cartons, setCartons] =
    useState<WorkspaceCartonValues[]>(
      () =>
        DEFAULT_WORKSPACE_CARTONS.map(
          carton => ({
            ...carton,
          })
        )
    );

  const [plan, setPlan] =
    useState<PackingPlan | null>(null);

  const [
    purchaseRecommendations,
    setPurchaseRecommendations,
  ] = useState<
    PurchaseCartonRecommendation[]
  >([]);

  const [inventoryUsage, setInventoryUsage] =
    useState<HaveBoxesInventoryUsage | null>(
      null
    );

  const [hybridResult, setHybridResult] =
    useState<HybridBoxesWorkspaceResult | null>(
      null
    );

  const [error, setError] =
    useState<string | null>(null);

  const [running, setRunning] =
    useState(false);

  const itemLabels = createWorkspaceItemLabels(items);

  const updateItem = (
    id: string,
    key: Exclude<
      keyof WorkspaceItemValues,
      'id' | 'name'
    >,
    value: number
  ) => {
    setItems(current =>
      current.map(item =>
        item.id === id
          ? {
              ...item,
              [key]: value,
            }
          : item
      )
    );
  };

  const updateItemName = (
    id: string,
    name: string
  ) => {
    setItems(current =>
      current.map(item =>
        item.id === id
          ? {
              ...item,
              name,
            }
          : item
      )
    );
  };

  const addItem = () => {
    setItems(current => [
      ...current,
      {
        id: nextItemId(current),
        name: '',
        lengthMm: 80,
        widthMm: 80,
        heightMm: 80,
        quantity: 1,
      },
    ]);
  };

  const removeItem = (id: string) => {
    setItems(current => {
      if (current.length <= 1) {
        return current;
      }

      return current.filter(
        item => item.id !== id
      );
    });
  };

  const updateCarton = (
    id: string,
    key: Exclude<
      keyof WorkspaceCartonValues,
      'id'
    >,
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

      return current.filter(
        carton => carton.id !== id
      );
    });
  };

  const clearResult = () => {
    setPlan(null);
    setPurchaseRecommendations([]);
    setInventoryUsage(null);
    setHybridResult(null);
    setError(null);
  };

  const chooseMode = (
    nextMode: WorkspaceMode
  ) => {
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
          await runNeedBoxesWorkspaceItems(
            items
          );

        setPlan(result.plan);

        setPurchaseRecommendations(
          result.purchaseRecommendations
        );
      } else if (mode === 'have-boxes') {
        const result =
          await runHaveBoxesWorkspaceItems(
            items,
            cartons
          );

        setPlan(result.plan);

        setInventoryUsage(
          result.inventoryUsage
        );
      } else {
        const result =
          await runHybridBoxesWorkspaceItems(
            items,
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
    mode === 'have-boxes' ||
    mode === 'hybrid-boxes';

  return (
    <main className="pm-workspace">
      <header className="pm-app-header">
        <div>
          <p className="pm-app-kicker">
            Packmetry workspace
          </p>

          <h1>
            Pack items into the right boxes
          </h1>
        </div>

        <p className="pm-app-intro">
          Enter your items, choose how boxes
          are sourced, and inspect the verified
          packing result in 3D.
        </p>
      </header>

      <div className="pm-workbench">
        <form
          onSubmit={submit}
          className="pm-pane pm-setup-pane"
        >
          <div className="pm-pane-header">
            <div>
              <p className="pm-pane-kicker">
                Setup
              </p>

              <h2>
                What are you packing?
              </h2>
            </div>

            <span className="pm-unit-note">
              Measurements in mm
            </span>
          </div>

          <section className="pm-form-section pm-mode-section">
            <div
              role="group"
              aria-label="Box availability"
              className="pm-mode-selector"
            >
              {(
                Object.keys(
                  MODE_COPY
                ) as WorkspaceMode[]
              ).map(option => (
                <button
                  key={option}
                  type="button"
                  aria-label={
                    MODE_COPY[option].full
                  }
                  aria-pressed={
                    mode === option
                  }
                  onClick={() =>
                    chooseMode(option)
                  }
                  className="pm-mode-option"
                >
                  {MODE_COPY[option].short}
                </button>
              ))}
            </div>

            <div className="pm-mode-explainer">
              <strong>
                {MODE_COPY[mode].full}
              </strong>

              <span>
                {MODE_COPY[mode].description}
              </span>
            </div>
          </section>

          <section className="pm-form-section">
            <div className="pm-form-section-heading">
              <span className="pm-section-number">
                01
              </span>

              <div>
                <h3>Items to pack</h3>

                <p>
                  Add each item once, then set
                  how many of that item you need
                  to pack.
                </p>
              </div>
            </div>

            <div className="pm-carton-list">
              {items.map(
                (item, index) => (
                  <section
                    key={item.id}
                    aria-label={`Item ${
                      index + 1
                    }`}
                    className="pm-carton-row"
                  >
                    <div className="pm-carton-row-header">
                      <div>
                        <span className="pm-carton-index">
                          {String(
                            index + 1
                          ).padStart(
                            2,
                            '0'
                          )}
                        </span>

                        <strong>
                          {item.name?.trim() ||
                            `Item ${
                              index + 1
                            }`}
                        </strong>
                      </div>

                      {items.length > 1 && (
                        <button
                          type="button"
                          onClick={() =>
                            removeItem(
                              item.id
                            )
                          }
                          className="pm-remove-button"
                        >
                          Remove
                        </button>
                      )}
                    </div>

                    <div className="pm-carton-fields">
                      <label className="pm-field">
                        <span className="pm-field-label">
                          Item name (optional)
                        </span>

                        <input
                          className="pm-number-input"
                          type="text"
                          value={
                            item.name ?? ''
                          }
                          placeholder="e.g. Books"
                          onChange={event =>
                            updateItemName(
                              item.id,
                              event.target
                                .value
                            )
                          }
                        />
                      </label>

                      <NumberField
                        label="Length (mm)"
                        value={
                          item.lengthMm
                        }
                        min={0.001}
                        step={0.001}
                        onChange={value =>
                          updateItem(
                            item.id,
                            'lengthMm',
                            value
                          )
                        }
                      />

                      <NumberField
                        label="Width (mm)"
                        value={
                          item.widthMm
                        }
                        min={0.001}
                        step={0.001}
                        onChange={value =>
                          updateItem(
                            item.id,
                            'widthMm',
                            value
                          )
                        }
                      />

                      <NumberField
                        label="Height (mm)"
                        value={
                          item.heightMm
                        }
                        min={0.001}
                        step={0.001}
                        onChange={value =>
                          updateItem(
                            item.id,
                            'heightMm',
                            value
                          )
                        }
                      />

                      <NumberField
                        label="Quantity"
                        value={
                          item.quantity
                        }
                        min={1}
                        onChange={value =>
                          updateItem(
                            item.id,
                            'quantity',
                            value
                          )
                        }
                      />
                    </div>
                  </section>
                )
              )}
            </div>

            <button
              type="button"
              onClick={addItem}
              className="pm-add-button"
            >
              <span>+</span>
              Add another item
            </button>
          </section>

          {mode === 'need-boxes' && (
            <div className="pm-context-note">
              <strong>
                No box dimensions needed.
              </strong>

              <span>
                Packmetry generates box
                candidates and recommends the
                internal dimensions used by the
                verified plan.
              </span>
            </div>
          )}

          {showsInventoryEditor && (
            <section className="pm-form-section">
              <div className="pm-form-section-heading">
                <span className="pm-section-number">
                  02
                </span>

                <div>
                  <h3>
                    Boxes you have
                  </h3>

                  <p>
                    Add each box type Packmetry
                    may use and how many are
                    available.
                  </p>
                </div>
              </div>

              <div className="pm-carton-list">
                {cartons.map(
                  (carton, index) => (
                    <section
                      key={carton.id}
                      aria-label={`Box type ${
                        index + 1
                      }`}
                      className="pm-carton-row"
                    >
                      <div className="pm-carton-row-header">
                        <div>
                          <span className="pm-carton-index">
                            {String(
                              index + 1
                            ).padStart(
                              2,
                              '0'
                            )}
                          </span>

                          <strong>
                            Box type{' '}
                            {index + 1}
                          </strong>
                        </div>

                        {cartons.length >
                          1 && (
                          <button
                            type="button"
                            onClick={() =>
                              removeCarton(
                                carton.id
                              )
                            }
                            className="pm-remove-button"
                          >
                            Remove
                          </button>
                        )}
                      </div>

                      <div className="pm-carton-fields">
                        <NumberField
                          label="Length (mm)"
                          value={
                            carton.lengthMm
                          }
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
                          value={
                            carton.widthMm
                          }
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
                          value={
                            carton.heightMm
                          }
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
                          value={
                            carton.quantityAvailable
                          }
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
                  )
                )}
              </div>

              <button
                type="button"
                onClick={addCarton}
                className="pm-add-button"
              >
                <span>+</span>
                Add another box type
              </button>

              {mode === 'have-boxes' ? (
                <div className="pm-context-note">
                  <strong>
                    Inventory limits are
                    enforced.
                  </strong>

                  <span>
                    Packmetry will not invent
                    or purchase extra boxes in
                    this mode. A zero available
                    quantity means that box
                    type cannot be opened.
                  </span>
                </div>
              ) : (
                <div className="pm-context-note">
                  <strong>
                    Use existing boxes first.
                  </strong>

                  <span>
                    Packmetry verifies what
                    your inventory can pack,
                    then recommends purchase
                    boxes only for the exact
                    remainder.
                  </span>
                </div>
              )}
            </section>
          )}

          <div className="pm-submit-area">
            <button
              type="submit"
              disabled={running}
              className="pm-primary-button"
            >
              {running
                ? 'Calculating…'
                : 'Calculate packing'}
            </button>

            <span className="pm-submit-note">
              Result is independently verified
              by the Packmetry core.
            </span>
          </div>
        </form>

        <section
          className="pm-pane pm-result-pane"
          aria-live="polite"
        >
          {!plan &&
            !hybridResult &&
            !error && (
              <div className="pm-empty-result">
                <div className="pm-empty-result-top">
                  <div>
                    <p className="pm-pane-kicker">
                      Result
                    </p>

                    <h2>
                      Ready when you are.
                    </h2>
                  </div>

                  <span className="pm-status-label">
                    Waiting
                  </span>
                </div>

                <div
                  className="pm-empty-box"
                  aria-hidden="true"
                >
                  <span className="pm-empty-box-line pm-empty-box-line-a" />
                  <span className="pm-empty-box-line pm-empty-box-line-b" />
                  <span className="pm-empty-box-line pm-empty-box-line-c" />
                </div>

                <p>
                  Run a calculation to see the
                  verified result.
                </p>
              </div>
            )}

          {error && (
            <div className="pm-error-state">
              <p className="pm-pane-kicker">
                Result
              </p>

              <h2>
                Check the packing inputs.
              </h2>

              <div
                role="alert"
                className="pm-error-message"
              >
                {error}
              </div>
            </div>
          )}

          {plan && (
            <div className="pm-standard-result">
              {mode === 'need-boxes' &&
                purchaseRecommendations.length >
                  0 && (
                  <PurchaseRecommendationSummary
                    title="What to buy"
                    recommendations={
                      purchaseRecommendations
                    }
                    note="Recommended internal dimensions from the verified packing plan. Supplier availability and external dimensions are not claimed."
                  />
                )}

              {mode === 'have-boxes' &&
                inventoryUsage !==
                  null && (
                  <InventoryUsageSummary
                    usage={
                      inventoryUsage
                    }
                  />
                )}

              <div className="pm-plan-output">
                <ResultSummary
                  plan={plan}
                />

                <PackingVisualization
                  plan={plan}
                  itemLabels={itemLabels}
                />
              </div>
            </div>
          )}

          {mode === 'hybrid-boxes' &&
            hybridResult !== null && (
              <HybridResult
                result={hybridResult}
                itemLabels={itemLabels}
              />
            )}
        </section>
      </div>
    </main>
  );
}