import { useState, type SyntheticEvent } from 'react';

import PackingVisualization from './PackingVisualization.js';
import ResultSummary from './ResultSummary.js';
import { createCarton, type Carton } from '../core/domain/carton.js';
import { createItem, type Item } from '../core/domain/item.js';
import type { PackingPlan } from '../core/domain/packing-plan.js';
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
}

export interface BusinessCartonValues {
  id: string;
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

export interface BusinessWorkspaceResult {
  plan: PackingPlan;
  inventoryUsage: HaveBoxesInventoryUsage;
}

export interface BusinessWorkspaceProps {
  initialProducts?: readonly BusinessProductValues[];
  initialCartons?: readonly BusinessCartonValues[];
}

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
  cartons: readonly BusinessCartonValues[]
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
          kind: 'balanced',
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
    inventoryUsage:
      result.inventoryUsage,
  };
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

export default function BusinessWorkspace({
  initialProducts,
  initialCartons,
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

  const [plan, setPlan] =
    useState<PackingPlan | null>(
      null
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

  const submit = async (
    event:
      SyntheticEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    setRunning(true);
    setPlan(null);
    setInventoryUsage(null);
    setError(null);

    try {
      const result =
        await runBusinessWorkspace(
          products,
          cartons
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
              Balanced
            </span>
          </div>

          <div className="pm-context-note">
            <strong>
              First Business UX slice
            </strong>

            <span>
              Manual order entry,
              carton inventory and a
              balanced verified packing
              result. Objective
              selection comes in a
              later Phase 9 slice.
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
                  dimensions, quantity
                  and optional unit
                  weight.
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
