import {
  afterEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';

import {
  BUSINESS_PROJECT_JSON_MIME_TYPE,
  businessProjectJsonFilename,
  downloadBusinessProjectJson,
  readBusinessProjectJsonFile,
} from '../browser/business-project-json-actions.js';
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
      'business-project-4',
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
    ],
    objective:
      'fewest-cartons',
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

interface DownloadHarness {
  appended:
    unknown[];
  clicked: {
    value: boolean;
  };
  removed: {
    value: boolean;
  };
  revoked:
    string[];
  blobParts:
    unknown[][];
  blobTypes:
    Array<
      string | undefined
    >;
  anchor: {
    href: string;
    download: string;
    style: {
      display: string;
    };
    click: () => void;
    remove: () => void;
  };
}

function installDownloadHarness(
  options: {
    clickThrows?: boolean;
  } = {}
): DownloadHarness {
  const appended:
    unknown[] = [];

  const clicked = {
    value: false,
  };

  const removed = {
    value: false,
  };

  const revoked:
    string[] = [];

  const blobParts:
    unknown[][] = [];

  const blobTypes:
    Array<
      string | undefined
    > = [];

  class FakeBlob {
    constructor(
      parts:
        unknown[] = [],
      options?: {
        type?: string;
      }
    ) {
      blobParts.push(
        parts
      );

      blobTypes.push(
        options?.type
      );
    }
  }

  const anchor = {
    href: '',
    download: '',
    style: {
      display: '',
    },
    click: () => {
      clicked.value =
        true;

      if (
        options.clickThrows ===
        true
      ) {
        throw new Error(
          'click failed'
        );
      }
    },
    remove: () => {
      removed.value =
        true;
    },
  };

  const documentStub = {
    createElement: vi.fn(
      (tagName: string) => {
        if (
          tagName !== 'a'
        ) {
          throw new Error(
            'unexpected element'
          );
        }

        return anchor;
      }
    ),
    body: {
      appendChild: vi.fn(
        (element: unknown) => {
          appended.push(
            element
          );

          return element;
        }
      ),
    },
  };

  const urlStub = {
    createObjectURL:
      vi.fn(
        () =>
          'blob:business-project'
      ),
    revokeObjectURL:
      vi.fn(
        (url: string) => {
          revoked.push(
            url
          );
        }
      ),
  };

  vi.stubGlobal(
    'Blob',
    FakeBlob
  );

  vi.stubGlobal(
    'document',
    documentStub
  );

  vi.stubGlobal(
    'URL',
    urlStub
  );

  return {
    appended,
    clicked,
    removed,
    revoked,
    blobParts,
    blobTypes,
    anchor,
  };
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe(
  'Business project JSON browser actions',
  () => {
    it(
      'uses the JSON MIME type for Business project downloads',
      () => {
        expect(
          BUSINESS_PROJECT_JSON_MIME_TYPE
        ).toBe(
          'application/json'
        );
      }
    );

    it(
      'creates a readable filename from the project name',
      () => {
        expect(
          businessProjectJsonFilename(
            project({
              name:
                'October orders',
            })
          )
        ).toBe(
          'packmetry-business-October-orders.json'
        );
      }
    );

    it(
      'removes unsafe filename characters and collapses separators',
      () => {
        expect(
          businessProjectJsonFilename(
            project({
              name:
                '  October / orders: A  ',
            })
          )
        ).toBe(
          'packmetry-business-October-orders-A.json'
        );
      }
    );

    it(
      'falls back to project identity when the name has no safe filename characters',
      () => {
        expect(
          businessProjectJsonFilename(
            project({
              id:
                'business-project-9',
              name:
                '///',
            })
          )
        ).toBe(
          'packmetry-business-business-project-9.json'
        );
      }
    );

    it(
      'uses a deterministic final fallback when neither name nor id has safe characters',
      () => {
        expect(
          businessProjectJsonFilename({
            id: '///',
            name: '***',
          })
        ).toBe(
          'packmetry-business-project.json'
        );
      }
    );

    it(
      'reads selected project file text without interpreting the JSON',
      async () => {
        const source =
          '{"format":"packmetry.business.project"}';

        await expect(
          readBusinessProjectJsonFile({
            text:
              async () =>
                source,
          })
        ).resolves.toEqual({
          ok: true,
          text: source,
        });
      }
    );

    it(
      'preserves an empty selected file for the JSON parser to validate later',
      async () => {
        await expect(
          readBusinessProjectJsonFile({
            text:
              async () => '',
          })
        ).resolves.toEqual({
          ok: true,
          text: '',
        });
      }
    );

    it(
      'reports unavailable when no file is supplied',
      async () => {
        await expect(
          readBusinessProjectJsonFile(
            null
          )
        ).resolves.toEqual({
          ok: false,
          reason:
            'unavailable',
        });
      }
    );

    it(
      'reports unavailable when the selected file cannot expose text',
      async () => {
        await expect(
          readBusinessProjectJsonFile(
            {}
          )
        ).resolves.toEqual({
          ok: false,
          reason:
            'unavailable',
        });
      }
    );

    it(
      'reports a safe failure when selected file reading rejects',
      async () => {
        await expect(
          readBusinessProjectJsonFile({
            text:
              async () => {
                throw new Error(
                  'read failed'
                );
              },
          })
        ).resolves.toEqual({
          ok: false,
          reason:
            'read-failed',
        });
      }
    );

    it(
      'reports a safe failure when selected file reading produces a non-string value',
      async () => {
        const invalidFile = {
          text:
            async () =>
              123,
        } as unknown as {
          text: () =>
            Promise<string>;
        };

        await expect(
          readBusinessProjectJsonFile(
            invalidFile
          )
        ).resolves.toEqual({
          ok: false,
          reason:
            'read-failed',
        });
      }
    );

    it(
      'returns false when browser download APIs are unavailable',
      () => {
        vi.stubGlobal(
          'document',
          undefined
        );

        expect(
          downloadBusinessProjectJson(
            project()
          )
        ).toBe(false);
      }
    );

    it(
      'returns false when object URL creation is unavailable',
      () => {
        vi.stubGlobal(
          'document',
          {}
        );

        vi.stubGlobal(
          'Blob',
          class {}
        );

        vi.stubGlobal(
          'URL',
          {
            revokeObjectURL:
              vi.fn(),
          }
        );

        expect(
          downloadBusinessProjectJson(
            project()
          )
        ).toBe(false);
      }
    );

    it(
      'downloads the versioned project JSON with a temporary anchor',
      () => {
        const harness =
          installDownloadHarness();

        const saved =
          downloadBusinessProjectJson(
            project()
          );

        expect(
          saved
        ).toBe(true);

        expect(
          harness.blobParts
        ).toHaveLength(1);

        expect(
          harness.blobParts[0]
        ).toHaveLength(1);

        const serialized =
          harness.blobParts[0]![0];

        expect(
          typeof serialized
        ).toBe('string');

        expect(
          JSON.parse(
            serialized as string
          )
        ).toMatchObject({
          format:
            'packmetry.business.project',
          version: 1,
          project: {
            id:
              'business-project-4',
            name:
              'October orders',
          },
        });

        expect(
          harness.blobTypes
        ).toEqual([
          'application/json',
        ]);

        expect(
          harness.anchor.href
        ).toBe(
          'blob:business-project'
        );

        expect(
          harness.anchor.download
        ).toBe(
          'packmetry-business-October-orders.json'
        );

        expect(
          harness.anchor.style
            .display
        ).toBe('none');

        expect(
          harness.appended
        ).toEqual([
          harness.anchor,
        ]);

        expect(
          harness.clicked.value
        ).toBe(true);

        expect(
          harness.removed.value
        ).toBe(true);

        expect(
          harness.revoked
        ).toEqual([
          'blob:business-project',
        ]);
      }
    );

    it(
      'returns false and still cleans up when the download click fails',
      () => {
        const harness =
          installDownloadHarness({
            clickThrows: true,
          });

        expect(
          downloadBusinessProjectJson(
            project()
          )
        ).toBe(false);

        expect(
          harness.clicked.value
        ).toBe(true);

        expect(
          harness.removed.value
        ).toBe(true);

        expect(
          harness.revoked
        ).toEqual([
          'blob:business-project',
        ]);
      }
    );

    it(
      'returns false instead of throwing when project serialization fails',
      () => {
        const harness =
          installDownloadHarness();

        const invalid = {
          ...project(),
          products: [],
        };

        expect(
          downloadBusinessProjectJson(
            invalid
          )
        ).toBe(false);

        expect(
          harness.appended
        ).toEqual([]);

        expect(
          harness.clicked.value
        ).toBe(false);

        expect(
          harness.removed.value
        ).toBe(false);

        expect(
          harness.revoked
        ).toEqual([]);
      }
    );
  }
);
