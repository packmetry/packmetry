import type { PackingPlan } from '../core/domain/packing-plan.js';

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
              </div>
            );
          }
        )}
      </div>
    </section>
  );
}