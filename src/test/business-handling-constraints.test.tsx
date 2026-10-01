import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import BusinessWorkspace, {
  BUSINESS_HANDLING_OPTIONS,
  buildBusinessItems,
  runBusinessWorkspace,
  type BusinessCartonValues,
  type BusinessHandlingPolicy,
  type BusinessProductValues,
} from '../components/BusinessWorkspace.js';

function product(
  overrides: Partial<BusinessProductValues> = {}
): BusinessProductValues {
  return {
    id: 'business-product-1',
    name: 'Display product',
    sku: 'SKU-001',
    lengthMm: 100,
    widthMm: 60,
    heightMm: 40,
    quantity: 1,
    unitWeightG: undefined,
    ...overrides,
  };
}

function carton(
  overrides: Partial<BusinessCartonValues> = {}
): BusinessCartonValues {
  return {
    id: 'business-carton-1',
    name: 'Inventory carton',
    cartonCode: 'BX-001',
    lengthMm: 100,
    widthMm: 100,
    heightMm: 100,
    quantityAvailable: 1,
    maxGrossWeightG: undefined,
    emptyBoxWeightG: undefined,
    costPerBox: undefined,
    ...overrides,
  };
}

describe('BusinessWorkspace handling constraints', () => {
  it('exposes exactly the three supported rotation policies', () => {
    expect(
      BUSINESS_HANDLING_OPTIONS.map(
        option => option.policy
      )
    ).toEqual([
      'any',
      'upright',
      'fixed',
    ]);

    expect(
      BUSINESS_HANDLING_OPTIONS.map(
        option => option.label
      )
    ).toEqual([
      'Any rotation',
      'Keep upright',
      'Fixed orientation',
    ]);
  });

  it('renders the supported handling controls for a business product', () => {
    const html =
      renderToStaticMarkup(
        <BusinessWorkspace />
      );

    expect(html).toContain(
      'Handling'
    );
    expect(html).toContain(
      'Any rotation'
    );
    expect(html).toContain(
      'Keep upright'
    );
    expect(html).toContain(
      'Fixed orientation'
    );
  });

  it('defaults omitted business handling to canonical any rotation', () => {
    const item =
      buildBusinessItems([
        product({
          rotationPolicy:
            undefined,
        }),
      ])[0];

    expect(
      item?.constraints
        .rotationPolicy
    ).toBe('any');
  });

  it.each<
    BusinessHandlingPolicy
  >([
    'any',
    'upright',
    'fixed',
  ])(
    'maps %s to the canonical Item rotation policy',
    policy => {
      const item =
        buildBusinessItems([
          product({
            rotationPolicy:
              policy,
          }),
        ])[0];

      expect(
        item?.constraints
          .rotationPolicy
      ).toBe(policy);
    }
  );

  it('allows a height-changing rotation only when unrestricted rotation is selected', async () => {
    const unrestricted =
      await runBusinessWorkspace(
        [
          product({
            rotationPolicy:
              'any',
          }),
        ],
        [
          carton({
            lengthMm: 40,
            widthMm: 60,
            heightMm: 100,
          }),
        ]
      );

    const upright =
      await runBusinessWorkspace(
        [
          product({
            rotationPolicy:
              'upright',
          }),
        ],
        [
          carton({
            lengthMm: 40,
            widthMm: 60,
            heightMm: 100,
          }),
        ]
      );

    expect(
      unrestricted.plan.status
    ).toBe('feasible');

    expect(
      unrestricted.plan
        .cartons[0]
        ?.placements[0]
        ?.rotation
    ).toBe('HWL');

    expect(
      upright.plan.status
    ).toBe('infeasible');

    expect(
      upright.plan
        .unplacedItems[0]
        ?.reason
    ).toBe(
      'constraint-conflict'
    );
  });

  it('allows horizontal turning for keep-upright but not for fixed orientation', async () => {
    const upright =
      await runBusinessWorkspace(
        [
          product({
            rotationPolicy:
              'upright',
          }),
        ],
        [
          carton({
            lengthMm: 60,
            widthMm: 100,
            heightMm: 40,
          }),
        ]
      );

    const fixed =
      await runBusinessWorkspace(
        [
          product({
            rotationPolicy:
              'fixed',
          }),
        ],
        [
          carton({
            lengthMm: 60,
            widthMm: 100,
            heightMm: 40,
          }),
        ]
      );

    expect(
      upright.plan.status
    ).toBe('feasible');

    expect(
      upright.plan
        .cartons[0]
        ?.placements[0]
        ?.rotation
    ).toBe('WLH');

    expect(
      fixed.plan.status
    ).toBe('infeasible');

    expect(
      fixed.plan
        .unplacedItems[0]
        ?.reason
    ).toBe(
      'constraint-conflict'
    );
  });

  it('does not expose unsupported handling semantics as functional controls', () => {
    const html =
      renderToStaticMarkup(
        <BusinessWorkspace />
      );

    expect(html).not.toContain(
      'Fragile'
    );
    expect(html).not.toContain(
      'Padding'
    );
    expect(html).not.toContain(
      'Spacing'
    );
    expect(html).not.toContain(
      'Stackable'
    );
  });

  it('keeps handling metadata separate from product identity and measurements', () => {
    const source =
      product({
        name: 'Monitor',
        sku: 'MON-24',
        rotationPolicy:
          'fixed',
      });

    const before =
      JSON.stringify(source);

    const item =
      buildBusinessItems([
        source,
      ])[0];

    expect(
      JSON.stringify(source)
    ).toBe(before);

    expect(item).toMatchObject({
      id: 'business-product-1',
      name: 'Monitor',
      sku: 'MON-24',
      dimensions: {
        length: 100,
        width: 60,
        height: 40,
      },
      quantity: 1,
      constraints: {
        rotationPolicy: 'fixed',
      },
    });
  });
});
