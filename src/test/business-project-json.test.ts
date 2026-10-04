import {
  describe,
  expect,
  it,
} from 'vitest';

import {
  BUSINESS_PROJECT_JSON_FORMAT,
  BUSINESS_PROJECT_JSON_VERSION,
  createBusinessProjectJsonDocument,
  parseBusinessProjectJson,
  serializeBusinessProjectJson,
} from '../browser/business-project-json.js';
import {
  createRecentBusinessProject,
  type RecentBusinessProject,
  type RecentBusinessProjectInput,
} from '../browser/business-recent-projects.js';

function projectInput(
  overrides:
    Partial<RecentBusinessProjectInput> = {}
): RecentBusinessProjectInput {
  return {
    id:
      'business-project-7',
    name:
      'October orders',
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
        heightMm: 95,
        quantity: 12,
        unitWeightG: 500,
        rotationPolicy:
          'upright',
      },
      {
        id:
          'business-product-2',
        name:
          'Gift box',
        sku: '',
        lengthMm: 120,
        widthMm: 90,
        heightMm: 40,
        quantity: 3,
        unitWeightG:
          undefined,
        rotationPolicy:
          'fixed',
      },
    ],
    cartons: [
      {
        id:
          'business-carton-1',
        libraryId:
          'saved-carton-2',
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
      {
        id:
          'business-carton-2',
        name: '',
        cartonCode: '',
        lengthMm: 500,
        widthMm: 400,
        heightMm: 300,
        quantityAvailable: 2,
        maxGrossWeightG:
          undefined,
        emptyBoxWeightG:
          undefined,
        costPerBox:
          undefined,
      },
    ],
    objective:
      'least-wasted-volume',
    dimensionalWeight: {
      divisorValue: 5000,
      lengthUnit: 'cm',
      massUnit: 'kg',
    },
    ...overrides,
  };
}

function project(
  overrides:
    Partial<RecentBusinessProjectInput> = {}
): RecentBusinessProject {
  return createRecentBusinessProject(
    projectInput(
      overrides
    ),
    1_760_000_000_000
  );
}

function documentFor(
  projectValue:
    RecentBusinessProject
): Record<string, unknown> {
  return {
    format:
      BUSINESS_PROJECT_JSON_FORMAT,
    version:
      BUSINESS_PROJECT_JSON_VERSION,
    project:
      projectValue,
  };
}

describe(
  'Business project JSON',
  () => {
    it(
      'uses a stable versioned Packmetry Business project format',
      () => {
        expect(
          BUSINESS_PROJECT_JSON_FORMAT
        ).toBe(
          'packmetry.business.project'
        );

        expect(
          BUSINESS_PROJECT_JSON_VERSION
        ).toBe(1);
      }
    );

    it(
      'creates a versioned document around a validated project snapshot',
      () => {
        const source =
          project();

        const document =
          createBusinessProjectJsonDocument(
            source
          );

        expect(
          document
        ).toEqual({
          format:
            'packmetry.business.project',
          version: 1,
          project: source,
        });

        expect(
          document.project
        ).not.toBe(
          source
        );

        expect(
          document.project.products
        ).not.toBe(
          source.products
        );

        expect(
          document.project.cartons
        ).not.toBe(
          source.cartons
        );

        expect(
          document.project
            .dimensionalWeight
        ).not.toBe(
          source.dimensionalWeight
        );
      }
    );

    it(
      'serializes a complete Business project as readable JSON',
      () => {
        const serialized =
          serializeBusinessProjectJson(
            project()
          );

        const parsed =
          JSON.parse(
            serialized
          ) as Record<
            string,
            unknown
          >;

        expect(
          serialized
        ).toContain(
          '\n  "format": "packmetry.business.project"'
        );

        expect(
          parsed.format
        ).toBe(
          'packmetry.business.project'
        );

        expect(
          parsed.version
        ).toBe(1);

        expect(
          parsed
        ).toHaveProperty(
          'project'
        );

        expect(
          serialized
        ).toContain(
          '"dimensionalWeight"'
        );
      }
    );

    it(
      'round-trips the complete Business project snapshot',
      () => {
        const source =
          project();

        const result =
          parseBusinessProjectJson(
            serializeBusinessProjectJson(
              source
            )
          );

        expect(
          result
        ).toEqual({
          ok: true,
          project: source,
        });

        if (!result.ok) {
          throw new Error(
            'Expected project JSON to parse.'
          );
        }

        expect(
          result.project
        ).not.toBe(
          source
        );

        expect(
          result.project.products
        ).not.toBe(
          source.products
        );

        expect(
          result.project.cartons
        ).not.toBe(
          source.cartons
        );

        expect(
          result.project
            .dimensionalWeight
        ).not.toBe(
          source.dimensionalWeight
        );
      }
    );

    it(
      'round-trips external carton dimensions independently from internal dimensions',
      () => {
        const source =
          project();

        const result =
          parseBusinessProjectJson(
            serializeBusinessProjectJson(
              source
            )
          );

        expect(
          result.ok
        ).toBe(true);

        if (!result.ok) {
          throw new Error(
            'Expected external carton dimensions to parse.'
          );
        }

        const carton =
          result.project
            .cartons[0];

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
          carton
            ?.externalLengthMm
        ).toBe(410);

        expect(
          carton
            ?.externalWidthMm
        ).toBe(310);

        expect(
          carton
            ?.externalHeightMm
        ).toBe(210);
      }
    );

    it(
      'round-trips dimensional-weight divisor and units',
      () => {
        const source =
          project({
            dimensionalWeight: {
              divisorValue: 139,
              lengthUnit: 'in',
              massUnit: 'lb',
            },
          });

        const result =
          parseBusinessProjectJson(
            serializeBusinessProjectJson(
              source
            )
          );

        expect(
          result.ok
        ).toBe(true);

        if (!result.ok) {
          throw new Error(
            'Expected dimensional-weight settings to parse.'
          );
        }

        expect(
          result.project
            .dimensionalWeight
        ).toEqual({
          divisorValue: 139,
          lengthUnit: 'in',
          massUnit: 'lb',
        });
      }
    );

    it(
      'round-trips missing optional Business values without inventing defaults',
      () => {
        const source =
          project({
            products: [
              {
                id:
                  'business-product-1',
                name: '',
                sku: '',
                lengthMm: 80,
                widthMm: 80,
                heightMm: 80,
                quantity: 1,
                unitWeightG:
                  undefined,
              },
            ],
            cartons: [
              {
                id:
                  'business-carton-1',
                name: '',
                cartonCode: '',
                lengthMm: 100,
                widthMm: 100,
                heightMm: 100,
                quantityAvailable: 0,
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
          });

        const result =
          parseBusinessProjectJson(
            serializeBusinessProjectJson(
              source
            )
          );

        expect(
          result.ok
        ).toBe(true);

        if (!result.ok) {
          throw new Error(
            'Expected optional values to parse.'
          );
        }

        expect(
          result.project.products[0]
            ?.unitWeightG
        ).toBeUndefined();

        expect(
          result.project.products[0]
            ?.rotationPolicy
        ).toBeUndefined();

        expect(
          result.project.cartons[0]
            ?.libraryId
        ).toBeUndefined();

        expect(
          result.project.cartons[0]
            ?.externalLengthMm
        ).toBeUndefined();

        expect(
          result.project.cartons[0]
            ?.externalWidthMm
        ).toBeUndefined();

        expect(
          result.project.cartons[0]
            ?.externalHeightMm
        ).toBeUndefined();

        expect(
          result.project.cartons[0]
            ?.maxGrossWeightG
        ).toBeUndefined();

        expect(
          result.project.cartons[0]
            ?.emptyBoxWeightG
        ).toBeUndefined();

        expect(
          result.project.cartons[0]
            ?.costPerBox
        ).toBeUndefined();

        expect(
          result.project
            .dimensionalWeight
        ).toBeUndefined();
      }
    );

    it(
      'accepts an existing version-1 project that has no dimensional-weight field',
      () => {
        const source =
          project({
            dimensionalWeight:
              undefined,
          });

        const document =
          documentFor(
            source
          );

        const projectRecord =
          document.project as
            Record<
              string,
              unknown
            >;

        delete projectRecord
          .dimensionalWeight;

        const result =
          parseBusinessProjectJson(
            JSON.stringify(
              document
            )
          );

        expect(
          result.ok
        ).toBe(true);

        if (!result.ok) {
          throw new Error(
            'Expected legacy version-1 project to parse.'
          );
        }

        expect(
          result.project
            .dimensionalWeight
        ).toBeUndefined();
      }
    );

    it(
      'round-trips a blank DIM divisor without inventing a carrier default',
      () => {
        const source =
          project({
            dimensionalWeight: {
              divisorValue:
                undefined,
              lengthUnit: 'in',
              massUnit: 'lb',
            },
          });

        const result =
          parseBusinessProjectJson(
            serializeBusinessProjectJson(
              source
            )
          );

        expect(
          result.ok
        ).toBe(true);

        if (!result.ok) {
          throw new Error(
            'Expected blank DIM divisor settings to parse.'
          );
        }

        expect(
          result.project
            .dimensionalWeight
        ).toEqual({
          divisorValue:
            undefined,
          lengthUnit: 'in',
          massUnit: 'lb',
        });
      }
    );

    it(
      'does not infer external carton dimensions from internal dimensions',
      () => {
        const source =
          project({
            cartons: [
              {
                id:
                  'business-carton-1',
                name:
                  'Internal only',
                cartonCode:
                  'INT-1',
                lengthMm: 100,
                widthMm: 90,
                heightMm: 80,
                quantityAvailable: 1,
                maxGrossWeightG:
                  undefined,
                emptyBoxWeightG:
                  undefined,
                costPerBox:
                  undefined,
              },
            ],
          });

        const result =
          parseBusinessProjectJson(
            serializeBusinessProjectJson(
              source
            )
          );

        expect(
          result.ok
        ).toBe(true);

        if (!result.ok) {
          throw new Error(
            'Expected internal-only carton to parse.'
          );
        }

        const carton =
          result.project
            .cartons[0];

        expect(
          carton?.lengthMm
        ).toBe(100);

        expect(
          carton?.widthMm
        ).toBe(90);

        expect(
          carton?.heightMm
        ).toBe(80);

        expect(
          carton
            ?.externalLengthMm
        ).toBeUndefined();

        expect(
          carton
            ?.externalWidthMm
        ).toBeUndefined();

        expect(
          carton
            ?.externalHeightMm
        ).toBeUndefined();
      }
    );

    it(
      'preserves every supported objective and handling policy',
      () => {
        const cases = [
          {
            objective:
              'balanced' as const,
            rotationPolicy:
              'any' as const,
          },
          {
            objective:
              'fewest-cartons' as const,
            rotationPolicy:
              'upright' as const,
          },
          {
            objective:
              'least-wasted-volume' as const,
            rotationPolicy:
              'fixed' as const,
          },
        ];

        for (
          const testCase of cases
        ) {
          const base =
            projectInput();

          const source =
            project({
              objective:
                testCase.objective,
              products: [
                {
                  ...base
                    .products[0]!,
                  rotationPolicy:
                    testCase.rotationPolicy,
                },
              ],
            });

          const result =
            parseBusinessProjectJson(
              serializeBusinessProjectJson(
                source
              )
            );

          expect(
            result.ok
          ).toBe(true);

          if (!result.ok) {
            throw new Error(
              'Expected supported values to parse.'
            );
          }

          expect(
            result.project
              .objective
          ).toBe(
            testCase.objective
          );

          expect(
            result.project
              .products[0]
              ?.rotationPolicy
          ).toBe(
            testCase.rotationPolicy
          );
        }
      }
    );

    it(
      'rejects malformed JSON without throwing',
      () => {
        expect(
          parseBusinessProjectJson(
            '{"format":'
          )
        ).toEqual({
          ok: false,
          error: {
            code:
              'invalid-json',
            message:
              'The selected file is not valid JSON.',
          },
        });
      }
    );

    it(
      'rejects non-object JSON and unrelated JSON formats',
      () => {
        expect(
          parseBusinessProjectJson(
            '[]'
          )
        ).toMatchObject({
          ok: false,
          error: {
            code:
              'invalid-format',
          },
        });

        expect(
          parseBusinessProjectJson(
            JSON.stringify({
              format:
                'other.project',
              version: 1,
              project:
                project(),
            })
          )
        ).toMatchObject({
          ok: false,
          error: {
            code:
              'invalid-format',
          },
        });
      }
    );

    it(
      'rejects a missing or non-integer format version',
      () => {
        expect(
          parseBusinessProjectJson(
            JSON.stringify({
              format:
                BUSINESS_PROJECT_JSON_FORMAT,
              project:
                project(),
            })
          )
        ).toMatchObject({
          ok: false,
          error: {
            code:
              'invalid-format',
          },
        });

        expect(
          parseBusinessProjectJson(
            JSON.stringify({
              format:
                BUSINESS_PROJECT_JSON_FORMAT,
              version: 1.5,
              project:
                project(),
            })
          )
        ).toMatchObject({
          ok: false,
          error: {
            code:
              'invalid-format',
          },
        });
      }
    );

    it(
      'rejects unsupported future or stale versions explicitly',
      () => {
        for (
          const version of [
            0,
            2,
          ]
        ) {
          const result =
            parseBusinessProjectJson(
              JSON.stringify({
                format:
                  BUSINESS_PROJECT_JSON_FORMAT,
                version,
                project:
                  project(),
              })
            );

          expect(
            result
          ).toMatchObject({
            ok: false,
            error: {
              code:
                'unsupported-version',
            },
          });
        }
      }
    );

    it(
      'rejects a malformed project object',
      () => {
        const invalid =
          documentFor(
            project()
          );

        invalid.project = {
          name:
            'No project id',
        };

        expect(
          parseBusinessProjectJson(
            JSON.stringify(
              invalid
            )
          )
        ).toMatchObject({
          ok: false,
          error: {
            code:
              'invalid-project',
          },
        });
      }
    );

    it(
      'rejects blank project identity or name',
      () => {
        for (
          const invalidProject of [
            project({
              id: '   ',
            }),
            project({
              name: '   ',
            }),
          ]
        ) {
          expect(
            parseBusinessProjectJson(
              JSON.stringify(
                documentFor(
                  invalidProject
                )
              )
            )
          ).toMatchObject({
            ok: false,
            error: {
              code:
                'invalid-project',
            },
          });
        }
      }
    );

    it(
      'rejects unsupported objectives instead of coercing them',
      () => {
        const invalid =
          documentFor(
            project()
          );

        (
          invalid.project as
            Record<string, unknown>
        ).objective =
          'lowest-cost';

        expect(
          parseBusinessProjectJson(
            JSON.stringify(
              invalid
            )
          )
        ).toMatchObject({
          ok: false,
          error: {
            code:
              'invalid-project',
          },
        });
      }
    );

    it(
      'rejects unsupported handling policies instead of widening Business semantics',
      () => {
        const invalid =
          documentFor(
            project()
          );

        const projectRecord =
          invalid.project as
            Record<string, unknown>;

        const products =
          projectRecord.products as
            Record<string, unknown>[];

        products[0]!.rotationPolicy =
          'vertical-axis-only';

        expect(
          parseBusinessProjectJson(
            JSON.stringify(
              invalid
            )
          )
        ).toMatchObject({
          ok: false,
          error: {
            code:
              'invalid-project',
          },
        });
      }
    );

    it(
      'rejects numeric strings instead of coercing them',
      () => {
        const invalid =
          documentFor(
            project()
          );

        const projectRecord =
          invalid.project as
            Record<string, unknown>;

        const products =
          projectRecord.products as
            Record<string, unknown>[];

        products[0]!.lengthMm =
          '80';

        expect(
          parseBusinessProjectJson(
            JSON.stringify(
              invalid
            )
          )
        ).toMatchObject({
          ok: false,
          error: {
            code:
              'invalid-project',
          },
        });
      }
    );

    it(
      'rejects non-positive dimensions and invalid product quantity',
      () => {
        const base =
          project();

        const invalidCases: Array<
          Record<string, unknown>
        > = [
          {
            ...base.products[0]!,
            lengthMm: 0,
          },
          {
            ...base.products[0]!,
            widthMm: -1,
          },
          {
            ...base.products[0]!,
            heightMm: 0,
          },
          {
            ...base.products[0]!,
            quantity: 0,
          },
          {
            ...base.products[0]!,
            quantity: 1.5,
          },
        ];

        for (
          const invalidProduct of
            invalidCases
        ) {
          const invalid =
            documentFor(
              project()
            );

          (
            invalid.project as
              Record<string, unknown>
          ).products = [
            invalidProduct,
          ];

          expect(
            parseBusinessProjectJson(
              JSON.stringify(
                invalid
              )
            )
          ).toMatchObject({
            ok: false,
            error: {
              code:
                'invalid-project',
            },
          });
        }
      }
    );

    it(
      'rejects invalid carton quantities, weights, and costs',
      () => {
        const base =
          project();

        const invalidCases: Array<
          Record<string, unknown>
        > = [
          {
            ...base.cartons[0]!,
            quantityAvailable:
              -1,
          },
          {
            ...base.cartons[0]!,
            quantityAvailable:
              1.5,
          },
          {
            ...base.cartons[0]!,
            maxGrossWeightG:
              0,
          },
          {
            ...base.cartons[0]!,
            emptyBoxWeightG:
              -1,
          },
          {
            ...base.cartons[0]!,
            costPerBox:
              -0.01,
          },
        ];

        for (
          const invalidCarton of
            invalidCases
        ) {
          const invalid =
            documentFor(
              project()
            );

          (
            invalid.project as
              Record<string, unknown>
          ).cartons = [
            invalidCarton,
          ];

          expect(
            parseBusinessProjectJson(
              JSON.stringify(
                invalid
              )
            )
          ).toMatchObject({
            ok: false,
            error: {
              code:
                'invalid-project',
            },
          });
        }
      }
    );

    it(
      'rejects invalid external carton dimensions',
      () => {
        const base =
          project();

        const invalidCases: Array<
          Record<string, unknown>
        > = [
          {
            ...base.cartons[0]!,
            externalLengthMm: 0,
          },
          {
            ...base.cartons[0]!,
            externalWidthMm: -1,
          },
          {
            ...base.cartons[0]!,
            externalHeightMm: 0,
          },
          {
            ...base.cartons[0]!,
            externalLengthMm:
              '410',
          },
        ];

        for (
          const invalidCarton of
            invalidCases
        ) {
          const invalid =
            documentFor(
              project()
            );

          (
            invalid.project as
              Record<string, unknown>
          ).cartons = [
            invalidCarton,
          ];

          expect(
            parseBusinessProjectJson(
              JSON.stringify(
                invalid
              )
            )
          ).toMatchObject({
            ok: false,
            error: {
              code:
                'invalid-project',
            },
          });
        }
      }
    );

    it(
      'rejects partial external carton dimensions',
      () => {
        const base =
          project();

        const cases: Array<
          Record<string, unknown>
        > = [
          {
            ...base.cartons[0]!,
            externalWidthMm:
              undefined,
          },
          {
            ...base.cartons[0]!,
            externalLengthMm:
              undefined,
          },
          {
            ...base.cartons[0]!,
            externalHeightMm:
              undefined,
          },
        ];

        for (
          const invalidCarton of
            cases
        ) {
          const invalid =
            documentFor(
              project()
            );

          (
            invalid.project as
              Record<string, unknown>
          ).cartons = [
            invalidCarton,
          ];

          expect(
            parseBusinessProjectJson(
              JSON.stringify(
                invalid
              )
            )
          ).toMatchObject({
            ok: false,
            error: {
              code:
                'invalid-project',
            },
          });
        }
      }
    );

    it(
      'rejects invalid dimensional-weight divisor values',
      () => {
        const invalidCases: unknown[] = [
          0,
          -1,
          '5000',
          null,
        ];

        for (
          const divisorValue of
            invalidCases
        ) {
          const invalid =
            documentFor(
              project()
            );

          const projectRecord =
            invalid.project as
              Record<
                string,
                unknown
              >;

          projectRecord
            .dimensionalWeight = {
              divisorValue,
              lengthUnit: 'cm',
              massUnit: 'kg',
            };

          expect(
            parseBusinessProjectJson(
              JSON.stringify(
                invalid
              )
            )
          ).toMatchObject({
            ok: false,
            error: {
              code:
                'invalid-project',
            },
          });
        }
      }
    );

    it(
      'rejects unsupported dimensional-weight units',
      () => {
        const invalidCases = [
          {
            divisorValue: 5000,
            lengthUnit:
              'yards',
            massUnit: 'kg',
          },
          {
            divisorValue: 5000,
            lengthUnit: 'cm',
            massUnit:
              'stone',
          },
          {
            divisorValue: 5000,
            lengthUnit: 123,
            massUnit: 'kg',
          },
          {
            divisorValue: 5000,
            lengthUnit: 'cm',
            massUnit: 123,
          },
        ];

        for (
          const dimensionalWeight of
            invalidCases
        ) {
          const invalid =
            documentFor(
              project()
            );

          (
            invalid.project as
              Record<
                string,
                unknown
              >
          ).dimensionalWeight =
            dimensionalWeight;

          expect(
            parseBusinessProjectJson(
              JSON.stringify(
                invalid
              )
            )
          ).toMatchObject({
            ok: false,
            error: {
              code:
                'invalid-project',
            },
          });
        }
      }
    );

    it(
      'rejects null or malformed dimensional-weight settings rather than treating them as missing',
      () => {
        const invalidCases:
          unknown[] = [
            null,
            5000,
            '5000',
            [],
            {},
            {
              divisorValue: 5000,
              massUnit: 'kg',
            },
            {
              divisorValue: 5000,
              lengthUnit: 'cm',
            },
          ];

        for (
          const dimensionalWeight of
            invalidCases
        ) {
          const invalid =
            documentFor(
              project()
            );

          (
            invalid.project as
              Record<
                string,
                unknown
              >
          ).dimensionalWeight =
            dimensionalWeight;

          expect(
            parseBusinessProjectJson(
              JSON.stringify(
                invalid
              )
            )
          ).toMatchObject({
            ok: false,
            error: {
              code:
                'invalid-project',
            },
          });
        }
      }
    );

    it(
      'rejects null optional values rather than treating them as missing',
      () => {
        const invalid =
          documentFor(
            project()
          );

        const projectRecord =
          invalid.project as
            Record<string, unknown>;

        const products =
          projectRecord.products as
            Record<string, unknown>[];

        products[0]!.unitWeightG =
          null;

        expect(
          parseBusinessProjectJson(
            JSON.stringify(
              invalid
            )
          )
        ).toMatchObject({
          ok: false,
          error: {
            code:
              'invalid-project',
          },
        });
      }
    );

    it(
      'rejects null external carton dimensions rather than treating them as missing',
      () => {
        const invalid =
          documentFor(
            project()
          );

        const projectRecord =
          invalid.project as
            Record<string, unknown>;

        const cartons =
          projectRecord.cartons as
            Record<string, unknown>[];

        cartons[0]!.externalLengthMm =
          null;

        expect(
          parseBusinessProjectJson(
            JSON.stringify(
              invalid
            )
          )
        ).toMatchObject({
          ok: false,
          error: {
            code:
              'invalid-project',
          },
        });
      }
    );

    it(
      'rejects duplicate product identities',
      () => {
        const base =
          project();

        const invalid =
          documentFor(
            project({
              products: [
                base.products[0]!,
                {
                  ...base.products[1]!,
                  id:
                    base.products[0]!
                      .id,
                },
              ],
            })
          );

        expect(
          parseBusinessProjectJson(
            JSON.stringify(
              invalid
            )
          )
        ).toMatchObject({
          ok: false,
          error: {
            code:
              'invalid-project',
          },
        });
      }
    );

    it(
      'rejects duplicate carton identities',
      () => {
        const base =
          project();

        const invalid =
          documentFor(
            project({
              cartons: [
                base.cartons[0]!,
                {
                  ...base.cartons[1]!,
                  id:
                    base.cartons[0]!
                      .id,
                },
              ],
            })
          );

        expect(
          parseBusinessProjectJson(
            JSON.stringify(
              invalid
            )
          )
        ).toMatchObject({
          ok: false,
          error: {
            code:
              'invalid-project',
          },
        });
      }
    );

    it(
      'rejects empty product or carton collections',
      () => {
        for (
          const invalidProject of [
            project({
              products: [],
            }),
            project({
              cartons: [],
            }),
          ]
        ) {
          expect(
            parseBusinessProjectJson(
              JSON.stringify(
                documentFor(
                  invalidProject
                )
              )
            )
          ).toMatchObject({
            ok: false,
            error: {
              code:
                'invalid-project',
            },
          });
        }
      }
    );

    it(
      'rejects an invalid saved timestamp',
      () => {
        const invalid =
          documentFor(
            project()
          );

        (
          invalid.project as
            Record<string, unknown>
        ).savedAt = -1;

        expect(
          parseBusinessProjectJson(
            JSON.stringify(
              invalid
            )
          )
        ).toMatchObject({
          ok: false,
          error: {
            code:
              'invalid-project',
          },
        });
      }
    );

    it(
      'refuses to serialize an invalid in-memory project',
      () => {
        const invalid = {
          ...project(),
          products: [],
        };

        expect(() =>
          serializeBusinessProjectJson(
            invalid
          )
        ).toThrow(
          'Cannot serialize an invalid Business project.'
        );
      }
    );

    it(
      'refuses to serialize a project with partial external carton dimensions',
      () => {
        const base =
          project();

        const invalid: RecentBusinessProject = {
          ...base,
          cartons: [
            {
              ...base.cartons[0]!,
              externalWidthMm:
                undefined,
            },
          ],
        };

        expect(() =>
          serializeBusinessProjectJson(
            invalid
          )
        ).toThrow(
          'Cannot serialize an invalid Business project.'
        );
      }
    );

    it(
      'refuses to serialize invalid dimensional-weight settings',
      () => {
        const invalid =
          project();

        (
          invalid as
            unknown as
            Record<
              string,
              unknown
            >
        ).dimensionalWeight = {
          divisorValue: 0,
          lengthUnit: 'cm',
          massUnit: 'kg',
        };

        expect(() =>
          serializeBusinessProjectJson(
            invalid
          )
        ).toThrow(
          'Cannot serialize an invalid Business project.'
        );
      }
    );
  }
);