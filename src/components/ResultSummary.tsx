import type { PackingPlan } from '../core/domain/packing-plan.js';
import type { PlanStatus } from '../core/domain/result.js';
import type { UnplacedReason } from '../core/domain/plan-contracts.js';

export interface ResultSummaryProps {
  plan: PackingPlan;
}

const STATUS_COPY: Record<
  PlanStatus,
  { heading: string; detail: string }
> = {
  feasible: {
    heading: 'Everything fits.',
    detail: 'All requested items were packed into the box plan below.',
  },
  partial: {
    heading: 'Some items still need a box.',
    detail:
      'Packmetry found a verified partial plan, but not every requested item could be placed.',
  },
  infeasible: {
    heading: 'This box setup cannot pack the items.',
    detail:
      'No requested item could be placed with the currently available box setup.',
  },
  limit_reached: {
    heading: 'Packing stopped before a complete answer.',
    detail:
      'The solver reached its current limit before it could finish the packing search.',
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

function formatPercent(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

function formatDimensions(
  length: number,
  width: number,
  height: number
): string {
  return `${length} × ${width} × ${height} mm`;
}

export default function ResultSummary({
  plan,
}: ResultSummaryProps) {
  const statusCopy = STATUS_COPY[plan.status];

  return (
    <section aria-labelledby="packing-result-heading">
      <div style={styles.header}>
        <div>
          <p style={styles.eyebrow}>Packing result</p>
          <h2 id="packing-result-heading" style={styles.heading}>
            {statusCopy.heading}
          </h2>
          <p style={styles.detail}>{statusCopy.detail}</p>
        </div>

        <span style={styles.status}>{plan.status}</span>
      </div>

      <dl style={styles.metrics}>
        <div style={styles.metric}>
          <dt style={styles.metricLabel}>Boxes used</dt>
          <dd style={styles.metricValue}>
            {plan.metrics.cartonCount}
          </dd>
        </div>

        <div style={styles.metric}>
          <dt style={styles.metricLabel}>Items packed</dt>
          <dd style={styles.metricValue}>
            {plan.metrics.placedItemCount}
          </dd>
        </div>

        <div style={styles.metric}>
          <dt style={styles.metricLabel}>Items unpacked</dt>
          <dd style={styles.metricValue}>
            {plan.metrics.unplacedItemCount}
          </dd>
        </div>

        <div style={styles.metric}>
          <dt style={styles.metricLabel}>Space used</dt>
          <dd style={styles.metricValue}>
            {formatPercent(plan.metrics.utilization)}
          </dd>
        </div>
      </dl>

      {plan.cartons.length > 0 && (
        <section
          aria-labelledby="box-plan-heading"
          style={styles.section}
        >
          <h3 id="box-plan-heading" style={styles.sectionHeading}>
            Box plan
          </h3>

          <div style={styles.boxList}>
            {plan.cartons.map((packedCarton, index) => (
              <article
                key={`${packedCarton.carton.id}-${index}`}
                style={styles.boxCard}
              >
                <div style={styles.boxTopLine}>
                  <strong>
                    Box {index + 1}
                    {packedCarton.carton.name
                      ? ` — ${packedCarton.carton.name}`
                      : ''}
                  </strong>

                  <span style={styles.boxUtilization}>
                    {formatPercent(
                      packedCarton.metrics.utilization
                    )}{' '}
                    used
                  </span>
                </div>

                <p style={styles.boxMeta}>
                  {formatDimensions(
                    packedCarton.carton.internalDimensions.length,
                    packedCarton.carton.internalDimensions.width,
                    packedCarton.carton.internalDimensions.height
                  )}
                  {' · '}
                  {packedCarton.metrics.itemCount}{' '}
                  {packedCarton.metrics.itemCount === 1
                    ? 'item'
                    : 'items'}
                </p>
              </article>
            ))}
          </div>
        </section>
      )}

      {plan.unplacedItems.length > 0 && (
        <section
          aria-labelledby="unpacked-heading"
          style={styles.section}
        >
          <h3 id="unpacked-heading" style={styles.sectionHeading}>
            Items not packed
          </h3>

          <ul style={styles.issueList}>
            {plan.unplacedItems.map(item => (
              <li
                key={`${item.itemId}-${item.instanceIndex}`}
                style={styles.issue}
              >
                <strong>
                  {item.itemId} #{item.instanceIndex + 1}
                </strong>
                <span style={styles.issueText}>
                  {describeUnplacedReason(item.reason)}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {plan.explanations.length > 0 && (
        <section
          aria-labelledby="explanations-heading"
          style={styles.section}
        >
          <h3
            id="explanations-heading"
            style={styles.sectionHeading}
          >
            Notes
          </h3>

          <ul style={styles.noteList}>
            {plan.explanations.map(explanation => (
              <li
                key={`${explanation.code}-${explanation.message}`}
                style={styles.note}
              >
                {explanation.message}
              </li>
            ))}
          </ul>
        </section>
      )}

      <p style={styles.verification}>
        Independently verified by the Packmetry core.
      </p>
    </section>
  );
}

const styles = {
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: '20px',
  },
  eyebrow: {
    margin: '0 0 6px',
    fontSize: '12px',
    fontWeight: 700,
    letterSpacing: '0.08em',
    textTransform: 'uppercase' as const,
    color: '#71717a',
  },
  heading: {
    margin: '0 0 8px',
    fontSize: '24px',
    lineHeight: 1.2,
    letterSpacing: '-0.02em',
    color: '#18181b',
  },
  detail: {
    margin: 0,
    maxWidth: '560px',
    color: '#52525b',
    lineHeight: 1.55,
  },
  status: {
    flexShrink: 0,
    borderRadius: '999px',
    padding: '5px 10px',
    background: '#f4f4f5',
    color: '#27272a',
    fontSize: '12px',
    fontWeight: 700,
  },
  metrics: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
    gap: '10px',
    margin: '22px 0 0',
  },
  metric: {
    borderRadius: '12px',
    padding: '14px',
    background: '#f4f4f5',
  },
  metricLabel: {
    color: '#52525b',
    fontSize: '13px',
  },
  metricValue: {
    margin: '5px 0 0',
    color: '#18181b',
    fontSize: '24px',
    fontWeight: 800,
  },
  section: {
    marginTop: '24px',
    paddingTop: '20px',
    borderTop: '1px solid #e4e4e7',
  },
  sectionHeading: {
    margin: '0 0 12px',
    color: '#18181b',
    fontSize: '15px',
  },
  boxList: {
    display: 'grid',
    gap: '10px',
  },
  boxCard: {
    border: '1px solid #e4e4e7',
    borderRadius: '12px',
    padding: '14px',
    background: '#fafafa',
  },
  boxTopLine: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: '14px',
    color: '#27272a',
  },
  boxUtilization: {
    flexShrink: 0,
    color: '#52525b',
    fontSize: '13px',
  },
  boxMeta: {
    margin: '6px 0 0',
    color: '#71717a',
    fontSize: '13px',
    lineHeight: 1.45,
  },
  issueList: {
    display: 'grid',
    gap: '10px',
    margin: 0,
    padding: 0,
    listStyle: 'none',
  },
  issue: {
    display: 'grid',
    gap: '4px',
    borderRadius: '10px',
    padding: '12px',
    background: '#fff7ed',
    color: '#7c2d12',
  },
  issueText: {
    fontSize: '13px',
    lineHeight: 1.45,
  },
  noteList: {
    margin: 0,
    paddingLeft: '20px',
    color: '#52525b',
  },
  note: {
    marginBottom: '8px',
    lineHeight: 1.5,
  },
  verification: {
    margin: '22px 0 0',
    color: '#71717a',
    fontSize: '12px',
  },
} as const;