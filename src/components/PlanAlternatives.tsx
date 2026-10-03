import type { PackingPlan } from '../core/domain/packing-plan.js';
import type { ObjectiveKind } from '../core/domain/objectives.js';

export interface PlanAlternativesProps {
  selectedPlan: PackingPlan;
  alternatives: readonly PackingPlan[];
  activePlanId: string;
  onSelectPlan: (plan: PackingPlan) => void;
}

function formatPercent(
  value: number
): string {
  return `${(value * 100).toFixed(1)}%`;
}

function formatEmptyVolume(
  valueMm3: number
): string {
  if (valueMm3 >= 1_000_000) {
    return `${(valueMm3 / 1_000_000)
      .toFixed(1)
      .replace(/\.0$/, '')} L`;
  }

  if (valueMm3 >= 1000) {
    return `${(valueMm3 / 1000)
      .toFixed(1)
      .replace(/\.0$/, '')} cm³`;
  }

  return `${valueMm3} mm³`;
}

function planLabel(
  index: number
): string {
  return index === 0
    ? 'Recommended'
    : `Alternative ${index}`;
}

export function objectiveLabel(
  objective: ObjectiveKind
): string {
  switch (objective) {
    case 'balanced':
      return 'Balanced';

    case 'fewest-cartons':
      return 'Fewest boxes';

    case 'least-wasted-volume':
      return 'Least empty space';

    case 'easier-to-carry':
      return 'Easier to carry';

    case 'existing-inventory-first':
      return 'Existing inventory first';

    case 'min-dim-weight':
      return 'Lowest DIM weight';

    case 'min-carton-cost':
      return 'Lowest carton cost';
  }
}

export function objectiveRankingExplanation(
  objective: ObjectiveKind
): string {
  switch (objective) {
    case 'balanced':
      return 'Among equally complete verified plans, Packmetry prefers fewer boxes first, then less empty space, then higher space utilization.';

    case 'fewest-cartons':
      return 'Among equally complete verified plans, Packmetry prefers fewer boxes first. Ties are resolved by less empty space, then higher space utilization.';

    case 'least-wasted-volume':
      return 'Among equally complete verified plans, Packmetry prefers less empty space first. Ties are resolved by lower total box volume, fewer boxes, then higher space utilization.';

    case 'easier-to-carry':
      return 'Among equally complete verified plans, Packmetry prefers the lowest maximum packed box weight, then lower total packed weight.';

    case 'min-carton-cost':
      return 'Among equally complete verified plans, Packmetry prefers lower total carton cost, then fewer boxes, then less empty space.';

    case 'existing-inventory-first':
      return 'This objective requires inventory-aware ranking semantics before it can be presented as an optimized comparison.';

    case 'min-dim-weight':
      return 'This objective requires DIM-weight semantics before it can be presented as an optimized comparison.';
  }
}

function planDescription(
  plan: PackingPlan
): string {
  const boxes =
    plan.metrics.cartonCount === 1
      ? '1 box'
      : `${plan.metrics.cartonCount} boxes`;

  return `${boxes} · ${formatPercent(
    plan.metrics.utilization
  )} space used · ${formatEmptyVolume(
    plan.metrics.emptyVolumeMm3
  )} empty`;
}

export default function PlanAlternatives({
  selectedPlan,
  alternatives,
  activePlanId,
  onSelectPlan,
}: PlanAlternativesProps) {
  if (alternatives.length === 0) {
    return null;
  }

  const plans = [
    selectedPlan,
    ...alternatives,
  ];

  const objective =
    selectedPlan.objective.kind;

  return (
    <section
      className="pm-summary"
      aria-labelledby="plan-alternatives-heading"
    >
      <div className="pm-summary-copy">
        <p className="pm-section-kicker">
          Packing alternatives
        </p>

        <h2 id="plan-alternatives-heading">
          Compare verified plans
        </h2>

        <p>
          Packmetry found more than one independently
          verified packing plan. The recommended plan
          is ranked first for your selected objective.
        </p>
      </div>

      <div className="pm-summary-detail-section">
        <strong>
          Ranking objective:{' '}
          {objectiveLabel(
            objective
          )}
        </strong>

        <p>
          {objectiveRankingExplanation(
            objective
          )}
        </p>

        <p className="pm-fine-print">
          Recommended means the best plan found by the
          current deterministic solver for this objective.
          It is not a claim of guaranteed global optimality.
        </p>
      </div>

      <div
        className="pm-result-tabs"
        role="group"
        aria-label="Verified packing plans"
      >
        {plans.map(
          (
            plan,
            index
          ) => {
            const active =
              plan.id ===
              activePlanId;

            return (
              <button
                key={
                  plan.id
                }
                type="button"
                aria-pressed={
                  active
                }
                onClick={() =>
                  onSelectPlan(
                    plan
                  )
                }
              >
                {planLabel(
                  index
                )}
              </button>
            );
          }
        )}
      </div>

      <div
        className="pm-summary-detail-section"
        aria-live="polite"
      >
        {plans.map(
          (
            plan,
            index
          ) => {
            if (
              plan.id !==
              activePlanId
            ) {
              return null;
            }

            const recommended =
              index === 0;

            return (
              <div
                key={
                  plan.id
                }
              >
                <strong>
                  {planLabel(
                    index
                  )}
                </strong>

                <p>
                  {planDescription(
                    plan
                  )}
                </p>

                <p className="pm-fine-print">
                  {recommended
                    ? 'This is the first-ranked verified plan for the selected objective.'
                    : 'This independently verified plan ranked below the recommended plan for the same objective.'}
                </p>
              </div>
            );
          }
        )}
      </div>
    </section>
  );
}