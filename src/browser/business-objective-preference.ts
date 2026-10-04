import type { ObjectiveKind } from '../core/domain/objectives.js';

export type BusinessObjectivePreference =
  Extract<
    ObjectiveKind,
    | 'balanced'
    | 'fewest-cartons'
    | 'least-wasted-volume'
    | 'min-dim-weight'
  >;

export const BUSINESS_OBJECTIVE_PREFERENCE_KEY =
  'packmetry.business.objective';

export const BUSINESS_OBJECTIVE_PREFERENCES:
  readonly BusinessObjectivePreference[] = [
    'balanced',
    'fewest-cartons',
    'least-wasted-volume',
    'min-dim-weight',
  ];

interface ObjectivePreferenceStorage {
  getItem(key: string): string | null;
  setItem(
    key: string,
    value: string
  ): void;
}

function browserStorage():
  | ObjectivePreferenceStorage
  | undefined {
  if (typeof window === 'undefined') {
    return undefined;
  }

  try {
    return window.localStorage;
  } catch {
    return undefined;
  }
}

export function isBusinessObjectivePreference(
  value: unknown
): value is BusinessObjectivePreference {
  return (
    typeof value === 'string' &&
    BUSINESS_OBJECTIVE_PREFERENCES.some(
      preference =>
        preference === value
    )
  );
}

export function readBusinessObjectivePreference(
  storage:
    | ObjectivePreferenceStorage
    | undefined = browserStorage()
):
  | BusinessObjectivePreference
  | undefined {
  if (storage === undefined) {
    return undefined;
  }

  try {
    const storedValue =
      storage.getItem(
        BUSINESS_OBJECTIVE_PREFERENCE_KEY
      );

    return isBusinessObjectivePreference(
      storedValue
    )
      ? storedValue
      : undefined;
  } catch {
    return undefined;
  }
}

export function writeBusinessObjectivePreference(
  preference: BusinessObjectivePreference,
  storage:
    | ObjectivePreferenceStorage
    | undefined = browserStorage()
): boolean {
  if (storage === undefined) {
    return false;
  }

  if (
    !isBusinessObjectivePreference(
      preference
    )
  ) {
    return false;
  }

  try {
    storage.setItem(
      BUSINESS_OBJECTIVE_PREFERENCE_KEY,
      preference
    );

    return true;
  } catch {
    return false;
  }
}