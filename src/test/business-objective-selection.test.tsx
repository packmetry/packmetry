import {
  renderToStaticMarkup,
} from 'react-dom/server';
import {
  describe,
  expect,
  it,
} from 'vitest';

import BusinessWorkspace, {
  BUSINESS_MIN_DIM_DIVISOR_REQUIRED_MESSAGE,
  BUSINESS_MIN_DIM_EXTERNAL_DIMENSIONS_REQUIRED_MESSAGE,
  BUSINESS_OBJECTIVE_OPTIONS,
  isBusinessMinDimWeightObjectiveAvailable,
  runBusinessWorkspace,
  type BusinessCartonValues,
  type BusinessDimensionalWeightValues,
  type BusinessObjectiveKind,
  type BusinessProductValues,
} from '../components/BusinessWorkspace.js';
import type {
  DimensionalWeightSettings,
} from '../core/units/dimensional-weight.js';

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

function carton(
  overrides:
    Partial<BusinessCartonValues> = {}
): BusinessCartonValues {
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
    ...overrides,
  };
}

function dimensionalWeightValues(
  overrides:
    Partial<BusinessDimensionalWeightValues> = {}
): BusinessDimensionalWeightValues {
  return {
    divisorValue: 1000,
    lengthUnit: 'cm',
    massUnit: 'kg',
    ...overrides,
  };
}

function dimensionalWeightSettings():
  DimensionalWeightSettings {
  return {
    divisor: {
      value: 1000,
      lengthUnit: 'cm',
      massUnit: 'kg',
    },
  };
}

function minDimButtonMarkup(
  html: string
): string {
  const match =
    html.match(
      /<button[^>]*>Lowest DIM weight<\/button>/
    );

  expect(match).not.toBeNull();

  return match![0];
}

describe(
  'BusinessWorkspace objective selection',
  () => {
    it(
      'exposes exactly the four supported Business objectives',
      () => {
        expect(
          BUSINESS_OBJECTIVE_OPTIONS.map(
            option =>
              option.kind
          )
        ).toEqual([
          'balanced',
          'fewest-cartons',
          'least-wasted-volume',
          'min-dim-weight',
        ]);

        expect(
          BUSINESS_OBJECTIVE_OPTIONS.map(
            option =>
              option.label
          )
        ).toEqual([
          'Balanced',
          'Fewest boxes',
          'Least empty space',
          'Lowest DIM weight',
        ]);
      }
    );

    it(
      'renders the Business objective selector including Lowest DIM weight',
      () => {
        const html =
          renderToStaticMarkup(
            <BusinessWorkspace />
          );

        expect(
          html
        ).toContain(
          'Optimization objective'
        );

        expect(
          html
        ).toContain(
          'Balanced'
        );

        expect(
          html
        ).toContain(
          'Fewest boxes'
        );

        expect(
          html
        ).toContain(
          'Least empty space'
        );

        expect(
          html
        ).toContain(
          'Lowest DIM weight'
        );

        expect(
          html
        ).toContain(
          'Choose the business goal used to rank verified packing candidates.'
        );
      }
    );

    it(
      'defaults the selector to Balanced',
      () => {
        const html =
          renderToStaticMarkup(
            <BusinessWorkspace />
          );

        expect(
          html
        ).toMatch(
          /aria-pressed="true"[^>]*>Balanced<\/button>/
        );
      }
    );

    it(
      'disables Lowest DIM weight when the DIM divisor is blank',
      () => {
        const html =
          renderToStaticMarkup(
            <BusinessWorkspace
              initialCartons={[
                carton({
                  externalLengthMm:
                    110,
                  externalWidthMm:
                    110,
                  externalHeightMm:
                    110,
                }),
              ]}
            />
          );

        expect(
          minDimButtonMarkup(
            html
          )
        ).toContain(
          'disabled=""'
        );
      }
    );

    it(
      'disables Lowest DIM weight when an available carton lacks external dimensions',
      () => {
        const html =
          renderToStaticMarkup(
            <BusinessWorkspace
              initialCartons={[
                carton(),
              ]}
              initialDimensionalWeight={
                dimensionalWeightValues()
              }
            />
          );

        expect(
          minDimButtonMarkup(
            html
          )
        ).toContain(
          'disabled=""'
        );
      }
    );

    it(
      'enables Lowest DIM weight when the divisor and all available-carton external dimensions are present',
      () => {
        const html =
          renderToStaticMarkup(
            <BusinessWorkspace
              initialCartons={[
                carton({
                  externalLengthMm:
                    110,
                  externalWidthMm:
                    110,
                  externalHeightMm:
                    110,
                }),
              ]}
              initialDimensionalWeight={
                dimensionalWeightValues()
              }
            />
          );

        expect(
          minDimButtonMarkup(
            html
          )
        ).not.toContain(
          'disabled=""'
        );
      }
    );

    it(
      'ignores zero-availability cartons when checking min-DIM objective readiness',
      () => {
        expect(
          isBusinessMinDimWeightObjectiveAvailable(
            [
              carton({
                id:
                  'available',
                externalLengthMm:
                  110,
                externalWidthMm:
                  110,
                externalHeightMm:
                  110,
              }),
              carton({
                id:
                  'out-of-stock',
                quantityAvailable:
                  0,
              }),
            ],
            dimensionalWeightValues()
          )
        ).toBe(true);
      }
    );

    it(
      'rejects invalid or missing min-DIM prerequisites in the readiness helper',
      () => {
        const completeCarton =
          carton({
            externalLengthMm:
              110,
            externalWidthMm:
              110,
            externalHeightMm:
              110,
          });

        expect(
          isBusinessMinDimWeightObjectiveAvailable(
            [
              completeCarton,
            ],
            dimensionalWeightValues({
              divisorValue:
                undefined,
            })
          )
        ).toBe(false);

        expect(
          isBusinessMinDimWeightObjectiveAvailable(
            [
              completeCarton,
            ],
            dimensionalWeightValues({
              divisorValue: 0,
            })
          )
        ).toBe(false);

        expect(
          isBusinessMinDimWeightObjectiveAvailable(
            [
              completeCarton,
            ],
            dimensionalWeightValues({
              divisorValue:
                Number.NaN,
            })
          )
        ).toBe(false);

        expect(
          isBusinessMinDimWeightObjectiveAvailable(
            [
              carton(),
            ],
            dimensionalWeightValues()
          )
        ).toBe(false);
      }
    );

    it(
      'supports an initial min-DIM objective when its prerequisites are present',
      () => {
        const html =
          renderToStaticMarkup(
            <BusinessWorkspace
              initialObjective="min-dim-weight"
              initialCartons={[
                carton({
                  externalLengthMm:
                    110,
                  externalWidthMm:
                    110,
                  externalHeightMm:
                    110,
                }),
              ]}
              initialDimensionalWeight={
                dimensionalWeightValues()
              }
            />
          );

        expect(
          html
        ).toMatch(
          /aria-pressed="true"[^>]*>Lowest DIM weight<\/button>/
        );

        expect(
          html
        ).toContain(
          'Prioritize lower total dimensional weight across verified candidates.'
        );
      }
    );

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
            [
              product(),
            ],
            [
              carton(),
            ],
            objective
          );

        expect(
          result.plan.status
        ).toBe(
          'feasible'
        );

        expect(
          result.plan.objective
            .kind
        ).toBe(
          objective
        );

        expect(
          result.plan.solverMeta
            .solverId
        ).toBe(
          'packmetry-baseline'
        );
      }
    );

    it(
      'passes min-dim-weight through the verified planning pipeline when prerequisites are complete',
      async () => {
        const result =
          await runBusinessWorkspace(
            [
              product(),
            ],
            [
              carton({
                externalLengthMm:
                  110,
                externalWidthMm:
                  110,
                externalHeightMm:
                  110,
              }),
            ],
            'min-dim-weight',
            dimensionalWeightSettings()
          );

        expect(
          result.plan.status
        ).toBe(
          'feasible'
        );

        expect(
          result.plan.objective
            .kind
        ).toBe(
          'min-dim-weight'
        );

        expect(
          result.plan.metrics
            .totalDimWeightG
        ).toBeDefined();

        expect(
          result.plan.solverMeta
            .solverId
        ).toBe(
          'packmetry-baseline'
        );
      }
    );

    it(
      'fails min-dim-weight early when no DIM divisor settings are supplied',
      async () => {
        await expect(
          runBusinessWorkspace(
            [
              product(),
            ],
            [
              carton({
                externalLengthMm:
                  110,
                externalWidthMm:
                  110,
                externalHeightMm:
                  110,
              }),
            ],
            'min-dim-weight'
          )
        ).rejects.toThrow(
          BUSINESS_MIN_DIM_DIVISOR_REQUIRED_MESSAGE
        );
      }
    );

    it(
      'fails min-dim-weight early when an available carton lacks external dimensions',
      async () => {
        await expect(
          runBusinessWorkspace(
            [
              product(),
            ],
            [
              carton(),
            ],
            'min-dim-weight',
            dimensionalWeightSettings()
          )
        ).rejects.toThrow(
          BUSINESS_MIN_DIM_EXTERNAL_DIMENSIONS_REQUIRED_MESSAGE
        );
      }
    );

    it(
      'does not expose objectives still intentionally deferred',
      () => {
        const html =
          renderToStaticMarkup(
            <BusinessWorkspace />
          );

        expect(
          html
        ).not.toContain(
          'Lowest carton cost'
        );

        expect(
          html
        ).not.toContain(
          'Easier to carry'
        );

        expect(
          html
        ).not.toContain(
          'Use existing inventory first'
        );
      }
    );

    it(
      'keeps the default runBusinessWorkspace objective backward compatible',
      async () => {
        const result =
          await runBusinessWorkspace(
            [
              product(),
            ],
            [
              carton(),
            ]
          );

        expect(
          result.plan.objective
            .kind
        ).toBe(
          'balanced'
        );
      }
    );
  }
);