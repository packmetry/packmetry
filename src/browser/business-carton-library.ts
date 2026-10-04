export interface SavedBusinessCartonInput {
  id: string;
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

export interface SavedBusinessCarton
  extends SavedBusinessCartonInput {
  savedAt: number;
}

export const BUSINESS_CARTON_LIBRARY_DATABASE_NAME =
  'packmetry-business';

export const BUSINESS_CARTON_LIBRARY_DATABASE_VERSION =
  1;

export const BUSINESS_CARTON_LIBRARY_STORE_NAME =
  'saved-cartons';

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

function openBusinessCartonLibraryDatabase(
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
        BUSINESS_CARTON_LIBRARY_DATABASE_NAME,
        BUSINESS_CARTON_LIBRARY_DATABASE_VERSION
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
          BUSINESS_CARTON_LIBRARY_STORE_NAME
        )
      ) {
        const store =
          database.createObjectStore(
            BUSINESS_CARTON_LIBRARY_STORE_NAME,
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

export function createSavedBusinessCarton(
  carton: SavedBusinessCartonInput,
  savedAt = Date.now()
): SavedBusinessCarton {
  return {
    id: carton.id,
    name: carton.name,
    cartonCode: carton.cartonCode,
    lengthMm: carton.lengthMm,
    widthMm: carton.widthMm,
    heightMm: carton.heightMm,
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
    savedAt,
  };
}

export function orderSavedBusinessCartons(
  cartons: readonly SavedBusinessCarton[]
): SavedBusinessCarton[] {
  const ordered = [...cartons].sort(
    (left, right) =>
      right.savedAt - left.savedAt
  );

  const unique = new Map<
    string,
    SavedBusinessCarton
  >();

  for (const carton of ordered) {
    if (!unique.has(carton.id)) {
      unique.set(
        carton.id,
        carton
      );
    }
  }

  return [...unique.values()];
}

export async function saveBusinessCarton(
  carton: SavedBusinessCartonInput,
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
    await openBusinessCartonLibraryDatabase(
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

    let transaction: IDBTransaction;

    try {
      transaction =
        database.transaction(
          BUSINESS_CARTON_LIBRARY_STORE_NAME,
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
      transaction
        .objectStore(
          BUSINESS_CARTON_LIBRARY_STORE_NAME
        )
        .put(
          createSavedBusinessCarton(
            carton
          )
        );
    } catch {
      try {
        transaction.abort();
      } catch {
        finish(false);
      }
    }
  });
}

export async function listSavedBusinessCartons(
  factory?: IDBFactory | null
): Promise<SavedBusinessCarton[]> {
  const resolvedFactory =
    resolveIndexedDbFactory(
      factory
    );

  if (resolvedFactory === null) {
    return [];
  }

  const database =
    await openBusinessCartonLibraryDatabase(
      resolvedFactory
    );

  if (database === null) {
    return [];
  }

  return new Promise(resolve => {
    let settled = false;

    const finish = (
      cartons: SavedBusinessCarton[]
    ) => {
      if (settled) {
        return;
      }

      settled = true;
      database.close();
      resolve(cartons);
    };

    let transaction: IDBTransaction;

    try {
      transaction =
        database.transaction(
          BUSINESS_CARTON_LIBRARY_STORE_NAME,
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
            BUSINESS_CARTON_LIBRARY_STORE_NAME
          )
          .getAll();

      request.onsuccess = () => {
        finish(
          orderSavedBusinessCartons(
            request.result as
              SavedBusinessCarton[]
          )
        );
      };

      request.onerror = () => {
        finish([]);
      };

      transaction.onerror = () => {
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

export async function deleteSavedBusinessCarton(
  id: string,
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
    await openBusinessCartonLibraryDatabase(
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

    let transaction: IDBTransaction;

    try {
      transaction =
        database.transaction(
          BUSINESS_CARTON_LIBRARY_STORE_NAME,
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
      transaction
        .objectStore(
          BUSINESS_CARTON_LIBRARY_STORE_NAME
        )
        .delete(id);
    } catch {
      try {
        transaction.abort();
      } catch {
        finish(false);
      }
    }
  });
}