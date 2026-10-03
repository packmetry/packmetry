import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import PlanAlternatives from '../components/PlanAlternatives.js';
import {
  runHaveBoxesWorkspaceItems,
  type WorkspaceCartonValues,
  type WorkspaceItemValues,
} from '../components/PackingWorkspace.js';

function item(): WorkspaceItemValues {
  return {
    id: 'workspace-item-1',
    name: 'Cube',
    lengthMm: 10,
    widthMm: 10,
    heightMm: 10,
    quantity: 2,
  };
}

function carton(
  id: string,
  size: number
): WorkspaceCartonValues {
  return {
    id,
    lengthMm: size,
    widthMm: size,
    heightMm: size,
    quantityAvailable: 2,
  };
}

async function runMultiCandidateWorkspace() {
  return runHaveBoxesWorkspaceItems(
    [item()],
    [
      carton('multi-small', 11),
      carton('multi-medium', 15),
      carton('multi-large', 20),
    ]
  );
}

describe(
  'PackingWorkspace personal plan alternatives',
  () => {
    it(
      'exposes ranked verified alternatives from the have-boxes workspace result',
      async () => {
        const result =
          await runMultiCandidateWorkspace();

        expect(
          result.plan.id
        ).toBe(
          'workspace-plan:have'
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
          await runMultiCandidateWorkspace();

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
              `workspace-plan:have:alternative:${index + 1}`
            );
          }
        );
      }
    );

    it(
      'keeps inventory usage tied to the recommended canonical plan',
      async () => {
        const result =
          await runMultiCandidateWorkspace();

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
      'passes workspace alternatives directly into the comparison component',
      async () => {
        const result =
          await runMultiCandidateWorkspace();

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