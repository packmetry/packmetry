export type PersonalUnitPreference =
  | 'metric'
  | 'imperial';

export const PERSONAL_UNIT_PREFERENCE_KEY =
  'packmetry.personal.unit-system';

interface UnitPreferenceStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

function browserStorage():
  | UnitPreferenceStorage
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

export function isPersonalUnitPreference(
  value: unknown
): value is PersonalUnitPreference {
  return (
    value === 'metric' ||
    value === 'imperial'
  );
}

export function readPersonalUnitPreference(
  storage:
    | UnitPreferenceStorage
    | undefined = browserStorage()
):
  | PersonalUnitPreference
  | undefined {
  if (storage === undefined) {
    return undefined;
  }

  try {
    const storedValue =
      storage.getItem(
        PERSONAL_UNIT_PREFERENCE_KEY
      );

    return isPersonalUnitPreference(
      storedValue
    )
      ? storedValue
      : undefined;
  } catch {
    return undefined;
  }
}

export function writePersonalUnitPreference(
  preference: PersonalUnitPreference,
  storage:
    | UnitPreferenceStorage
    | undefined = browserStorage()
): boolean {
  if (storage === undefined) {
    return false;
  }

  try {
    storage.setItem(
      PERSONAL_UNIT_PREFERENCE_KEY,
      preference
    );

    return true;
  } catch {
    return false;
  }
}