export interface RecentPersonalItemInput {
  name?: string;
  lengthMm: number;
  widthMm: number;
  heightMm: number;
  quantity: number;
  unitWeightG?: number;
  keepUpright?: boolean;
  allowRotation?: boolean;
}

export interface RecentPersonalItem
  extends RecentPersonalItemInput {
  fingerprint: string;
  savedAt: number;
}

export const MAX_RECENT_PERSONAL_ITEMS = 20;

const DATABASE_NAME = 'packmetry-personal-items';
const DATABASE_VERSION = 1;
const STORE_NAME = 'recent-items';
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

function normalizeName(
  name: string | undefined
): string {
  return name?.trim().toLowerCase() ?? '';
}

export function recentPersonalItemFingerprint(
  item: RecentPersonalItemInput
): string {
  return JSON.stringify([
    normalizeName(item.name),
    item.lengthMm,
    item.widthMm,
    item.heightMm,
    item.unitWeightG ?? null,
    item.keepUpright ?? false,
    item.allowRotation ?? true,
  ]);
}

export function createRecentPersonalItem(
  item: RecentPersonalItemInput,
  savedAt = Date.now()
): RecentPersonalItem {
  return {
    ...(item.name !== undefined
      ? { name: item.name }
      : {}),
    lengthMm: item.lengthMm,
    widthMm: item.widthMm,
    heightMm: item.heightMm,
    quantity: item.quantity,
    ...(item.unitWeightG !== undefined
      ? { unitWeightG: item.unitWeightG }
      : {}),
    ...(item.keepUpright !== undefined
      ? { keepUpright: item.keepUpright }
      : {}),
    ...(item.allowRotation !== undefined
      ? { allowRotation: item.allowRotation }
      : {}),
    fingerprint:
      recentPersonalItemFingerprint(item),
    savedAt,
  };
}

export function orderRecentPersonalItems(
  items: readonly RecentPersonalItem[]
): RecentPersonalItem[] {
  const ordered = [...items].sort(
    (left, right) =>
      right.savedAt - left.savedAt
  );

  const unique = new Map<
    string,
    RecentPersonalItem
  >();

  for (const item of ordered) {
    if (!unique.has(item.fingerprint)) {
      unique.set(item.fingerprint, item);
    }
  }

  return [...unique.values()].slice(
    0,
    MAX_RECENT_PERSONAL_ITEMS
  );
}

function openRecentItemsDatabase(
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
        DATABASE_NAME,
        DATABASE_VERSION
      );
    } catch {
      finish(null);
      return;
    }

    request.onupgradeneeded = () => {
      const database = request.result;

      if (
        !database.objectStoreNames.contains(
          STORE_NAME
        )
      ) {
        const store =
          database.createObjectStore(
            STORE_NAME,
            {
              keyPath: 'fingerprint',
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

export async function saveRecentPersonalItems(
  items: readonly RecentPersonalItemInput[],
  factory?: IDBFactory | null
): Promise<boolean> {
  const resolvedFactory =
    resolveIndexedDbFactory(factory);

  if (resolvedFactory === null) {
    return false;
  }

  const database =
    await openRecentItemsDatabase(
      resolvedFactory
    );

  if (database === null) {
    return false;
  }

  if (items.length === 0) {
    database.close();
    return true;
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
          STORE_NAME,
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
          STORE_NAME
        );

      const baseSavedAt = Date.now();

      items.forEach((item, index) => {
        store.put(
          createRecentPersonalItem(
            item,
            baseSavedAt + index
          )
        );
      });

      const index = store.index(
        SAVED_AT_INDEX
      );

      const cursorRequest =
        index.openCursor(
          null,
          'prev'
        );

      let seen = 0;

      cursorRequest.onsuccess = () => {
        const cursor =
          cursorRequest.result;

        if (cursor === null) {
          return;
        }

        seen += 1;

        if (
          seen >
          MAX_RECENT_PERSONAL_ITEMS
        ) {
          cursor.delete();
        }

        cursor.continue();
      };

      cursorRequest.onerror = () => {
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

export async function listRecentPersonalItems(
  factory?: IDBFactory | null
): Promise<RecentPersonalItem[]> {
  const resolvedFactory =
    resolveIndexedDbFactory(factory);

  if (resolvedFactory === null) {
    return [];
  }

  const database =
    await openRecentItemsDatabase(
      resolvedFactory
    );

  if (database === null) {
    return [];
  }

  return new Promise(resolve => {
    let settled = false;

    const finish = (
      items: RecentPersonalItem[]
    ) => {
      if (settled) {
        return;
      }

      settled = true;
      database.close();
      resolve(items);
    };

    let transaction: IDBTransaction;

    try {
      transaction =
        database.transaction(
          STORE_NAME,
          'readonly'
        );
    } catch {
      finish([]);
      return;
    }

    try {
      const request =
        transaction
          .objectStore(STORE_NAME)
          .getAll();

      request.onsuccess = () => {
        finish(
          orderRecentPersonalItems(
            request.result as
              RecentPersonalItem[]
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
