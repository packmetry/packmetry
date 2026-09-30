import type { PackingPlan } from '../core/domain/packing-plan.js';

export type RecentPersonalPlanMode =
  | 'need-boxes'
  | 'have-boxes'
  | 'hybrid-boxes';

export interface RecentPersonalPlan {
  plan: PackingPlan;
  mode: RecentPersonalPlanMode;
  savedAt: number;
}

export const MAX_RECENT_PERSONAL_PLANS = 10;

const DATABASE_NAME = 'packmetry-personal';
const DATABASE_VERSION = 1;
const STORE_NAME = 'recent-plans';
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

function openRecentPlansDatabase(
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
      const database =
        request.result;

      if (
        !database.objectStoreNames.contains(
          STORE_NAME
        )
      ) {
        const store =
          database.createObjectStore(
            STORE_NAME,
            {
              autoIncrement: true,
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

export function createRecentPersonalPlan(
  plan: PackingPlan,
  mode: RecentPersonalPlanMode,
  savedAt = Date.now()
): RecentPersonalPlan {
  return {
    plan,
    mode,
    savedAt,
  };
}

export function orderRecentPersonalPlans(
  plans: readonly RecentPersonalPlan[]
): RecentPersonalPlan[] {
  return [...plans]
    .sort(
      (left, right) =>
        right.savedAt -
        left.savedAt
    )
    .slice(
      0,
      MAX_RECENT_PERSONAL_PLANS
    );
}

export async function saveRecentPersonalPlan(
  plan: PackingPlan,
  mode: RecentPersonalPlanMode,
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
    await openRecentPlansDatabase(
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

      store.add(
        createRecentPersonalPlan(
          plan,
          mode
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

      cursorRequest.onsuccess = () => {
        const cursor =
          cursorRequest.result;

        if (cursor === null) {
          return;
        }

        seen += 1;

        if (
          seen >
          MAX_RECENT_PERSONAL_PLANS
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

export async function listRecentPersonalPlans(
  factory?: IDBFactory | null
): Promise<RecentPersonalPlan[]> {
  const resolvedFactory =
    resolveIndexedDbFactory(
      factory
    );

  if (resolvedFactory === null) {
    return [];
  }

  const database =
    await openRecentPlansDatabase(
      resolvedFactory
    );

  if (database === null) {
    return [];
  }

  return new Promise(resolve => {
    let settled = false;

    const finish = (
      plans: RecentPersonalPlan[]
    ) => {
      if (settled) {
        return;
      }

      settled = true;
      database.close();
      resolve(plans);
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
          .objectStore(
            STORE_NAME
          )
          .getAll();

      request.onsuccess = () => {
        finish(
          orderRecentPersonalPlans(
            request.result as
              RecentPersonalPlan[]
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
