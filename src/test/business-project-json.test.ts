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
  }
);
