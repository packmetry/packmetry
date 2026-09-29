import {
  useState,
} from 'react';

import type { PackingPlan } from '../core/domain/packing-plan.js';
import type { ObjectiveKind } from '../core/domain/objectives.js';
import type { PlanStatus } from '../core/domain/result.js';
import type { UnplacedReason } from '../core/domain/plan-contracts.js';

import {
  savePackingPlan,
  sharePackingPlan,
} from '../browser/packing-plan-actions.js';

export interface ResultSummaryProps {
  plan: PackingPlan;
  itemLabels?: Readonly<Record<string, string>>;
}

const EMPTY_ITEM_LABELS: Readonly<Record<string, string>> = {};

const STATUS_COPY: Record<
  PlanStatus,
  {
    heading: string;
    detail: string;
    badge: string;
  }
> = {
  feasible: {
    heading: 'Everything fits.',
    detail:
      'All requested items were packed into the box plan below.',
    badge: 'Verified fit',
  },

  partial: {
    heading: 'Some items still need a box.',
    detail:
      'Packmetry found a verified partial plan, but not every requested item could be placed.',
    badge: 'Partial fit',
  },

  infeasible: {
    heading: 'This box setup cannot pack the items.',
    detail:
      'No requested item could be placed with the currently available box setup.',
    badge: 'Does not fit',
  },

  limit_reached: {
    heading: 'Packing stopped before a complete answer.',
    detail:
      'The solver reached its current limit before it could finish the packing search.',
    badge: 'Search stopped',
  },
};

export function describeUnplacedReason(
  reason: UnplacedReason
): string {
  switch (reason) {
    case 'no-fitting-carton':
      return 'No available box is large enough for this item.';

    case 'inventory-exhausted':
      return 'There are not enough available boxes to place this item.';

    case 'weight-limit':
      return 'Placing this item would exceed a box weight limit.';

    case 'constraint-conflict':
      return 'This item conflicts with the current packing constraints.';

    case 'solver-limit-reached':
      return 'The solver stopped before it could place this item.';
  }
}

export function describeObjectiveRationale(
  objective: ObjectiveKind
): string {
  switch (objective) {
    case 'balanced':
      return 'This plan prioritizes fewer boxes first, then less empty space and higher space utilization.';

    case 'fewest-cartons':
      return 'This plan prioritizes using fewer boxes, then breaks ties using less empty space and higher space utilization.';

    case 'least-wasted-volume':
      return 'This plan prioritizes less empty space, then smaller total box volume, fewer boxes, and higher space utilization.';

    case 'easier-to-carry':
      return 'This plan prioritizes a lower heaviest-box weight, then lower total packed weight, fewer boxes, and less empty space.';

    case 'existing-inventory-first':
      return 'This plan records using existing box inventory first as its packing objective.';

    case 'min-dim-weight':
      return 'This plan records minimizing dimensional-weight impact as its packing objective.';

    case 'min-carton-cost':
      return 'This plan prioritizes lower box cost, then fewer boxes and less empty space.';
  }
}

function formatNumber(
  value: number,
  fractionDigits: number
): string {
  return value
    .toFixed(fractionDigits)
    .replace(/\.?0+$/, '');
}

function formatPercent(
  value: number
): string {
  return `${(value * 100).toFixed(1)}%`;
}

export function formatPackedWeight(
  valueG: number | undefined
): string {
  if (valueG === undefined) {
    return 'Not provided';
  }

  if (valueG >= 1000) {
    return `${formatNumber(
      valueG / 1000,
      2
    )} kg`;
  }

  return `${formatNumber(
    valueG,
    1
  )} g`;
}

export function formatEmptySpace(
  valueMm3: number
): string {
  if (valueMm3 >= 1_000_000) {
    return `${formatNumber(
      valueMm3 / 1_000_000,
      1
    )} L`;
  }

  if (valueMm3 >= 1000) {
    return `${formatNumber(
      valueMm3 / 1000,
      1
    )} cm³`;
  }

  return `${formatNumber(
    valueMm3,
    0
  )} mm³`;
}

function formatDimensions(
  length: number,
  width: number,
  height: number
): string {
  return `${length} × ${width} × ${height} mm`;
}

function buildItemIndexes(
  plan: PackingPlan
): ReadonlyMap<string, number> {
  const indexes =
    new Map<string, number>();

  const registerItem = (
    itemId: string
  ) => {
    if (!indexes.has(itemId)) {
      indexes.set(
        itemId,
        indexes.size
      );
    }
  };

  plan.cartons.forEach(
    packedCarton => {
      packedCarton.placements.forEach(
        placement => {
          registerItem(
            placement.itemId
          );
        }
      );
    }
  );

  plan.unplacedItems.forEach(
    item => {
      registerItem(
        item.itemId
      );
    }
  );

  return indexes;
}

function itemDisplayName(
  itemId: string,
  itemLabels: Readonly<Record<string, string>>,
  itemIndexes: ReadonlyMap<string, number>
): string {
  const suppliedLabel =
    itemLabels[itemId]?.trim();

  if (suppliedLabel) {
    return suppliedLabel;
  }

  const itemIndex =
    itemIndexes.get(itemId);

  return itemIndex === undefined
    ? 'Item'
    : `Item ${itemIndex + 1}`;
}

export default function ResultSummary({
  plan,
  itemLabels = EMPTY_ITEM_LABELS,
}: ResultSummaryProps) {
  const statusCopy =
    STATUS_COPY[plan.status];

  const itemIndexes =
    buildItemIndexes(plan);

  const [
    actionMessage,
    setActionMessage,
  ] =
    useState<string | null>(
      null
    );

  const handleSavePlan =
    () => {
      const saved =
        savePackingPlan(plan);

      setActionMessage(
        saved
          ? 'Plan saved as a JSON file.'
          : 'Saving is not available in this browser.'
      );
    };

  const handleSharePlan =
    async () => {
      const result =
        await sharePackingPlan(
          plan
        );

      switch (result) {
        case 'shared':
          setActionMessage(
            'Plan shared.'
          );
          break;

        case 'copied':
          setActionMessage(
            'Plan copied to your clipboard.'
          );
          break;

        case 'cancelled':
          setActionMessage(
            'Share cancelled.'
          );
          break;

        case 'unavailable':
          setActionMessage(
            'Sharing is not available in this browser.'
          );
          break;
      }
    };

  return (
    <section
      aria-labelledby="packing-result-heading"
      className="pm-summary"
    >
      <div className="pm-summary-header">
        <div className="pm-summary-copy">
          <p className="pm-section-kicker">
            Packing result
          </p>

          <h2 id="packing-result-heading">
            {statusCopy.heading}
          </h2>

          <p>
            {statusCopy.detail}
          </p>
        </div>

        <span
          className={`pm-summary-status pm-summary-status-${statusCopy.badge}`}
        >
          {statusCopy.badge}
        </span>
      </div>

      <dl className="pm-summary-metrics">
        <div className="pm-summary-metric">
          <dt>
            Boxes used
          </dt>

          <dd>
            {plan.metrics.cartonCount}
          </dd>
        </div>

        <div className="pm-summary-metric">
          <dt>
            Items packed
          </dt>

          <dd>
            {plan.metrics.placedItemCount}
          </dd>
        </div>

        <div className="pm-summary-metric">
          <dt>
            Items unpacked
          </dt>

          <dd>
            {plan.metrics.unplacedItemCount}
          </dd>
        </div>

        <div className="pm-summary-metric">
          <dt>
            Volume used
          </dt>

          <dd>
            {formatPercent(
              plan.metrics.utilization
            )}
          </dd>
        </div>

        <div className="pm-summary-metric">
          <dt>
            Packed weight
          </dt>

          <dd>
            {formatPackedWeight(
              plan.metrics.totalContentsWeightG
            )}
          </dd>
        </div>

        <div className="pm-summary-metric">
          <dt>
            Empty space
          </dt>

          <dd>
            {formatEmptySpace(
              plan.metrics.emptyVolumeMm3
            )}
          </dd>
        </div>
      </dl>

      <section
        aria-labelledby="packing-rationale-heading"
        className="pm-summary-rationale"
      >
        <p className="pm-section-kicker">
          Why this plan?
        </p>

        <h3 id="packing-rationale-heading">
          Chosen for your packing goal
        </h3>

        <p>
          {describeObjectiveRationale(
            plan.objective.kind
          )}
        </p>
      </section>

      <section
        aria-label="Packing plan actions"
        className="pm-summary-detail-section"
      >
        <div
          className="pm-result-tabs"
          role="group"
          aria-label="Packing plan actions"
        >
          <button
            type="button"
            onClick={
              handleSavePlan
            }
          >
            Save plan
          </button>

          <button
            type="button"
            onClick={
              handleSharePlan
            }
          >
            Share plan
          </button>
        </div>

        {actionMessage !== null && (
          <p
            role="status"
            className="pm-fine-print"
          >
            {actionMessage}
          </p>
        )}
      </section>

      {(plan.cartons.length > 0 ||
        plan.unplacedItems.length > 0 ||
        plan.explanations.length > 0) && (
        <details className="pm-summary-details">
          <summary>
            Plan details
          </summary>

          <div className="pm-summary-details-body">
            {plan.cartons.length > 0 && (
              <section
                aria-labelledby="box-plan-heading"
              >
                <h3 id="box-plan-heading">
                  Box plan
                </h3>

                <div className="pm-summary-box-list">
                  {plan.cartons.map(
                    (
                      packedCarton,
                      index
                    ) => (
                      <article
                        key={`${packedCarton.carton.id}-${index}`}
                        className="pm-summary-box-row"
                      >
                        <div>
                          <strong>
                            Box {index + 1}
                            {packedCarton
                              .carton
                              .name
                              ? ` — ${packedCarton.carton.name}`
                              : ''}
                          </strong>

                          <span>
                            {formatDimensions(
                              packedCarton
                                .carton
                                .internalDimensions
                                .length,
                              packedCarton
                                .carton
                                .internalDimensions
                                .width,
                              packedCarton
                                .carton
                                .internalDimensions
                                .height
                            )}
                            {' · '}
                            {
                              packedCarton
                                .metrics
                                .itemCount
                            }{' '}
                            {packedCarton
                              .metrics
                              .itemCount === 1
                              ? 'item'
                              : 'items'}
                          </span>
                        </div>

                        <span className="pm-summary-box-utilization">
                          {formatPercent(
                            packedCarton
                              .metrics
                              .utilization
                          )}{' '}
                          used
                        </span>
                      </article>
                    )
                  )}
                </div>
              </section>
            )}

            {plan.unplacedItems.length > 0 && (
              <section
                aria-labelledby="unpacked-heading"
                className="pm-summary-detail-section"
              >
                <h3 id="unpacked-heading">
                  Items not packed
                </h3>

                <ul className="pm-summary-issue-list">
                  {plan.unplacedItems.map(
                    item => {
                      const label =
                        itemDisplayName(
                          item.itemId,
                          itemLabels,
                          itemIndexes
                        );

                      return (
                        <li
                          key={`${item.itemId}-${item.instanceIndex}`}
                        >
                          <strong>
                            {label} #
                            {item.instanceIndex + 1}
                          </strong>

                          <span>
                            {describeUnplacedReason(
                              item.reason
                            )}
                          </span>
                        </li>
                      );
                    }
                  )}
                </ul>
              </section>
            )}

            {plan.explanations.length > 0 && (
              <section
                aria-labelledby="explanations-heading"
                className="pm-summary-detail-section"
              >
                <h3 id="explanations-heading">
                  Notes
                </h3>

                <ul className="pm-summary-note-list">
                  {plan.explanations.map(
                    explanation => (
                      <li
                        key={`${explanation.code}-${explanation.message}`}
                      >
                        {explanation.message}
                      </li>
                    )
                  )}
                </ul>
              </section>
            )}

            <p className="pm-summary-verification">
              Independently verified by the Packmetry core.
            </p>
          </div>
        </details>
      )}
    </section>
  );
}