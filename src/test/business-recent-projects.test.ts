import {
  describe,
  expect,
  it,
} from 'vitest';

import {
  BUSINESS_RECENT_PROJECTS_DATABASE_NAME,
  BUSINESS_RECENT_PROJECTS_DATABASE_VERSION,
  BUSINESS_RECENT_PROJECTS_STORE_NAME,
  MAX_RECENT_BUSINESS_PROJECTS,
  createRecentBusinessProject,
  listRecentBusinessProjects,
  orderRecentBusinessProjects,
  saveRecentBusinessProject,
  type RecentBusinessProject,
  type RecentBusinessProjectInput,
} from '../browser/business-recent-projects.js';
import {
  BUSINESS_CARTON_LIBRARY_DATABASE_NAME,
} from '../browser/business-carton-library.js';

function projectInput(
  overrides:
    Partial<RecentBusinessProjectInput> = {}
): RecentBusinessProjectInput {
  return {
    id: 'business-project-1',
    name: 'October orders',
    products: [
      {
        id:
          'business-product-1',
        name:
          'Ceramic mug',
        sku:
          'MUG-001',
        lengthMm: 80,
        widthMm: 80,
        heightMm: 80,
        quantity: 12,
        unitWeightG: 500,
        rotationPolicy:
          'upright',
      },
    ],
    cartons: [
      {
        id:
          'business-carton-1',
        libraryId:
          'saved-carton-1',
        name:
          'Medium mailer',
        cartonCode:
          'BX-M',
        lengthMm: 400,
        widthMm: 300,
        heightMm: 200,
        externalLengthMm: 410,
        externalWidthMm: 310,
        externalHeightMm: 210,
        quantityAvailable: 15,
        maxGrossWeightG:
          12_000,
        emptyBoxWeightG:
          350,
        costPerBox:
          1.75,
      },
    ],
    objective:
      'fewest-cartons',
    dimensionalWeight: {
      divisorValue: 5000,
      lengthUnit: 'cm',
      massUnit: 'kg',
    },
    ...overrides,
  };
}

function recentProject(
  savedAt: number,
  overrides:
    Partial<RecentBusinessProjectInput> = {}
): RecentBusinessProject {
  return createRecentBusinessProject(
    projectInput(
      overrides
    ),
    savedAt
  );
}

describe(
  'Business recent projects',
  () => {
    it(
      'uses a dedicated IndexedDB schema for Business projects',
      () => {
        expect(
          BUSINESS_RECENT_PROJECTS_DATABASE_NAME
        ).toBe(
          'packmetry-business-projects'
        );

        expect(
          BUSINESS_RECENT_PROJECTS_DATABASE_VERSION
        ).toBe(1);

        expect(
          BUSINESS_RECENT_PROJECTS_STORE_NAME
        ).toBe(
          'recent-projects'
        );

        expect(
          BUSINESS_RECENT_PROJECTS_DATABASE_NAME
        ).not.toBe(
          BUSINESS_CARTON_LIBRARY_DATABASE_NAME
        );
      }
    );

    it(
      'uses a bounded recent-project history',
      () => {
        expect(
          MAX_RECENT_BUSINESS_PROJECTS
        ).toBe(10);
      }
    );

    it(
      'creates a complete Business workspace snapshot',
      () => {
        const input =
          projectInput();

        const project =
          createRecentBusinessProject(
            input,
            123
          );

        expect(
          project
        ).toEqual({
          ...input,
          products: [
            {
              ...input.products[0],
            },
          ],
          cartons: [
            {
              ...input.cartons[0],
            },
          ],
          dimensionalWeight: {
            ...input.dimensionalWeight!,
          },
          savedAt: 123,
        });
      }
    );

    it(
      'preserves external carton dimensions independently from internal dimensions',
      () => {
        const project =
          createRecentBusinessProject(
            projectInput(),
            123
          );

        const carton =
          project.cartons[0];

        expect(
          carton?.lengthMm
        ).toBe(400);

        expect(
          carton?.widthMm
        ).toBe(300);

        expect(
          carton?.heightMm
        ).toBe(200);

        expect(
          carton?.externalLengthMm
        ).toBe(410);

        expect(
          carton?.externalWidthMm
        ).toBe(310);

        expect(
          carton?.externalHeightMm
        ).toBe(210);
      }
    );

    it(
      'preserves dimensional-weight divisor and unit semantics',
      () => {
        const project =
          createRecentBusinessProject(
            projectInput(),
            123
          );

        expect(
          project.dimensionalWeight
        ).toEqual({
          divisorValue: 5000,
          lengthUnit: 'cm',
          massUnit: 'kg',
        });
      }
    );

    it(
      'copies project arrays, records, and dimensional-weight settings instead of retaining caller references',
      () => {
        const input =
          projectInput();

        const project =
          createRecentBusinessProject(
            input,
            123
          );

        expect(
          project.products
        ).not.toBe(
          input.products
        );

        expect(
          project.cartons
        ).not.toBe(
          input.cartons
        );

        expect(
          project.products[0]
        ).not.toBe(
          input.products[0]
        );

        expect(
          project.cartons[0]
        ).not.toBe(
          input.cartons[0]
        );

        expect(
          project.dimensionalWeight
        ).not.toBe(
          input.dimensionalWeight
        );
      }
    );

    it(
      'preserves missing optional Business values as unknown',
      () => {
        const base =
          projectInput();

        const project =
          createRecentBusinessProject(
            projectInput({
              products: [
                {
                  ...base.products[0]!,
                  unitWeightG:
                    undefined,
                  rotationPolicy:
                    undefined,
                },
              ],
              cartons: [
                {
                  ...base.cartons[0]!,
                  libraryId:
                    undefined,
                  externalLengthMm:
                    undefined,
                  externalWidthMm:
                    undefined,
                  externalHeightMm:
                    undefined,
                  maxGrossWeightG:
                    undefined,
                  emptyBoxWeightG:
                    undefined,
                  costPerBox:
                    undefined,
                },
              ],
              dimensionalWeight:
                undefined,
            }),
            123
          );

        expect(
          project.products[0]
            ?.unitWeightG
        ).toBeUndefined();

        expect(
          project.products[0]
            ?.rotationPolicy
        ).toBeUndefined();

        expect(
          project.cartons[0]
            ?.libraryId
        ).toBeUndefined();

        expect(
          project.cartons[0]
            ?.externalLengthMm
        ).toBeUndefined();

        expect(
          project.cartons[0]
            ?.externalWidthMm
        ).toBeUndefined();

        expect(
          project.cartons[0]
            ?.externalHeightMm
        ).toBeUndefined();

        expect(
          project.cartons[0]
            ?.maxGrossWeightG
        ).toBeUndefined();

        expect(
          project.cartons[0]
            ?.emptyBoxWeightG
        ).toBeUndefined();

        expect(
          project.cartons[0]
            ?.costPerBox
        ).toBeUndefined();

        expect(
          project.dimensionalWeight
        ).toBeUndefined();
      }
    );

    it(
      'preserves a blank divisor without inventing a numeric carrier default',
      () => {
        const project =
          createRecentBusinessProject(
            projectInput({
              dimensionalWeight: {
                divisorValue:
                  undefined,
                lengthUnit: 'in',
                massUnit: 'lb',
              },
            }),
            123
          );

        expect(
          project.dimensionalWeight
        ).toEqual({
          divisorValue:
            undefined,
          lengthUnit: 'in',
          massUnit: 'lb',
        });
      }
    );

    it(
      'does not infer external dimensions from internal dimensions',
      () => {
        const base =
          projectInput();

        const project =
          createRecentBusinessProject(
            projectInput({
              cartons: [
                {
                  ...base.cartons[0]!,
                  externalLengthMm:
                    undefined,
                  externalWidthMm:
                    undefined,
                  externalHeightMm:
                    undefined,
                },
              ],
            }),
            123
          );

        const carton =
          project.cartons[0];

        expect(
          carton?.externalLengthMm
        ).toBeUndefined();

        expect(
          carton?.externalWidthMm
        ).toBeUndefined();

        expect(
          carton?.externalHeightMm
        ).toBeUndefined();

        expect(
          carton?.lengthMm
        ).toBe(400);

        expect(
          carton?.widthMm
        ).toBe(300);

        expect(
          carton?.heightMm
        ).toBe(200);
      }
    );

    it(
      'preserves the supported Business objective and handling selections',
      () => {
        const base =
          projectInput();

        const project =
          createRecentBusinessProject(
            projectInput({
              objective:
                'least-wasted-volume',
              products: [
                {
                  ...base.products[0]!,
                  rotationPolicy:
                    'fixed',
                },
              ],
            }),
            123
          );

        expect(
          project.objective
        ).toBe(
          'least-wasted-volume'
        );

        expect(
          project.products[0]
            ?.rotationPolicy
        ).toBe(
          'fixed'
        );
      }
    );

    it(
      'orders recent projects newest first',
      () => {
        const ordered =
          orderRecentBusinessProjects([
            recentProject(
              10,
              {
                id: 'old',
              }
            ),
            recentProject(
              30,
              {
                id: 'newest',
              }
            ),
            recentProject(
              20,
              {
                id: 'middle',
              }
            ),
          ]);

        expect(
          ordered.map(
            project =>
              project.id
          )
        ).toEqual([
          'newest',
          'middle',
          'old',
        ]);
      }
    );

    it(
      'keeps only the newest snapshot for the same project id',
      () => {
        const ordered =
          orderRecentBusinessProjects([
            recentProject(
              10,
              {
                id:
                  'same-project',
                name:
                  'Older name',
              }
            ),
            recentProject(
              20,
              {
                id:
                  'same-project',
                name:
                  'Updated name',
              }
            ),
          ]);

        expect(
          ordered
        ).toHaveLength(1);

        expect(
          ordered[0]?.name
        ).toBe(
          'Updated name'
        );

        expect(
          ordered[0]?.savedAt
        ).toBe(20);
      }
    );

    it(
      'limits recent projects to the configured maximum',
      () => {
        const projects =
          Array.from(
            {
              length:
                MAX_RECENT_BUSINESS_PROJECTS +
                4,
            },
            (
              _value,
              index
            ) =>
              recentProject(
                index,
                {
                  id:
                    `project-${index}`,
                }
              )
          );

        const ordered =
          orderRecentBusinessProjects(
            projects
          );

        expect(
          ordered
        ).toHaveLength(
          MAX_RECENT_BUSINESS_PROJECTS
        );

        expect(
          ordered[0]?.id
        ).toBe(
          `project-${
            MAX_RECENT_BUSINESS_PROJECTS +
            3
          }`
        );
      }
    );

    it(
      'does not mutate the caller array while ordering',
      () => {
        const projects = [
          recentProject(
            10,
            {
              id: 'first',
            }
          ),
          recentProject(
            20,
            {
              id: 'second',
            }
          ),
        ];

        const snapshot = [
          ...projects,
        ];

        orderRecentBusinessProjects(
          projects
        );

        expect(
          projects
        ).toEqual(
          snapshot
        );

        expect(
          projects[0]
        ).toBe(
          snapshot[0]
        );
      }
    );

    it(
      'returns false when IndexedDB is explicitly unavailable for saving',
      async () => {
        await expect(
          saveRecentBusinessProject(
            projectInput(),
            null
          )
        ).resolves.toBe(false);
      }
    );

    it(
      'returns an empty history when IndexedDB is explicitly unavailable',
      async () => {
        await expect(
          listRecentBusinessProjects(
            null
          )
        ).resolves.toEqual([]);
      }
    );
  }
);