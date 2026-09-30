import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import BusinessWorkspace, {
  BUSINESS_OBJECTIVE_OPTIONS,
  runBusinessWorkspace,
  type BusinessCartonValues,
  type BusinessObjectiveKind,
  type BusinessProductValues,
} from '../components/BusinessWorkspace.js';

function product(): BusinessProductValues {
  return {
    id: 'business-product-1',
    name: 'Ceramic mug',
    sku: 'MUG-001',
    lengthMm: 20,
    widthMm: 20,
    heightMm: 20,
    quantity: 1,
    unitWeightG: 500,
  };
}

function carton(): BusinessCartonValues {
  return {
    id: 'business-carton-1',
    name: 'Small shipper',
    cartonCode: 'BX-S',
    lengthMm: 100,
    widthMm: 100,
    heightMm: 100,
    quantityAvailable: 2,
    maxGrossWeightG: 5000,
    emptyBoxWeightG: 250,
    costPerBox: 1.5,
  };
}

describe('BusinessWorkspace objective selection', () => {
  it('exposes exactly the first three safe business objectives', () => {
    expect(
      BUSINESS_OBJECTIVE_OPTIONS.map(
        option => option.kind
      )
    ).toEqual([
      'balanced',
      'fewest-cartons',
      'least-wasted-volume',
    ]);

    expect(
      BUSINESS_OBJECTIVE_OPTIONS.map(
        option => option.label
      )
    ).toEqual([
      'Balanced',
      'Fewest boxes',
      'Least empty space',
    ]);
  });

  it('renders the business objective selector', () => {
    const html =
      renderToStaticMarkup(
        <BusinessWorkspace />
      );

    expect(html).toContain(
      'Optimization objective'
    );
    expect(html).toContain(
      'Balanced'
    );
    expect(html).toContain(
      'Fewest boxes'
    );
    expect(html).toContain(
      'Least empty space'
    );
    expect(html).toContain(
      'Choose the business goal used to rank verified packing candidates.'
    );
  });

  it('defaults the selector to Balanced', () => {
    const html =
      renderToStaticMarkup(
        <BusinessWorkspace />
      );

    expect(html).toMatch(
      /aria-pressed="true"[^>]*>Balanced<\/button>/
    );
  });

  it('supports an initial objective for deterministic rendering', () => {
    const html =
      renderToStaticMarkup(
        <BusinessWorkspace
          initialObjective="fewest-cartons"
        />
      );

    expect(html).toMatch(
      /aria-pressed="true"[^>]*>Fewest boxes<\/button>/
    );

    expect(html).toContain(
      'Prioritize using the fewest cartons for the order.'
    );
  });

  it.each<
    BusinessObjectiveKind
  >([
    'balanced',
    'fewest-cartons',
    'least-wasted-volume',
  ])(
    'passes %s through the existing verified planning pipeline',
    async objective => {
      const result =
        await runBusinessWorkspace(
          [product()],
          [carton()],
          objective
        );

      expect(
        result.plan.status
      ).toBe('feasible');

      expect(
        result.plan.objective.kind
      ).toBe(objective);

      expect(
        result.plan.solverMeta
          .solverId
      ).toBe(
        'packmetry-baseline'
      );
    }
  );

  it('does not expose objectives intentionally deferred from this slice', () => {
    const html =
      renderToStaticMarkup(
        <BusinessWorkspace />
      );

    expect(html).not.toContain(
      'Lowest DIM weight'
    );
    expect(html).not.toContain(
      'Lowest carton cost'
    );
    expect(html).not.toContain(
      'Easier to carry'
    );
    expect(html).not.toContain(
      'Use existing inventory first'
    );
  });

  it('keeps the default runBusinessWorkspace objective backward compatible', async () => {
    const result =
      await runBusinessWorkspace(
        [product()],
        [carton()]
      );

    expect(
      result.plan.objective.kind
    ).toBe('balanced');
  });
});
