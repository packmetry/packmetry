import { useEffect, useState, type ChangeEvent, type SyntheticEvent } from 'react';

import PackingVisualization from './PackingVisualization.js';
import PlanAlternatives from './PlanAlternatives.js';
import ResultSummary, {
  formatPackedWeight,
} from './ResultSummary.js';
import {
  createSavedBusinessCarton,
  deleteSavedBusinessCarton,
  listSavedBusinessCartons,
  orderSavedBusinessCartons,
  saveBusinessCarton,
  type SavedBusinessCarton,
  type SavedBusinessCartonInput,
} from '../browser/business-carton-library.js';
import {
  readBusinessHandlingPreference,
  writeBusinessHandlingPreference,
} from '../browser/business-handling-preference.js';
import {
  downloadBusinessProjectJson,
  readBusinessProjectJsonFile,
} from '../browser/business-project-json-actions.js';
import {
  parseBusinessProjectJson,
} from '../browser/business-project-json.js';
import {
  readBusinessObjectivePreference,
  writeBusinessObjectivePreference,
} from '../browser/business-objective-preference.js';
import {
  createRecentBusinessProject,
  listRecentBusinessProjects,
  orderRecentBusinessProjects,
  saveRecentBusinessProject,
  type RecentBusinessProject,
  type RecentBusinessProjectInput,
} from '../browser/business-recent-projects.js';
import { createCarton, type Carton } from '../core/domain/carton.js';
import { createItem, type Item } from '../core/domain/item.js';
import type { RotationPolicy } from '../core/domain/constraints.js';
import type { PackingPlan } from '../core/domain/packing-plan.js';
import type { ObjectiveKind } from '../core/domain/objectives.js';
import { BaselineSolver } from '../core/solver/index.js';
import {
  planHaveBoxes,
  type HaveBoxesInventoryUsage,
} from '../core/workflows/index.js';

export interface BusinessProductValues {
  id: string;
  name: string;
  sku: string;
  lengthMm: number;
  widthMm: number;
  heightMm: number;
  quantity: number;
  unitWeightG: number | undefined;
  rotationPolicy?: BusinessHandlingPolicy;
}

export interface BusinessCartonValues {
  id: string;
  libraryId?: string;
  name: string;
  cartonCode: string;
  lengthMm: number;
  widthMm: number;
  heightMm: number;
  quantityAvailable: number;
  maxGrossWeightG: number | undefined;
  emptyBoxWeightG: number | undefined;
  costPerBox: number | undefined;
}

export type BusinessHandlingPolicy = Extract<
  RotationPolicy,
  | 'any'
  | 'upright'
  | 'fixed'
>;

export interface BusinessHandlingOption {
  policy: BusinessHandlingPolicy;
  label: string;
  description: string;
}

export const BUSINESS_HANDLING_OPTIONS:
  readonly BusinessHandlingOption[] = [
    {
      policy: 'any',
      label: 'Any rotation',
      description:
        'Allow all solver-supported orientations for this product.',
    },
    {
      policy: 'upright',
      label: 'Keep upright',
      description:
        'Keep the product height axis vertical while allowing horizontal turning.',
    },
    {
      policy: 'fixed',
      label: 'Fixed orientation',
      description:
        'Keep the product in the exact length × width × height orientation entered.',
    },
  ];

export type BusinessObjectiveKind = Extract<
  ObjectiveKind,
  | 'balanced'
  | 'fewest-cartons'
  | 'least-wasted-volume'
>;

export interface BusinessObjectiveOption {
  kind: BusinessObjectiveKind;
  label: string;
  description: string;
}

export interface BusinessWorkspaceResult {
  plan: PackingPlan;
  alternatives: PackingPlan[];
  inventoryUsage: HaveBoxesInventoryUsage;
}

export interface BusinessResultMetrics {
  grossPackedWeightG?: number;
  totalCartonCost?: number;
  usedCartonCount: number;
  remainingCartonCount?: number;
}

export interface SavedBusinessCartonLibraryProps {
  cartons: readonly SavedBusinessCarton[];
  message: string | null;
  onUse: (
    carton: SavedBusinessCarton
  ) => void;
  onDelete: (
    carton: SavedBusinessCarton
  ) => void;
}

export interface BusinessRecentProjectsProps {
  projects:
    readonly RecentBusinessProject[];
  message: string | null;
  onOpen: (
    project: RecentBusinessProject
  ) => void;
}

export interface BusinessWorkspaceProps {
  initialProducts?: readonly BusinessProductValues[];
  initialCartons?: readonly BusinessCartonValues[];
  initialObjective?: BusinessObjectiveKind;
}

export const BUSINESS_OBJECTIVE_OPTIONS:
  readonly BusinessObjectiveOption[] = [
    {
      kind: 'balanced',
      label: 'Balanced',
      description:
        'Prefer fewer cartons first, then reduce empty space.',
    },
    {
      kind: 'fewest-cartons',
      label: 'Fewest boxes',
      description:
        'Prioritize using the fewest cartons for the order.',
    },
    {
      kind: 'least-wasted-volume',
      label: 'Least empty space',
      description:
        'Prioritize lower empty volume across the selected cartons.',
    },
  ];

export const DEFAULT_BUSINESS_PRODUCTS: BusinessProductValues[] = [
  {
    id: 'business-product-1',
    name: '',
    sku: '',
    lengthMm: 80,
    widthMm: 80,
    heightMm: 80,
    quantity: 1,
    unitWeightG: undefined,
    rotationPolicy: 'any',
  },
];

export const DEFAULT_BUSINESS_CARTONS: BusinessCartonValues[] = [
  {
    id: 'business-carton-1',
    name: '',
    cartonCode: '',
    lengthMm: 100,
    widthMm: 100,
    heightMm: 100,
    quantityAvailable: 1,
    maxGrossWeightG: undefined,
    emptyBoxWeightG: undefined,
    costPerBox: undefined,
  },
];

function cloneBusinessProduct(
  product: BusinessProductValues
): BusinessProductValues {
  return {
    ...product,
  };
}

function cloneBusinessCarton(
  carton: BusinessCartonValues
): BusinessCartonValues {
  return {
    ...carton,
  };
}

function nextProductId(
  products: readonly BusinessProductValues[]
): string {
  let index = 1;

  while (
    products.some(
      product =>
        product.id ===
        `business-product-${index}`
    )
  ) {
    index++;
  }

  return `business-product-${index}`;
}

function nextCartonId(
  cartons: readonly BusinessCartonValues[]
): string {
  let index = 1;

  while (
    cartons.some(
      carton =>
        carton.id ===
        `business-carton-${index}`
    )
  ) {
    index++;
  }

  return `business-carton-${index}`;
}

export function businessCartonFromSavedCarton(
  savedCarton: SavedBusinessCarton,
  currentCartons: readonly BusinessCartonValues[]
): BusinessCartonValues {
  const id =
    currentCartons.some(
      carton =>
        carton.id ===
        savedCarton.id
    )
      ? nextCartonId(
          currentCartons
        )
      : savedCarton.id;

  return {
    id,
    libraryId:
      savedCarton.id,
    name: savedCarton.name,
    cartonCode:
      savedCarton.cartonCode,
    lengthMm:
      savedCarton.lengthMm,
    widthMm:
      savedCarton.widthMm,
    heightMm:
      savedCarton.heightMm,
    quantityAvailable:
      savedCarton.quantityAvailable,
    maxGrossWeightG:
      savedCarton.maxGrossWeightG,
    emptyBoxWeightG:
      savedCarton.emptyBoxWeightG,
    costPerBox:
      savedCarton.costPerBox,
  };
}

export function savedBusinessCartonInputFromBusinessCarton(
  carton: BusinessCartonValues
): SavedBusinessCartonInput {
  return {
    id:
      carton.libraryId ??
      carton.id,
    name: carton.name,
    cartonCode:
      carton.cartonCode,
    lengthMm:
      carton.lengthMm,
    widthMm:
      carton.widthMm,
    heightMm:
      carton.heightMm,
    quantityAvailable:
      carton.quantityAvailable,
    maxGrossWeightG:
      carton.maxGrossWeightG,
    emptyBoxWeightG:
      carton.emptyBoxWeightG,
    costPerBox:
      carton.costPerBox,
  };
}

export function businessProjectInputFromWorkspace(
  id: string,
  name: string,
  products:
    readonly BusinessProductValues[],
  cartons:
    readonly BusinessCartonValues[],
  objective:
    BusinessObjectiveKind
): RecentBusinessProjectInput {
  return {
    id,
    name,
    products:
      products.map(
        cloneBusinessProduct
      ),
    cartons:
      cartons.map(
        cloneBusinessCarton
      ),
    objective,
  };
}

function nextBusinessProjectId(
  projects:
    readonly RecentBusinessProject[]
): string {
  let index = 1;

  while (
    projects.some(
      project =>
        project.id ===
        `business-project-${index}`
    )
  ) {
    index++;
  }

  return `business-project-${index}`;
}

function optionalNumber(
  value: string
): number | undefined {
  if (value.trim() === '') {
    return undefined;
  }

  return Number(value);
}

export function buildBusinessItems(
  products: readonly BusinessProductValues[]
): Item[] {
  return products.map(
    (product, index) => {
      const name =
        product.name.trim();
      const sku =
        product.sku.trim();

      return createItem({
        id: product.id,
        ...(name !== ''
          ? { name }
          : {
              name: `Product ${index + 1}`,
            }),
        ...(sku !== ''
          ? { sku }
          : {}),
        dimensions: {
          length: product.lengthMm,
          width: product.widthMm,
          height: product.heightMm,
        },
        quantity: product.quantity,
        ...(product.unitWeightG !==
        undefined
          ? {
              unitWeightG:
                product.unitWeightG,
            }
          : {}),
        constraints: {
          rotationPolicy:
            product.rotationPolicy ??
            'any',
        },
      });
    }
  );
}

export function buildBusinessCartons(
  cartons: readonly BusinessCartonValues[]
): Carton[] {
  return cartons.map(
    (carton, index) => {
      const name =
        carton.name.trim();
      const cartonCode =
        carton.cartonCode.trim();

      return createCarton({
        id: carton.id,
        ...(name !== ''
          ? { name }
          : {
              name: `Carton ${index + 1}`,
            }),
        internalDimensions: {
          length: carton.lengthMm,
          width: carton.widthMm,
          height: carton.heightMm,
        },
        quantityAvailable:
          carton.quantityAvailable,
        ...(cartonCode !== ''
          ? { cartonCode }
          : {}),
        ...(carton.maxGrossWeightG !==
        undefined
          ? {
              maxGrossWeightG:
                carton.maxGrossWeightG,
            }
          : {}),
        ...(carton.emptyBoxWeightG !==
        undefined
          ? {
              emptyBoxWeightG:
                carton.emptyBoxWeightG,
            }
          : {}),
        ...(carton.costPerBox !==
        undefined
          ? {
              costPerBox:
                carton.costPerBox,
            }
          : {}),
      });
    }
  );
}

export function createBusinessItemLabels(
  products: readonly BusinessProductValues[]
): Readonly<Record<string, string>> {
  return Object.fromEntries(
    products.map(
      (product, index) => {
        const name =
          product.name.trim();
        const sku =
          product.sku.trim();

        const label =
          name !== ''
            ? name
            : sku !== ''
              ? sku
              : `Product ${index + 1}`;

        return [
          product.id,
          label,
        ];
      }
    )
  );
}

export async function runBusinessWorkspace(
  products: readonly BusinessProductValues[],
  cartons: readonly BusinessCartonValues[],
  objective: BusinessObjectiveKind = 'balanced'
): Promise<BusinessWorkspaceResult> {
  const result =
    await planHaveBoxes(
      'business-workspace-plan',
      new BaselineSolver(),
      {
        items:
          buildBusinessItems(
            products
          ),
        cartons:
          buildBusinessCartons(
            cartons
          ),
        objective: {
          kind: objective,
        },
      }
    );

  if (
    result.planningResult.kind !==
    'planned'
  ) {
    throw new Error(
      'No independently verified business packing plan was produced'
    );
  }

  if (
    result.inventoryUsage === null
  ) {
    throw new Error(
      'Business carton inventory usage was not produced'
    );
  }

  return {
    plan:
      result.planningResult.plan,
    alternatives:
      result.planningResult.alternatives,
    inventoryUsage:
      result.inventoryUsage,
  };
}

export function buildBusinessResultMetrics(
  plan: PackingPlan,
  inventoryUsage: HaveBoxesInventoryUsage
): BusinessResultMetrics {
  const inventoryEntries = [
    ...inventoryUsage.usedCartons,
    ...inventoryUsage.unusedCartons,
  ];

  const usedCartonCount =
    inventoryUsage.usedCartons.reduce(
      (sum, entry) =>
        sum + entry.usedQuantity,
      0
    );

  const remainingKnown =
    inventoryEntries.every(
      entry =>
        entry.remainingQuantity !==
        undefined
    );

  return {
    ...(plan.metrics
      .totalGrossWeightG !==
    undefined
      ? {
          grossPackedWeightG:
            plan.metrics
              .totalGrossWeightG,
        }
      : {}),
    ...(plan.metrics
      .totalCartonCost !==
    undefined
      ? {
          totalCartonCost:
            plan.metrics
              .totalCartonCost,
        }
      : {}),
    usedCartonCount,
    ...(remainingKnown
      ? {
          remainingCartonCount:
            inventoryEntries.reduce(
              (sum, entry) =>
                sum +
                (entry.remainingQuantity ??
                  0),
              0
            ),
        }
      : {}),
  };
}

function formatMetricNumber(
  value: number
): string {
  return value
    .toFixed(2)
    .replace(/\.00$/, '')
    .replace(/(\.\d)0$/, '$1');
}

export function formatBusinessCartonCost(
  value: number | undefined
): string {
  if (value === undefined) {
    return 'Not provided';
  }

  return `${formatMetricNumber(
    value
  )} entered cost units`;
}

export function formatBusinessStockImpact(
  metrics: BusinessResultMetrics
): string {
  if (
    metrics.remainingCartonCount ===
    undefined
  ) {
    return `${metrics.usedCartonCount} used · remaining stock not fully known`;
  }

  return `${metrics.usedCartonCount} used · ${metrics.remainingCartonCount} remaining`;
}

function cartonDisplayName(
  carton: Carton
): string {
  if (
    carton.name !== undefined &&
    carton.name.trim() !== ''
  ) {
    return carton.name;
  }

  if (
    carton.cartonCode !==
      undefined &&
    carton.cartonCode.trim() !==
      ''
  ) {
    return carton.cartonCode;
  }

  return carton.id;
}

export function SavedBusinessCartonLibrary({
  cartons,
  message,
  onUse,
  onDelete,
}: SavedBusinessCartonLibraryProps) {
  return (
    <>
      <div className="pm-context-note">
        <strong>
          Saved carton library
        </strong>

        <span>
          Your saved cartons stay in
          this browser.
        </span>

        {message !== null && (
          <span>
            {message}
          </span>
        )}
      </div>

      {cartons.length === 0 ? (
        <p className="pm-submit-note">
          No saved cartons yet.
        </p>
      ) : (
        <div className="pm-carton-list">
          {cartons.map(
            carton => {
              const displayName =
                carton.name.trim() !== ''
                  ? carton.name
                  : carton.cartonCode.trim() !==
                      ''
                    ? carton.cartonCode
                    : carton.id;

              return (
                <div
                  key={carton.id}
                  className="pm-carton-row"
                >
                  <div className="pm-carton-row-header">
                    <div>
                      <strong>
                        {displayName}
                      </strong>
                    </div>

                    <button
                      type="button"
                      className="pm-remove-button"
                      onClick={() =>
                        onDelete(
                          carton
                        )
                      }
                    >
                      Delete saved
                    </button>
                  </div>

                  <span className="pm-submit-note">
                    {carton.lengthMm} ×{' '}
                    {carton.widthMm} ×{' '}
                    {carton.heightMm} mm
                    {' · '}Qty{' '}
                    {
                      carton.quantityAvailable
                    }
                    {carton.cartonCode
                      .trim() !== ''
                      ? ` · ${carton.cartonCode}`
                      : ''}
                  </span>

                  <button
                    type="button"
                    className="pm-add-button"
                    onClick={() =>
                      onUse(
                        carton
                      )
                    }
                  >
                    Use carton
                  </button>
                </div>
              );
            }
          )}
        </div>
      )}
    </>
  );
}

export function BusinessRecentProjects({
  projects,
  message,
  onOpen,
}: BusinessRecentProjectsProps) {
  return (
    <>
      <div className="pm-context-note">
        <strong>
          Recent projects
        </strong>

        <span>
          Your recent projects stay in
          this browser.
        </span>

        {message !== null && (
          <span>
            {message}
          </span>
        )}
      </div>

      {projects.length === 0 ? (
        <p className="pm-submit-note">
          No recent projects yet.
        </p>
      ) : (
        <div className="pm-carton-list">
          {projects.map(
            project => (
              <div
                key={project.id}
                className="pm-carton-row"
              >
                <div className="pm-carton-row-header">
                  <div>
                    <strong>
                      {project.name}
                    </strong>
                  </div>
                </div>

                <span className="pm-submit-note">
                  {
                    project.products.length
                  }{' '}
                  product
                  {project.products.length ===
                  1
                    ? ''
                    : 's'}
                  {' · '}
                  {
                    project.cartons.length
                  }{' '}
                  carton
                  {project.cartons.length ===
                  1
                    ? ''
                    : 's'}
                </span>

                <button
                  type="button"
                  className="pm-add-button"
                  onClick={() =>
                    onOpen(
                      project
                    )
                  }
                >
                  Open project
                </button>
              </div>
            )
          )}
        </div>
      )}
    </>
  );
}

export default function BusinessWorkspace({
  initialProducts,
  initialCartons,
  initialObjective,
}: BusinessWorkspaceProps) {
  const [
    products,
    setProducts,
  ] =
    useState<
      BusinessProductValues[]
    >(() =>
      (
        initialProducts ??
        DEFAULT_BUSINESS_PRODUCTS
      ).map(
        cloneBusinessProduct
      )
    );

  const [
    handlingPreference,
    setHandlingPreference,
  ] =
    useState<BusinessHandlingPolicy>(
      'any'
    );

  useEffect(() => {
    const savedHandling =
      readBusinessHandlingPreference();

    if (
      savedHandling ===
      undefined
    ) {
      return;
    }

    setHandlingPreference(
      savedHandling
    );

    if (
      initialProducts !==
      undefined
    ) {
      return;
    }

    setProducts(current =>
      current.map(
        (product, index) =>
          index === 0
            ? {
                ...product,
                rotationPolicy:
                  savedHandling,
              }
            : product
      )
    );
  }, [initialProducts]);

  const [
    cartons,
    setCartons,
  ] =
    useState<
      BusinessCartonValues[]
    >(() =>
      (
        initialCartons ??
        DEFAULT_BUSINESS_CARTONS
      ).map(
        cloneBusinessCarton
      )
    );

  const [
    savedCartons,
    setSavedCartons,
  ] =
    useState<
      SavedBusinessCarton[]
    >([]);

  const [
    cartonLibraryMessage,
    setCartonLibraryMessage,
  ] =
    useState<string | null>(
      null
    );

  useEffect(() => {
    let active = true;

    void listSavedBusinessCartons()
      .then(
        loadedCartons => {
          if (active) {
            setSavedCartons(
              loadedCartons
            );
          }
        }
      );

    return () => {
      active = false;
    };
  }, []);

  const [
    recentProjects,
    setRecentProjects,
  ] =
    useState<
      RecentBusinessProject[]
    >([]);

  const [
    recentProjectsLoaded,
    setRecentProjectsLoaded,
  ] =
    useState(false);

  const [
    projectId,
    setProjectId,
  ] =
    useState<string | null>(
      null
    );

  const [
    projectName,
    setProjectName,
  ] =
    useState('');

  const [
    projectMessage,
    setProjectMessage,
  ] =
    useState<string | null>(
      null
    );

  useEffect(() => {
    let active = true;

    void listRecentBusinessProjects()
      .then(
        loadedProjects => {
          if (active) {
            setRecentProjects(
              loadedProjects
            );
            setRecentProjectsLoaded(
              true
            );
          }
        }
      );

    return () => {
      active = false;
    };
  }, []);

  const [plan, setPlan] =
    useState<PackingPlan | null>(
      null
    );

  const [
    recommendedPlan,
    setRecommendedPlan,
  ] =
    useState<PackingPlan | null>(
      null
    );

  const [
    alternatives,
    setAlternatives,
  ] =
    useState<PackingPlan[]>(
      []
    );

  const [
    inventoryUsage,
    setInventoryUsage,
  ] =
    useState<
      HaveBoxesInventoryUsage | null
    >(null);

  const [error, setError] =
    useState<string | null>(null);

  const [running, setRunning] =
    useState(false);

  const [
    objective,
    setObjective,
  ] =
    useState<BusinessObjectiveKind>(
      initialObjective ??
        'balanced'
    );

  useEffect(() => {
    if (
      initialObjective !==
      undefined
    ) {
      return;
    }

    const savedObjective =
      readBusinessObjectivePreference();

    if (
      savedObjective !==
      undefined
    ) {
      setObjective(
        savedObjective
      );
    }
  }, [initialObjective]);

  const objectiveCopy =
    BUSINESS_OBJECTIVE_OPTIONS.find(
      option =>
        option.kind === objective
    )!;

  const updateProduct = (
    id: string,
    updates:
      Partial<BusinessProductValues>
  ) => {
    setProducts(current =>
      current.map(product =>
        product.id === id
          ? {
              ...product,
              ...updates,
            }
          : product
      )
    );
  };

  const chooseHandling = (
    id: string,
    nextHandling:
      BusinessHandlingPolicy
  ) => {
    updateProduct(
      id,
      {
        rotationPolicy:
          nextHandling,
      }
    );
    setHandlingPreference(
      nextHandling
    );
    writeBusinessHandlingPreference(
      nextHandling
    );
  };

  const updateCarton = (
    id: string,
    updates:
      Partial<BusinessCartonValues>
  ) => {
    setCartons(current =>
      current.map(carton =>
        carton.id === id
          ? {
              ...carton,
              ...updates,
            }
          : carton
      )
    );
  };

  const addProduct = () => {
    setProducts(current => [
      ...current,
      {
        id: nextProductId(
          current
        ),
        name: '',
        sku: '',
        lengthMm: 80,
        widthMm: 80,
        heightMm: 80,
        quantity: 1,
        unitWeightG:
          undefined,
        rotationPolicy:
          handlingPreference,
      },
    ]);
  };

  const removeProduct = (
    id: string
  ) => {
    setProducts(current => {
      if (
        current.length <= 1
      ) {
        return current;
      }

      return current.filter(
        product =>
          product.id !== id
      );
    });
  };

  const addCarton = () => {
    setCartons(current => [
      ...current,
      {
        id: nextCartonId(
          current
        ),
        name: '',
        cartonCode: '',
        lengthMm: 100,
        widthMm: 100,
        heightMm: 100,
        quantityAvailable: 1,
        maxGrossWeightG:
          undefined,
        emptyBoxWeightG:
          undefined,
        costPerBox:
          undefined,
      },
    ]);
  };

  const removeCarton = (
    id: string
  ) => {
    setCartons(current => {
      if (
        current.length <= 1
      ) {
        return current;
      }

      return current.filter(
        carton =>
          carton.id !== id
      );
    });
  };

  const saveCartonToLibrary =
    async (
      carton:
        BusinessCartonValues
    ) => {
      setCartonLibraryMessage(
        null
      );

      const libraryCarton =
        savedBusinessCartonInputFromBusinessCarton(
          carton
        );

      const saved =
        await saveBusinessCarton(
          libraryCarton
        );

      if (!saved) {
        setCartonLibraryMessage(
          'Could not save this carton in this browser.'
        );
        return;
      }

      const savedCarton =
        createSavedBusinessCarton(
          libraryCarton
        );

      setSavedCartons(
        current =>
          orderSavedBusinessCartons(
            [
              savedCarton,
              ...current,
            ]
          )
      );

      setCartonLibraryMessage(
        'Carton saved in this browser.'
      );
    };

  const useSavedCarton = (
    savedCarton:
      SavedBusinessCarton
  ) => {
    setCartons(current => [
      ...current,
      businessCartonFromSavedCarton(
        savedCarton,
        current
      ),
    ]);

    setCartonLibraryMessage(
      'Saved carton added to this order.'
    );
  };

  const deleteCartonFromLibrary =
    async (
      savedCarton:
        SavedBusinessCarton
    ) => {
      setCartonLibraryMessage(
        null
      );

      const deleted =
        await deleteSavedBusinessCarton(
          savedCarton.id
        );

      if (!deleted) {
        setCartonLibraryMessage(
          'Could not delete this saved carton in this browser.'
        );
        return;
      }

      setSavedCartons(
        current =>
          current.filter(
            carton =>
              carton.id !==
              savedCarton.id
          )
      );

      setCartonLibraryMessage(
        'Saved carton deleted from this browser.'
      );
    };

  const saveCurrentProject =
    async () => {
      const trimmedName =
        projectName.trim();

      if (trimmedName === '') {
        setProjectMessage(
          'Enter a project name before saving.'
        );
        return;
      }

      if (
        projectId === null &&
        !recentProjectsLoaded
      ) {
        setProjectMessage(
          'Recent projects are still loading. Try again in a moment.'
        );
        return;
      }

      const nextProjectId =
        projectId ??
        nextBusinessProjectId(
          recentProjects
        );

      const projectInput =
        businessProjectInputFromWorkspace(
          nextProjectId,
          trimmedName,
          products,
          cartons,
          objective
        );

      const saved =
        await saveRecentBusinessProject(
          projectInput
        );

      if (!saved) {
        setProjectMessage(
          'Could not save this project in this browser.'
        );
        return;
      }

      setProjectId(
        nextProjectId
      );
      setProjectName(
        trimmedName
      );

      const recentProject =
        createRecentBusinessProject(
          projectInput
        );

      setRecentProjects(
        current =>
          orderRecentBusinessProjects(
            [
              recentProject,
              ...current,
            ]
          )
      );

      setProjectMessage(
        'Project saved in this browser.'
      );
    };

  const openRecentProject = (
    project:
      RecentBusinessProject
  ) => {
    setProjectId(
      project.id
    );
    setProjectName(
      project.name
    );
    setProducts(
      project.products.map(
        cloneBusinessProduct
      )
    );
    setCartons(
      project.cartons.map(
        cloneBusinessCarton
      )
    );
    setObjective(
      project.objective
    );
    setPlan(null);
    setRecommendedPlan(null);
    setAlternatives([]);
    setInventoryUsage(null);
    setError(null);
    setProjectMessage(
      'Project opened.'
    );
  };

  const exportCurrentProject = () => {
    const trimmedName =
      projectName.trim();

    if (trimmedName === '') {
      setProjectMessage(
        'Enter a project name before exporting.'
      );
      return;
    }

    if (
      projectId === null &&
      !recentProjectsLoaded
    ) {
      setProjectMessage(
        'Recent projects are still loading. Try again in a moment.'
      );
      return;
    }

    const nextProjectId =
      projectId ??
      nextBusinessProjectId(
        recentProjects
      );

    const projectInput =
      businessProjectInputFromWorkspace(
        nextProjectId,
        trimmedName,
        products,
        cartons,
        objective
      );

    const exportProject =
      createRecentBusinessProject(
        projectInput
      );

    const downloaded =
      downloadBusinessProjectJson(
        exportProject
      );

    if (!downloaded) {
      setProjectMessage(
        'Could not export this project from this browser.'
      );
      return;
    }

    setProjectId(
      nextProjectId
    );
    setProjectName(
      trimmedName
    );
    setProjectMessage(
      'Project JSON downloaded.'
    );
  };

  const importProjectJson =
    async (
      event:
        ChangeEvent<HTMLInputElement>
    ) => {
      const input =
        event.currentTarget;

      const file =
        input.files?.[0];

      if (file === undefined) {
        return;
      }

      input.value = '';

      setProjectMessage(
        null
      );

      const readResult =
        await readBusinessProjectJsonFile(
          file
        );

      if (!readResult.ok) {
        setProjectMessage(
          'Could not read this project file.'
        );
        return;
      }

      const parsed =
        parseBusinessProjectJson(
          readResult.text
        );

      if (!parsed.ok) {
        setProjectMessage(
          `Could not import project: ${parsed.error.message}`
        );
        return;
      }

      const importedProject =
        parsed.project;

      setProjectId(
        importedProject.id
      );
      setProjectName(
        importedProject.name
      );
      setProducts(
        importedProject.products.map(
          cloneBusinessProduct
        )
      );
      setCartons(
        importedProject.cartons.map(
          cloneBusinessCarton
        )
      );
      setObjective(
        importedProject.objective
      );
      setPlan(null);
      setRecommendedPlan(null);
      setAlternatives([]);
      setInventoryUsage(null);
      setError(null);
      setProjectMessage(
        'Project imported. Save project to keep it in this browser.'
      );
    };

  const chooseObjective = (
    nextObjective:
      BusinessObjectiveKind
  ) => {
    setObjective(
      nextObjective
    );
    writeBusinessObjectivePreference(
      nextObjective
    );
    setPlan(null);
    setRecommendedPlan(null);
    setAlternatives([]);
    setInventoryUsage(null);
    setError(null);
  };

  const submit = async (
    event:
      SyntheticEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    setRunning(true);
    setPlan(null);
    setRecommendedPlan(null);
    setAlternatives([]);
    setInventoryUsage(null);
    setError(null);

    try {
      const result =
        await runBusinessWorkspace(
          products,
          cartons,
          objective
        );

      setRecommendedPlan(
        result.plan
      );
      setAlternatives(
        result.alternatives
      );
      setPlan(result.plan);
      setInventoryUsage(
        result.inventoryUsage
      );
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : 'Business packing calculation failed'
      );
    } finally {
      setRunning(false);
    }
  };

  const itemLabels =
    createBusinessItemLabels(
      products
    );

  const businessResultMetrics =
    recommendedPlan !== null &&
    inventoryUsage !== null
      ? buildBusinessResultMetrics(
          recommendedPlan,
          inventoryUsage
        )
      : null;

  return (
    <main className="pm-workspace">
      <header className="pm-app-header">
        <p className="pm-app-kicker">
          Packmetry business
        </p>

        <h1>
          Optimize packing against
          your carton inventory
        </h1>

        <p className="pm-app-intro">
          Enter products and the
          cartons you stock. This
          business workspace uses the
          same independently verified
          Packmetry packing engine as
          the Personal experience.
        </p>
      </header>

      <div className="pm-workbench">
        <form
          className="pm-pane pm-setup-pane"
          onSubmit={submit}
        >
          <div className="pm-pane-header">
            <div>
              <p className="pm-pane-kicker">
                Business setup
              </p>

              <h2>
                Order and carton
                inventory
              </h2>
            </div>

            <span className="pm-status-label">
              {objectiveCopy.label}
            </span>
          </div>

          <div className="pm-context-note">
            <strong>
              Business optimization
            </strong>

            <span>
              Enter this order and the
              cartons available to it,
              then choose how Packmetry
              should rank verified
              packing candidates.
            </span>
          </div>

          <section className="pm-form-section">
            <div className="pm-form-section-heading">
              <span className="pm-section-number">
                01
              </span>

              <div>
                <h3>
                  Products in this
                  order
                </h3>

                <p>
                  Add product identity,
                  dimensions, quantity,
                  optional unit weight
                  and supported handling
                  behavior.
                </p>
              </div>
            </div>

            <div className="pm-carton-list">
              {products.map(
                (
                  product,
                  index
                ) => (
                  <div
                    key={
                      product.id
                    }
                    className="pm-carton-row"
                  >
                    <div className="pm-carton-row-header">
                      <div>
                        <strong>
                          Product{' '}
                          {index + 1}
                        </strong>
                      </div>

                      {products.length >
                        1 && (
                        <button
                          type="button"
                          className="pm-remove-button"
                          onClick={() =>
                            removeProduct(
                              product.id
                            )
                          }
                        >
                          Remove
                        </button>
                      )}
                    </div>

                    <div className="pm-carton-fields">
                      <label className="pm-field">
                        <span className="pm-field-label">
                          Product name
                        </span>

                        <input
                          className="pm-number-input"
                          type="text"
                          value={
                            product.name
                          }
                          placeholder="e.g. Ceramic mug"
                          onChange={
                            event =>
                              updateProduct(
                                product.id,
                                {
                                  name:
                                    event
                                      .currentTarget
                                      .value,
                                }
                              )
                          }
                        />
                      </label>

                      <label className="pm-field">
                        <span className="pm-field-label">
                          SKU (optional)
                        </span>

                        <input
                          className="pm-number-input"
                          type="text"
                          value={
                            product.sku
                          }
                          placeholder="e.g. MUG-001"
                          onChange={
                            event =>
                              updateProduct(
                                product.id,
                                {
                                  sku:
                                    event
                                      .currentTarget
                                      .value,
                                }
                              )
                          }
                        />
                      </label>
                    </div>

                    <div className="pm-measurement-grid">
                      <label className="pm-field">
                        <span className="pm-field-label">
                          Length (mm)
                        </span>

                        <input
                          className="pm-number-input"
                          type="number"
                          min="0.001"
                          step="any"
                          required
                          value={
                            product.lengthMm
                          }
                          onChange={
                            event =>
                              updateProduct(
                                product.id,
                                {
                                  lengthMm:
                                    Number(
                                      event
                                        .currentTarget
                                        .value
                                    ),
                                }
                              )
                          }
                        />
                      </label>

                      <label className="pm-field">
                        <span className="pm-field-label">
                          Width (mm)
                        </span>

                        <input
                          className="pm-number-input"
                          type="number"
                          min="0.001"
                          step="any"
                          required
                          value={
                            product.widthMm
                          }
                          onChange={
                            event =>
                              updateProduct(
                                product.id,
                                {
                                  widthMm:
                                    Number(
                                      event
                                        .currentTarget
                                        .value
                                    ),
                                }
                              )
                          }
                        />
                      </label>

                      <label className="pm-field">
                        <span className="pm-field-label">
                          Height (mm)
                        </span>

                        <input
                          className="pm-number-input"
                          type="number"
                          min="0.001"
                          step="any"
                          required
                          value={
                            product.heightMm
                          }
                          onChange={
                            event =>
                              updateProduct(
                                product.id,
                                {
                                  heightMm:
                                    Number(
                                      event
                                        .currentTarget
                                        .value
                                    ),
                                }
                              )
                          }
                        />
                      </label>
                    </div>

                    <div className="pm-carton-fields">
                      <label className="pm-field">
                        <span className="pm-field-label">
                          Quantity
                        </span>

                        <input
                          className="pm-number-input"
                          type="number"
                          min="1"
                          step="1"
                          required
                          value={
                            product.quantity
                          }
                          onChange={
                            event =>
                              updateProduct(
                                product.id,
                                {
                                  quantity:
                                    Number(
                                      event
                                        .currentTarget
                                        .value
                                    ),
                                }
                              )
                          }
                        />
                      </label>

                      <label className="pm-field">
                        <span className="pm-field-label">
                          Unit weight (g,
                          optional)
                        </span>

                        <input
                          className="pm-number-input"
                          type="number"
                          min="0.001"
                          step="any"
                          value={
                            product.unitWeightG ??
                            ''
                          }
                          onChange={
                            event =>
                              updateProduct(
                                product.id,
                                {
                                  unitWeightG:
                                    optionalNumber(
                                      event
                                        .currentTarget
                                        .value
                                    ),
                                }
                              )
                          }
                        />
                      </label>
                    </div>

                    <div className="pm-field">
                      <span className="pm-field-label">
                        Handling
                      </span>

                      <div
                        className="pm-mode-selector"
                        aria-label={`Handling for Product ${index + 1}`}
                      >
                        {BUSINESS_HANDLING_OPTIONS.map(
                          option => (
                            <button
                              key={option.policy}
                              type="button"
                              className="pm-mode-option"
                              aria-pressed={
                                (product.rotationPolicy ??
                                  'any') ===
                                option.policy
                              }
                              onClick={() =>
                                chooseHandling(
                                  product.id,
                                  option.policy
                                )
                              }
                            >
                              {option.label}
                            </button>
                          )
                        )}
                      </div>

                      <div className="pm-mode-explainer">
                        <strong>
                          {
                            BUSINESS_HANDLING_OPTIONS.find(
                              option =>
                                option.policy ===
                                (product.rotationPolicy ??
                                  'any')
                            )!.label
                          }
                        </strong>

                        <span>
                          {
                            BUSINESS_HANDLING_OPTIONS.find(
                              option =>
                                option.policy ===
                                (product.rotationPolicy ??
                                  'any')
                            )!.description
                          }
                        </span>
                      </div>
                    </div>
                  </div>
                )
              )}
            </div>

            <button
              type="button"
              className="pm-add-button"
              onClick={addProduct}
            >
              + Add another product
            </button>
          </section>

          <section className="pm-form-section">
            <div className="pm-form-section-heading">
              <span className="pm-section-number">
                02
              </span>

              <div>
                <h3>
                  Carton inventory
                </h3>

                <p>
                  Add the internal
                  dimensions and stock
                  limits of the cartons
                  available to this
                  order.
                </p>
              </div>
            </div>

            <div className="pm-carton-list">
              {cartons.map(
                (
                  carton,
                  index
                ) => (
                  <div
                    key={
                      carton.id
                    }
                    className="pm-carton-row"
                  >
                    <div className="pm-carton-row-header">
                      <div>
                        <strong>
                          Carton{' '}
                          {index + 1}
                        </strong>
                      </div>

                      {cartons.length >
                        1 && (
                        <button
                          type="button"
                          className="pm-remove-button"
                          onClick={() =>
                            removeCarton(
                              carton.id
                            )
                          }
                        >
                          Remove
                        </button>
                      )}
                    </div>

                    <div className="pm-carton-fields">
                      <label className="pm-field">
                        <span className="pm-field-label">
                          Carton name
                        </span>

                        <input
                          className="pm-number-input"
                          type="text"
                          value={
                            carton.name
                          }
                          placeholder="e.g. Medium mailer"
                          onChange={
                            event =>
                              updateCarton(
                                carton.id,
                                {
                                  name:
                                    event
                                      .currentTarget
                                      .value,
                                }
                              )
                          }
                        />
                      </label>

                      <label className="pm-field">
                        <span className="pm-field-label">
                          Carton code
                        </span>

                        <input
                          className="pm-number-input"
                          type="text"
                          value={
                            carton.cartonCode
                          }
                          placeholder="e.g. BX-M"
                          onChange={
                            event =>
                              updateCarton(
                                carton.id,
                                {
                                  cartonCode:
                                    event
                                      .currentTarget
                                      .value,
                                }
                              )
                          }
                        />
                      </label>
                    </div>

                    <div className="pm-measurement-grid">
                      <label className="pm-field">
                        <span className="pm-field-label">
                          Internal length
                          (mm)
                        </span>

                        <input
                          className="pm-number-input"
                          type="number"
                          min="0.001"
                          step="any"
                          required
                          value={
                            carton.lengthMm
                          }
                          onChange={
                            event =>
                              updateCarton(
                                carton.id,
                                {
                                  lengthMm:
                                    Number(
                                      event
                                        .currentTarget
                                        .value
                                    ),
                                }
                              )
                          }
                        />
                      </label>

                      <label className="pm-field">
                        <span className="pm-field-label">
                          Internal width
                          (mm)
                        </span>

                        <input
                          className="pm-number-input"
                          type="number"
                          min="0.001"
                          step="any"
                          required
                          value={
                            carton.widthMm
                          }
                          onChange={
                            event =>
                              updateCarton(
                                carton.id,
                                {
                                  widthMm:
                                    Number(
                                      event
                                        .currentTarget
                                        .value
                                    ),
                                }
                              )
                          }
                        />
                      </label>

                      <label className="pm-field">
                        <span className="pm-field-label">
                          Internal height
                          (mm)
                        </span>

                        <input
                          className="pm-number-input"
                          type="number"
                          min="0.001"
                          step="any"
                          required
                          value={
                            carton.heightMm
                          }
                          onChange={
                            event =>
                              updateCarton(
                                carton.id,
                                {
                                  heightMm:
                                    Number(
                                      event
                                        .currentTarget
                                        .value
                                    ),
                                }
                              )
                          }
                        />
                      </label>
                    </div>

                    <div className="pm-carton-fields">
                      <label className="pm-field">
                        <span className="pm-field-label">
                          Available
                          quantity
                        </span>

                        <input
                          className="pm-number-input"
                          type="number"
                          min="0"
                          step="1"
                          required
                          value={
                            carton.quantityAvailable
                          }
                          onChange={
                            event =>
                              updateCarton(
                                carton.id,
                                {
                                  quantityAvailable:
                                    Number(
                                      event
                                        .currentTarget
                                        .value
                                    ),
                                }
                              )
                          }
                        />
                      </label>

                      <label className="pm-field">
                        <span className="pm-field-label">
                          Max gross weight
                          (g, optional)
                        </span>

                        <input
                          className="pm-number-input"
                          type="number"
                          min="0.001"
                          step="any"
                          value={
                            carton.maxGrossWeightG ??
                            ''
                          }
                          onChange={
                            event =>
                              updateCarton(
                                carton.id,
                                {
                                  maxGrossWeightG:
                                    optionalNumber(
                                      event
                                        .currentTarget
                                        .value
                                    ),
                                }
                              )
                          }
                        />
                      </label>

                      <label className="pm-field">
                        <span className="pm-field-label">
                          Empty box weight
                          (g, optional)
                        </span>

                        <input
                          className="pm-number-input"
                          type="number"
                          min="0.001"
                          step="any"
                          value={
                            carton.emptyBoxWeightG ??
                            ''
                          }
                          onChange={
                            event =>
                              updateCarton(
                                carton.id,
                                {
                                  emptyBoxWeightG:
                                    optionalNumber(
                                      event
                                        .currentTarget
                                        .value
                                    ),
                                }
                              )
                          }
                        />
                      </label>

                      <label className="pm-field">
                        <span className="pm-field-label">
                          Carton cost
                          (optional)
                        </span>

                        <input
                          className="pm-number-input"
                          type="number"
                          min="0"
                          step="any"
                          value={
                            carton.costPerBox ??
                            ''
                          }
                          onChange={
                            event =>
                              updateCarton(
                                carton.id,
                                {
                                  costPerBox:
                                    optionalNumber(
                                      event
                                        .currentTarget
                                        .value
                                    ),
                                }
                              )
                          }
                        />
                      </label>
                    </div>

                    <button
                      type="button"
                      className="pm-add-button"
                      onClick={() => {
                        void saveCartonToLibrary(
                          carton
                        );
                      }}
                    >
                      Save to library
                    </button>
                  </div>
                )
              )}
            </div>

            <button
              type="button"
              className="pm-add-button"
              onClick={addCarton}
            >
              + Add another carton
            </button>

            <SavedBusinessCartonLibrary
              cartons={
                savedCartons
              }
              message={
                cartonLibraryMessage
              }
              onUse={
                useSavedCarton
              }
              onDelete={
                savedCarton => {
                  void deleteCartonFromLibrary(
                    savedCarton
                  );
                }
              }
            />
          </section>

          <section className="pm-form-section">
            <div className="pm-form-section-heading">
              <span className="pm-section-number">
                03
              </span>

              <div>
                <h3>
                  Optimization objective
                </h3>

                <p>
                  Choose the business
                  goal used to rank
                  verified packing
                  candidates.
                </p>
              </div>
            </div>

            <div className="pm-mode-selector">
              {BUSINESS_OBJECTIVE_OPTIONS.map(
                option => (
                  <button
                    key={option.kind}
                    type="button"
                    className="pm-mode-option"
                    aria-pressed={
                      objective ===
                      option.kind
                    }
                    onClick={() =>
                      chooseObjective(
                        option.kind
                      )
                    }
                  >
                    {option.label}
                  </button>
                )
              )}
            </div>

            <div className="pm-mode-explainer">
              <strong>
                {objectiveCopy.label}
              </strong>

              <span>
                {objectiveCopy.description}
              </span>
            </div>
          </section>

          <section className="pm-form-section">
            <div className="pm-form-section-heading">
              <span className="pm-section-number">
                04
              </span>

              <div>
                <h3>
                  Project
                </h3>

                <p>
                  Save this Business setup
                  in this browser, export a
                  JSON backup, import a
                  backup, or reopen a recent
                  project.
                </p>
              </div>
            </div>

            <label className="pm-field">
              <span className="pm-field-label">
                Project name
              </span>

              <input
                className="pm-number-input"
                type="text"
                value={projectName}
                placeholder="e.g. October orders"
                onChange={event => {
                  setProjectName(
                    event.currentTarget
                      .value
                  );
                  setProjectMessage(
                    null
                  );
                }}
              />
            </label>

            <button
              type="button"
              className="pm-add-button"
              onClick={() => {
                void saveCurrentProject();
              }}
            >
              Save project
            </button>

            <div className="pm-carton-fields">
              <button
                type="button"
                className="pm-add-button"
                onClick={
                  exportCurrentProject
                }
              >
                Export project JSON
              </button>

              <label className="pm-field">
                <span className="pm-field-label">
                  Import project JSON
                </span>

                <input
                  className="pm-number-input"
                  type="file"
                  accept=".json,application/json"
                  onChange={event => {
                    void importProjectJson(
                      event
                    );
                  }}
                />
              </label>
            </div>

            <p className="pm-submit-note">
              Imported projects are
              restored to this workspace
              only. Use Save project to
              keep one in recent
              projects.
            </p>

            <BusinessRecentProjects
              projects={
                recentProjects
              }
              message={
                projectMessage
              }
              onOpen={
                openRecentProject
              }
            />
          </section>

          <div className="pm-submit-area">
            <button
              type="submit"
              className="pm-primary-button"
              disabled={running}
            >
              {running
                ? 'Optimizing…'
                : 'Optimize packing'}
            </button>

            <span className="pm-submit-note">
              Result is
              independently verified
              by the Packmetry core.
            </span>
          </div>
        </form>

        <section
          className="pm-pane pm-result-pane"
          aria-live="polite"
        >
          {!plan &&
            !error && (
              <div className="pm-empty-result">
                <div className="pm-empty-result-top">
                  <div>
                    <p className="pm-pane-kicker">
                      Business result
                    </p>

                    <h2>
                      Ready to optimize.
                    </h2>
                  </div>

                  <span className="pm-status-label">
                    Waiting
                  </span>
                </div>

                <p>
                  Run an optimization
                  to see the verified
                  business packing
                  result.
                </p>
              </div>
            )}

          {error !== null && (
            <div className="pm-error-state">
              <p className="pm-pane-kicker">
                Business result
              </p>

              <h2>
                Could not produce a
                packing plan.
              </h2>

              <p>
                {error}
              </p>
            </div>
          )}

          {plan !== null && (
            <>
              {businessResultMetrics !==
                null && (
                <div className="pm-context-note">
                  <strong>
                    Business metrics
                  </strong>

                  <span>
                    Gross packed weight:{' '}
                    {formatPackedWeight(
                      businessResultMetrics
                        .grossPackedWeightG
                    )}
                  </span>

                  <span>
                    Carton cost:{' '}
                    {formatBusinessCartonCost(
                      businessResultMetrics
                        .totalCartonCost
                    )}
                  </span>

                  <span>
                    Stock impact:{' '}
                    {formatBusinessStockImpact(
                      businessResultMetrics
                    )}
                  </span>

                  {alternatives.length >
                    0 && (
                    <span>
                      These business metrics stay tied to the recommended canonical plan while you compare alternatives.
                    </span>
                  )}
                </div>
              )}

              {inventoryUsage !==
                null && (
                <div className="pm-context-note">
                  <strong>
                    Inventory usage
                  </strong>

                  <span>
                    {
                      inventoryUsage
                        .usedCartons
                        .length
                    }{' '}
                    carton type
                    {inventoryUsage
                      .usedCartons
                      .length === 1
                      ? ''
                      : 's'}{' '}
                    used ·{' '}
                    {
                      inventoryUsage
                        .unusedCartons
                        .length
                    }{' '}
                    unused
                  </span>

                  {alternatives.length >
                    0 && (
                    <span>
                      Inventory usage stays tied to the recommended canonical plan while you compare alternatives.
                    </span>
                  )}

                  {inventoryUsage
                    .usedCartons
                    .map(entry => (
                      <span
                        key={
                          entry.cartonId
                        }
                      >
                        {cartonDisplayName(
                          entry.carton
                        )}
                        :{' '}
                        {
                          entry.usedQuantity
                        }{' '}
                        used
                        {entry.remainingQuantity !==
                        undefined
                          ? ` · ${entry.remainingQuantity} remaining`
                          : ''}
                      </span>
                    ))}
                </div>
              )}

              {recommendedPlan !==
                null &&
                alternatives.length >
                  0 && (
                  <PlanAlternatives
                    selectedPlan={
                      recommendedPlan
                    }
                    alternatives={
                      alternatives
                    }
                    activePlanId={
                      plan.id
                    }
                    onSelectPlan={
                      setPlan
                    }
                  />
                )}

              <ResultSummary
                plan={plan}
                itemLabels={
                  itemLabels
                }
              />

              <PackingVisualization
                plan={plan}
                itemLabels={
                  itemLabels
                }
              />
            </>
          )}
        </section>
      </div>
    </main>
  );
}
