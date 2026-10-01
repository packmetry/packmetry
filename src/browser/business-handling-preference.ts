import type { RotationPolicy } from '../core/domain/constraints.js';

export type BusinessHandlingPreference =
  Extract<
    RotationPolicy,
    | 'any'
    | 'upright'
    | 'fixed'
  >;

export const BUSINESS_HANDLING_PREFERENCE_KEY =
  'packmetry.business.handling';

export const BUSINESS_HANDLING_PREFERENCES:
  readonly BusinessHandlingPreference[] = [
    'any',
    'upright',
    'fixed',
  ];

interface HandlingPreferenceStorage {
  getItem(key: string): string | null;
  setItem(
    key: string,
    value: string
  ): void;
}

function browserStorage():
  | HandlingPreferenceStorage
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

export function isBusinessHandlingPreference(
  value: unknown
): value is BusinessHandlingPreference {
  return (
    typeof value === 'string' &&
    BUSINESS_HANDLING_PREFERENCES.some(
      preference =>
        preference === value
    )
  );
}

export function readBusinessHandlingPreference(
  storage:
    | HandlingPreferenceStorage
    | undefined = browserStorage()
):
  | BusinessHandlingPreference
  | undefined {
  if (storage === undefined) {
    return undefined;
  }

  try {
    const storedValue =
      storage.getItem(
        BUSINESS_HANDLING_PREFERENCE_KEY
      );

    return isBusinessHandlingPreference(
      storedValue
    )
      ? storedValue
      : undefined;
  } catch {
    return undefined;
  }
}

export function writeBusinessHandlingPreference(
  preference: BusinessHandlingPreference,
  storage:
    | HandlingPreferenceStorage
    | undefined = browserStorage()
): boolean {
  if (storage === undefined) {
    return false;
  }

  if (
    !isBusinessHandlingPreference(
      preference
    )
  ) {
    return false;
  }

  try {
    storage.setItem(
      BUSINESS_HANDLING_PREFERENCE_KEY,
      preference
    );

    return true;
  } catch {
    return false;
  }
}
