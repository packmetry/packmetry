import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import PlanAlternatives, {
  objectiveLabel,
  objectiveRankingExplanation,
} from '../components/PlanAlternatives.js';
import type { PackingPlan } from '../core/domain/packing-plan.js';

function makePlan(
  id: string,
  overrides: Partial<PackingPlan> = {}
): PackingPlan {
  return {
    id,
    status: 'feasible',
    objective: {
      kind: 'fewest-cartons',
    },
    cartons: [
      {
        carton: {
          id: `${id}-box`,
          name: `${id} box`,
          internalDimensions: {
            length: 100,
            width: 100,
            height: 100,
          },
        },
        placements: [
          {
            itemId: 'item-1',
            instanceIndex: 0,
            x: 0,
            y: 0,
            z: 0,
            length: 80,
            width: 80,
            height: 80,
            rotation: 'LWH',
          },
        ],
        metrics: {
          itemCount: 1,
          itemVolumeMm3: 512_000,
          cartonVolumeMm3: 1_000_000,
          emptyVolumeMm3: 488_000,
          utilization: 0.512,
        },
      },
    ],
    unplacedItems: [],
    metrics: {
      cartonCount: 1,
      placedItemCount: 1,
      unplacedItemCount: 0,
      itemVolumeMm3: 512_000,
      cartonVolumeMm3: 1_000_000,
      emptyVolumeMm3: 488_000,
      utilization: 0.512,
    },
    explanations: [],
    solverMeta: {
      solverId: 'packmetry-baseline',
      solverVersion: '2',
      durationMs: 1,
      deterministic: true,
    },
    ...overrides,
  };
}

describe('PlanAlternatives', () => {
  it('renders nothing when no alternatives exist', () => {
    const html = renderToStaticMarkup(
      <PlanAlternatives
        selectedPlan={makePlan('selected')}
        alternatives={[]}
        activePlanId="selected"
        onSelectPlan={() => {}}
      />
    );

    expect(html).toBe('');
  });

  it('renders the recommended plan and verified alternatives', () => {
    const selectedPlan = makePlan('selected');

    const alternatives = [
      makePlan('selected:alternative:1', {
        metrics: {
          cartonCount: 2,
          placedItemCount: 1,
          unplacedItemCount: 0,
          itemVolumeMm3: 512_000,
          cartonVolumeMm3: 1_500_000,
          emptyVolumeMm3: 988_000,
          utilization: 0.3413,
        },
      }),
      makePlan('selected:alternative:2', {
        metrics: {
          cartonCount: 3,
          placedItemCount: 1,
          unplacedItemCount: 0,
          itemVolumeMm3: 512_000,
          cartonVolumeMm3: 2_000_000,
          emptyVolumeMm3: 1_488_000,
          utilization: 0.256,
        },
      }),
    ];

    const html = renderToStaticMarkup(
      <PlanAlternatives
        selectedPlan={selectedPlan}
        alternatives={alternatives}
        activePlanId={selectedPlan.id}
        onSelectPlan={() => {}}
      />
    );

    expect(html).toContain(
      'Packing alternatives'
    );

    expect(html).toContain(
      'Compare verified plans'
    );

    expect(html).toContain(
      'Recommended'
    );

    expect(html).toContain(
      'Alternative 1'
    );

    expect(html).toContain(
      'Alternative 2'
    );
  });

  it('marks the active plan button as pressed', () => {
    const selectedPlan =
      makePlan('selected');

    const alternative =
      makePlan(
        'selected:alternative:1'
      );

    const html =
      renderToStaticMarkup(
        <PlanAlternatives
          selectedPlan={
            selectedPlan
          }
          alternatives={[
            alternative,
          ]}
          activePlanId={
            alternative.id
          }
          onSelectPlan={() => {}}
        />
      );

    expect(html).toContain(
      'aria-pressed="true"'
    );

    expect(html).toContain(
      'aria-pressed="false"'
    );
  });

  it('shows metrics for the active plan only', () => {
    const selectedPlan = makePlan(
      'selected',
      {
        metrics: {
          cartonCount: 1,
          placedItemCount: 1,
          unplacedItemCount: 0,
          itemVolumeMm3: 512_000,
          cartonVolumeMm3: 1_000_000,
          emptyVolumeMm3: 488_000,
          utilization: 0.512,
        },
      }
    );

    const alternative = makePlan(
      'selected:alternative:1',
      {
        metrics: {
          cartonCount: 2,
          placedItemCount: 1,
          unplacedItemCount: 0,
          itemVolumeMm3: 512_000,
          cartonVolumeMm3: 1_500_000,
          emptyVolumeMm3: 988_000,
          utilization: 0.341,
        },
      }
    );

    const selectedHtml =
      renderToStaticMarkup(
        <PlanAlternatives
          selectedPlan={
            selectedPlan
          }
          alternatives={[
            alternative,
          ]}
          activePlanId={
            selectedPlan.id
          }
          onSelectPlan={() => {}}
        />
      );

    expect(
      selectedHtml
    ).toContain(
      '1 box · 51.2% space used · 488 cm³ empty'
    );

    expect(
      selectedHtml
    ).not.toContain(
      '2 boxes · 34.1% space used · 988 cm³ empty'
    );

    const alternativeHtml =
      renderToStaticMarkup(
        <PlanAlternatives
          selectedPlan={
            selectedPlan
          }
          alternatives={[
            alternative,
          ]}
          activePlanId={
            alternative.id
          }
          onSelectPlan={() => {}}
        />
      );

    expect(
      alternativeHtml
    ).toContain(
      '2 boxes · 34.1% space used · 988 cm³ empty'
    );

    expect(
      alternativeHtml
    ).not.toContain(
      '1 box · 51.2% space used · 488 cm³ empty'
    );
  });

  it('uses deterministic labels based on ranked position', () => {
    const selectedPlan =
      makePlan('selected');

    const alternatives = [
      makePlan(
        'selected:alternative:1'
      ),
      makePlan(
        'selected:alternative:2'
      ),
    ];

    const html =
      renderToStaticMarkup(
        <PlanAlternatives
          selectedPlan={
            selectedPlan
          }
          alternatives={
            alternatives
          }
          activePlanId="selected"
          onSelectPlan={() => {}}
        />
      );

    expect(html).toContain(
      'Recommended'
    );

    expect(html).toContain(
      'Alternative 1'
    );

    expect(html).toContain(
      'Alternative 2'
    );

    expect(html).not.toContain(
      'Alternative 0'
    );
  });

  it('renders the selected objective and its ranking explanation', () => {
    const selectedPlan = makePlan(
      'selected',
      {
        objective: {
          kind: 'fewest-cartons',
        },
      }
    );

    const html =
      renderToStaticMarkup(
        <PlanAlternatives
          selectedPlan={
            selectedPlan
          }
          alternatives={[
            makePlan(
              'selected:alternative:1',
              {
                objective: {
                  kind: 'fewest-cartons',
                },
              }
            ),
          ]}
          activePlanId={
            selectedPlan.id
          }
          onSelectPlan={() => {}}
        />
      );

    expect(html).toContain(
      'Ranking objective:'
    );

    expect(html).toContain(
      'Fewest boxes'
    );

    expect(html).toContain(
      'Packmetry prefers fewer boxes first'
    );

    expect(html).toContain(
      'Ties are resolved by less empty space'
    );
  });

  it('explains balanced ranking using the implemented deterministic order', () => {
    expect(
      objectiveLabel(
        'balanced'
      )
    ).toBe(
      'Balanced'
    );

    expect(
      objectiveRankingExplanation(
        'balanced'
      )
    ).toBe(
      'Among equally complete verified plans, Packmetry prefers fewer boxes first, then less empty space, then higher space utilization.'
    );
  });

  it('explains least-wasted-volume ranking using the implemented deterministic order', () => {
    expect(
      objectiveLabel(
        'least-wasted-volume'
      )
    ).toBe(
      'Least empty space'
    );

    expect(
      objectiveRankingExplanation(
        'least-wasted-volume'
      )
    ).toBe(
      'Among equally complete verified plans, Packmetry prefers less empty space first. Ties are resolved by lower total box volume, fewer boxes, then higher space utilization.'
    );
  });

  it('provides labels for all canonical objective kinds', () => {
    expect(
      objectiveLabel(
        'balanced'
      )
    ).toBe(
      'Balanced'
    );

    expect(
      objectiveLabel(
        'fewest-cartons'
      )
    ).toBe(
      'Fewest boxes'
    );

    expect(
      objectiveLabel(
        'least-wasted-volume'
      )
    ).toBe(
      'Least empty space'
    );

    expect(
      objectiveLabel(
        'easier-to-carry'
      )
    ).toBe(
      'Easier to carry'
    );

    expect(
      objectiveLabel(
        'existing-inventory-first'
      )
    ).toBe(
      'Existing inventory first'
    );

    expect(
      objectiveLabel(
        'min-dim-weight'
      )
    ).toBe(
      'Lowest DIM weight'
    );

    expect(
      objectiveLabel(
        'min-carton-cost'
      )
    ).toBe(
      'Lowest carton cost'
    );
  });

  it('keeps unsupported objective explanations truthful', () => {
    expect(
      objectiveRankingExplanation(
        'existing-inventory-first'
      )
    ).toContain(
      'requires inventory-aware ranking semantics'
    );

    expect(
      objectiveRankingExplanation(
        'min-dim-weight'
      )
    ).toContain(
      'requires DIM-weight semantics'
    );
  });

  it('uses truthful best-plan-found wording instead of claiming guaranteed optimality', () => {
    const selectedPlan =
      makePlan('selected');

    const html =
      renderToStaticMarkup(
        <PlanAlternatives
          selectedPlan={
            selectedPlan
          }
          alternatives={[
            makePlan(
              'selected:alternative:1'
            ),
          ]}
          activePlanId={
            selectedPlan.id
          }
          onSelectPlan={() => {}}
        />
      );

    expect(html).toContain(
      'best plan found by the current deterministic solver'
    );

    expect(html).toContain(
      'not a claim of guaranteed global optimality'
    );
  });

  it('describes whether the active plan is recommended or lower ranked', () => {
    const selectedPlan =
      makePlan('selected');

    const alternative =
      makePlan(
        'selected:alternative:1'
      );

    const recommendedHtml =
      renderToStaticMarkup(
        <PlanAlternatives
          selectedPlan={
            selectedPlan
          }
          alternatives={[
            alternative,
          ]}
          activePlanId={
            selectedPlan.id
          }
          onSelectPlan={() => {}}
        />
      );

    expect(
      recommendedHtml
    ).toContain(
      'This is the first-ranked verified plan for the selected objective.'
    );

    const alternativeHtml =
      renderToStaticMarkup(
        <PlanAlternatives
          selectedPlan={
            selectedPlan
          }
          alternatives={[
            alternative,
          ]}
          activePlanId={
            alternative.id
          }
          onSelectPlan={() => {}}
        />
      );

    expect(
      alternativeHtml
    ).toContain(
      'This independently verified plan ranked below the recommended plan for the same objective.'
    );
  });
});