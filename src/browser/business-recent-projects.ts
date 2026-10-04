import type { RotationPolicy } from '../core/domain/constraints.js';
import type { ObjectiveKind } from '../core/domain/objectives.js';
import type {
  LengthUnit,
  MassUnit,
} from '../core/units/types.js';

export type RecentBusinessProjectHandlingPolicy =
  Extract<
    RotationPolicy,
    | 'any'
    | 'upright'
    | 'fixed'
  >;

export type RecentBusinessProjectObjective =
  Extract<
    ObjectiveKind,
    | 'balanced'
    | 'fewest-cartons'
    | 'least-wasted-volume'
  >;

export interface RecentBusinessProjectProduct {
  id: string;
  name: string;
  sku: string;
  lengthMm: number;
  widthMm: number;
  heightMm: number;
  quantity: number;
  unitWeightG: number | undefined;
  rotationPolicy?:
    RecentBusinessProjectHandlingPolicy;
}

export interface RecentBusinessProjectCarton {
  id: string;
  libraryId?: string;
  name: string;
  cartonCode: string;
  lengthMm: number;
  widthMm: number;
  heightMm: number;
  externalLengthMm?: number;
  externalWidthMm?: number;
  externalHeightMm?: number;
  quantityAvailable: number;
  maxGrossWeightG: number | undefined;
  emptyBoxWeightG: number | undefined;
  costPerBox: number | undefined;
}

export interface RecentBusinessProjectDimensionalWeight {
  divisorValue: number | undefined;
  lengthUnit: LengthUnit;
  massUnit: MassUnit;
}

export interface RecentBusinessProjectInput {
  id: string;
  name: string;
  products:
    readonly RecentBusinessProjectProduct[];
  cartons:
    readonly RecentBusinessProjectCarton[];
  objective:
    RecentBusinessProjectObjective;
  dimensionalWeight?:
    RecentBusinessProjectDimensionalWeight;
}

export interface RecentBusinessProject {
  id: string;
  name: string;
  products:
    RecentBusinessProjectProduct[];
  cartons:
    RecentBusinessProjectCarton[];
  objective:
    RecentBusinessProjectObjective;
  dimensionalWeight?:
    RecentBusinessProjectDimensionalWeight;
  savedAt: number;
}

export const BUSINESS_RECENT_PROJECTS_DATABASE_NAME =
  'packmetry-business-projects';

export const BUSINESS_RECENT_PROJECTS_DATABASE_VERSION =
  1;

export const BUSINESS_RECENT_PROJECTS_STORE_NAME =
  'recent-projects';

export const MAX_RECENT_BUSINESS_PROJECTS =
  10;

const SAVED_AT_INDEX = 'savedAt';

function resolveIndexedDbFactory(
  factory?: IDBFactory | null
): IDBFactory | null {
  if (factory !== undefined) {
    return factory;
  }

  if (typeof indexedDB === 'undefined') {
    return null;
  }

  return indexedDB;
}

function openBusinessRecentProjectsDatabase(
  factory: IDBFactory
): Promise<IDBDatabase | null> {
  return new Promise(resolve => {
    let request: IDBOpenDBRequest;
    let settled = false;

    const finish = (
      database: IDBDatabase | null
    ) => {
      if (settled) {
        if (database !== null) {
          database.close();
        }

        return;
      }

      settled = true;
      resolve(database);
    };

    try {
      request = factory.open(
        BUSINESS_RECENT_PROJECTS_DATABASE_NAME,
        BUSINESS_RECENT_PROJECTS_DATABASE_VERSION
      );
    } catch {
      finish(null);
      return;
    }

    request.onupgradeneeded = () => {
      const database =
        request.result;

      if (
        !database.objectStoreNames.contains(
          BUSINESS_RECENT_PROJECTS_STORE_NAME
        )
      ) {
        const store =
          database.createObjectStore(
            BUSINESS_RECENT_PROJECTS_STORE_NAME,
            {
              keyPath: 'id',
            }
          );

        store.createIndex(
          SAVED_AT_INDEX,
          SAVED_AT_INDEX,
          {
            unique: false,
          }
        );
      }
    };

    request.onsuccess = () => {
      finish(request.result);
    };

    request.onerror = () => {
      finish(null);
    };

    request.onblocked = () => {
      finish(null);
    };
  });
}

function cloneProjectProduct(
  product:
    RecentBusinessProjectProduct
): RecentBusinessProjectProduct {
  return {
    id: product.id,
    name: product.name,
    sku: product.sku,
    lengthMm: product.lengthMm,
    widthMm: product.widthMm,
    heightMm: product.heightMm,
    quantity: product.quantity,
    unitWeightG:
      product.unitWeightG,
    ...(product.rotationPolicy !==
    undefined
      ? {
          rotationPolicy:
            product.rotationPolicy,
        }
      : {}),
  };
}

function cloneProjectCarton(
  carton:
    RecentBusinessProjectCarton
): RecentBusinessProjectCarton {
  return {
    id: carton.id,
    ...(carton.libraryId !==
    undefined
      ? {
          libraryId:
            carton.libraryId,
        }
      : {}),
    name: carton.name,
    cartonCode:
      carton.cartonCode,
    lengthMm:
      carton.lengthMm,
    widthMm:
      carton.widthMm,
    heightMm:
      carton.heightMm,
    ...(carton.externalLengthMm !==
    undefined
      ? {
          externalLengthMm:
            carton.externalLengthMm,
        }
      : {}),
    ...(carton.externalWidthMm !==
    undefined
      ? {
          externalWidthMm:
            carton.externalWidthMm,
        }
      : {}),
    ...(carton.externalHeightMm !==
    undefined
      ? {
          externalHeightMm:
            carton.externalHeightMm,
        }
      : {}),
    quantityAvailable:
      carton.quantityAvailable,
    maxGrossWeightG:
      carton.maxGrossWeightG,
    emptyBoxWeightG:
      carton.emptyBoxWeightG,
    costPerBox:
      carton.costPerBox,
  };
}

function cloneProjectDimensionalWeight(
  dimensionalWeight:
    RecentBusinessProjectDimensionalWeight
): RecentBusinessProjectDimensionalWeight {
  return {
    divisorValue:
      dimensionalWeight.divisorValue,
    lengthUnit:
      dimensionalWeight.lengthUnit,
    massUnit:
      dimensionalWeight.massUnit,
  };
}

export function createRecentBusinessProject(
  project:
    RecentBusinessProjectInput,
  savedAt = Date.now()
): RecentBusinessProject {
  return {
    id: project.id,
    name: project.name,
    products:
      project.products.map(
        cloneProjectProduct
      ),
    cartons:
      project.cartons.map(
        cloneProjectCarton
      ),
    objective:
      project.objective,
    ...(project.dimensionalWeight !==
    undefined
      ? {
          dimensionalWeight:
            cloneProjectDimensionalWeight(
              project.dimensionalWeight
            ),
        }
      : {}),
    savedAt,
  };
}

export function orderRecentBusinessProjects(
  projects:
    readonly RecentBusinessProject[]
): RecentBusinessProject[] {
  const ordered = [
    ...projects,
  ].sort(
    (left, right) =>
      right.savedAt -
      left.savedAt
  );

  const unique = new Map<
    string,
    RecentBusinessProject
  >();

  for (
    const project of ordered
  ) {
    if (
      !unique.has(
        project.id
      )
    ) {
      unique.set(
        project.id,
        project
      );
    }
  }

  return [
    ...unique.values(),
  ].slice(
    0,
    MAX_RECENT_BUSINESS_PROJECTS
  );
}

export async function saveRecentBusinessProject(
  project:
    RecentBusinessProjectInput,
  factory?: IDBFactory | null
): Promise<boolean> {
  const resolvedFactory =
    resolveIndexedDbFactory(
      factory
    );

  if (resolvedFactory === null) {
    return false;
  }

  const database =
    await openBusinessRecentProjectsDatabase(
      resolvedFactory
    );

  if (database === null) {
    return false;
  }

  return new Promise(resolve => {
    let settled = false;

    const finish = (
      value: boolean
    ) => {
      if (settled) {
        return;
      }

      settled = true;
      database.close();
      resolve(value);
    };

    let transaction:
      IDBTransaction;

    try {
      transaction =
        database.transaction(
          BUSINESS_RECENT_PROJECTS_STORE_NAME,
          'readwrite'
        );
    } catch {
      finish(false);
      return;
    }

    transaction.oncomplete = () => {
      finish(true);
    };

    transaction.onerror = () => {
      finish(false);
    };

    transaction.onabort = () => {
      finish(false);
    };

    try {
      const store =
        transaction.objectStore(
          BUSINESS_RECENT_PROJECTS_STORE_NAME
        );

      store.put(
        createRecentBusinessProject(
          project
        )
      );

      const index =
        store.index(
          SAVED_AT_INDEX
        );

      const cursorRequest =
        index.openCursor(
          null,
          'prev'
        );

      let seen = 0;

      cursorRequest.onsuccess =
        () => {
          const cursor =
            cursorRequest.result;

          if (
            cursor === null
          ) {
            return;
          }

          seen += 1;

          if (
            seen >
            MAX_RECENT_BUSINESS_PROJECTS
          ) {
            cursor.delete();
          }

          cursor.continue();
        };

      cursorRequest.onerror =
        () => {
          try {
            transaction.abort();
          } catch {
            finish(false);
          }
        };
    } catch {
      try {
        transaction.abort();
      } catch {
        finish(false);
      }
    }
  });
}

export async function listRecentBusinessProjects(
  factory?: IDBFactory | null
): Promise<RecentBusinessProject[]> {
  const resolvedFactory =
    resolveIndexedDbFactory(
      factory
    );

  if (resolvedFactory === null) {
    return [];
  }

  const database =
    await openBusinessRecentProjectsDatabase(
      resolvedFactory
    );

  if (database === null) {
    return [];
  }

  return new Promise(resolve => {
    let settled = false;

    const finish = (
      projects:
        RecentBusinessProject[]
    ) => {
      if (settled) {
        return;
      }

      settled = true;
      database.close();
      resolve(projects);
    };

    let transaction:
      IDBTransaction;

    try {
      transaction =
        database.transaction(
          BUSINESS_RECENT_PROJECTS_STORE_NAME,
          'readonly'
        );
    } catch {
      finish([]);
      return;
    }

    try {
      const request =
        transaction
          .objectStore(
            BUSINESS_RECENT_PROJECTS_STORE_NAME
          )
          .getAll();

      request.onsuccess =
        () => {
          finish(
            orderRecentBusinessProjects(
              request.result as
                RecentBusinessProject[]
            )
          );
        };

      request.onerror = () => {
        finish([]);
      };

      transaction.onerror =
        () => {
          finish([]);
        };

      transaction.onabort = () => {
        finish([]);
      };
    } catch {
      finish([]);
    }
  });
}