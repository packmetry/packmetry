import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import {
  runBusinessWorkspace,
  type BusinessCartonValues,
  type BusinessProductValues,
} from '../components/BusinessWorkspace.js';
import PlanAlternatives from '../components/PlanAlternatives.js';

function product(): BusinessProductValues {
  return {
    id: 'business-product-1',
    name: 'Cube',
    sku: 'CUBE-001',
    lengthMm: 10,
    widthMm: 10,
    heightMm: 10,
    quantity: 2,
    unitWeightG: undefined,
    rotationPolicy: 'any',
  };
}

function carton(
  id: string,
  size: number
): BusinessCartonValues {
  return {
    id,
    name: id,
    cartonCode: id.toUpperCase(),
    lengthMm: size,
    widthMm: size,
    heightMm: size,
    quantityAvailable: 2,
    maxGrossWeightG: undefined,
    emptyBoxWeightG: undefined,
    costPerBox: undefined,
  };
}

function cartons(): BusinessCartonValues[] {
  return [
    carton('multi-small', 11),
    carton('multi-medium', 15),
    carton('multi-large', 20),
  ];
}

async function runMultiCandidateBusiness(
  objective:
    | 'balanced'
    | 'fewest-cartons'
    | 'least-wasted-volume' = 'balanced'
) {
  return runBusinessWorkspace(
    [product()],
    cartons(),
    objective
  );
}

describe(
  'BusinessWorkspace plan alternatives',
  () => {
    it(
      'exposes ranked verified alternatives from the business planning result',
      async () => {
        const result =
          await runMultiCandidateBusiness();

        expect(
          result.plan.id
        ).toBe(
          'business-workspace-plan:have'
        );

        expect(
          result.alternatives.length
        ).toBeGreaterThan(
          0
        );
      }
    );

    it(
      'keeps the recommended plan separate from deterministic alternative ids',
      async () => {
        const result =
          await runMultiCandidateBusiness();

        expect(
          result.alternatives.some(
            alternative =>
              alternative.id ===
              result.plan.id
          )
        ).toBe(false);

        result.alternatives.forEach(
          (
            alternative,
            index
          ) => {
            expect(
              alternative.id
            ).toBe(
              `business-workspace-plan:have:alternative:${index + 1}`
            );
          }
        );
      }
    );

    it(
      'lets the selected objective change which verified plan is recommended',
      async () => {
        const balanced =
          await runMultiCandidateBusiness(
            'balanced'
          );

        const leastWasted =
          await runMultiCandidateBusiness(
            'least-wasted-volume'
          );

        expect(
          balanced.plan.objective.kind
        ).toBe('balanced');

        expect(
          leastWasted.plan.objective.kind
        ).toBe(
          'least-wasted-volume'
        );

        expect(
          balanced.plan.metrics
            .cartonCount
        ).toBe(1);

        expect(
          leastWasted.plan.metrics
            .cartonCount
        ).toBe(2);

        expect(
          leastWasted.plan.metrics
            .emptyVolumeMm3
        ).toBeLessThan(
          balanced.plan.metrics
            .emptyVolumeMm3
        );

        expect(
          balanced.alternatives.length
        ).toBeGreaterThan(0);

        expect(
          leastWasted.alternatives.length
        ).toBeGreaterThan(0);
      }
    );

    it(
      'keeps inventory usage tied to the recommended canonical business plan',
      async () => {
        const result =
          await runMultiCandidateBusiness(
            'balanced'
          );

        expect(
          result.inventoryUsage
            .usedCartons.map(
              entry => ({
                cartonId:
                  entry.cartonId,
                usedQuantity:
                  entry.usedQuantity,
              })
            )
        ).toEqual([
          {
            cartonId:
              'multi-large',
            usedQuantity: 1,
          },
        ]);

        expect(
          result.inventoryUsage
            .unusedCartons.map(
              entry =>
                entry.cartonId
            )
        ).toEqual([
          'multi-small',
          'multi-medium',
        ]);

        const alternativeCartonIds =
          new Set(
            result.alternatives.flatMap(
              alternative =>
                alternative.cartons.map(
                  packedCarton =>
                    packedCarton
                      .carton.id
                )
            )
          );

        expect(
          [
            ...alternativeCartonIds,
          ].some(
            cartonId =>
              cartonId !==
              'multi-large'
          )
        ).toBe(true);
      }
    );

    it(
      'passes business alternatives directly into the shared comparison component',
      async () => {
        const result =
          await runMultiCandidateBusiness();

        const html =
          renderToStaticMarkup(
            <PlanAlternatives
              selectedPlan={
                result.plan
              }
              alternatives={
                result.alternatives
              }
              activePlanId={
                result.plan.id
              }
              onSelectPlan={() => {}}
            />
          );

        expect(
          html
        ).toContain(
          'Packing alternatives'
        );

        expect(
          html
        ).toContain(
          'Compare verified plans'
        );

        expect(
          html
        ).toContain(
          'Recommended'
        );

        expect(
          html
        ).toContain(
          'Alternative 1'
        );
      }
    );
  }
);