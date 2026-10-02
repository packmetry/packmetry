import type {
  RecentBusinessProject,
  RecentBusinessProjectCarton,
  RecentBusinessProjectHandlingPolicy,
  RecentBusinessProjectObjective,
  RecentBusinessProjectProduct,
} from './business-recent-projects.js';

export const BUSINESS_PROJECT_JSON_FORMAT =
  'packmetry.business.project';

export const BUSINESS_PROJECT_JSON_VERSION =
  1;

export interface BusinessProjectJsonDocument {
  format:
    typeof BUSINESS_PROJECT_JSON_FORMAT;
  version:
    typeof BUSINESS_PROJECT_JSON_VERSION;
  project: RecentBusinessProject;
}

export type BusinessProjectJsonErrorCode =
  | 'invalid-json'
  | 'invalid-format'
  | 'unsupported-version'
  | 'invalid-project';

export interface BusinessProjectJsonError {
  code: BusinessProjectJsonErrorCode;
  message: string;
}

export type BusinessProjectJsonParseResult =
  | {
      ok: true;
      project: RecentBusinessProject;
    }
  | {
      ok: false;
      error: BusinessProjectJsonError;
    };

const BUSINESS_PROJECT_OBJECTIVES:
  readonly RecentBusinessProjectObjective[] = [
    'balanced',
    'fewest-cartons',
    'least-wasted-volume',
  ];

const BUSINESS_PROJECT_HANDLING_POLICIES:
  readonly RecentBusinessProjectHandlingPolicy[] = [
    'any',
    'upright',
    'fixed',
  ];

function isRecord(
  value: unknown
): value is Record<string, unknown> {
  return (
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value)
  );
}

function isFiniteNumber(
  value: unknown
): value is number {
  return (
    typeof value === 'number' &&
    Number.isFinite(value)
  );
}

function isNonEmptyString(
  value: unknown
): value is string {
  return (
    typeof value === 'string' &&
    value.trim() !== ''
  );
}

function isBusinessProjectObjective(
  value: unknown
): value is RecentBusinessProjectObjective {
  return (
    typeof value === 'string' &&
    BUSINESS_PROJECT_OBJECTIVES.some(
      objective =>
        objective === value
    )
  );
}

function isBusinessProjectHandlingPolicy(
  value: unknown
): value is RecentBusinessProjectHandlingPolicy {
  return (
    typeof value === 'string' &&
    BUSINESS_PROJECT_HANDLING_POLICIES.some(
      policy =>
        policy === value
    )
  );
}

function optionalPositiveNumber(
  record: Record<string, unknown>,
  key: string
): number | undefined | null {
  const value = record[key];

  if (value === undefined) {
    return undefined;
  }

  if (
    !isFiniteNumber(value) ||
    value <= 0
  ) {
    return null;
  }

  return value;
}

function optionalNonNegativeNumber(
  record: Record<string, unknown>,
  key: string
): number | undefined | null {
  const value = record[key];

  if (value === undefined) {
    return undefined;
  }

  if (
    !isFiniteNumber(value) ||
    value < 0
  ) {
    return null;
  }

  return value;
}

function parseProduct(
  value: unknown
): RecentBusinessProjectProduct | null {
  if (!isRecord(value)) {
    return null;
  }

  if (
    !isNonEmptyString(value.id) ||
    typeof value.name !== 'string' ||
    typeof value.sku !== 'string' ||
    !isFiniteNumber(value.lengthMm) ||
    value.lengthMm <= 0 ||
    !isFiniteNumber(value.widthMm) ||
    value.widthMm <= 0 ||
    !isFiniteNumber(value.heightMm) ||
    value.heightMm <= 0 ||
    !isFiniteNumber(value.quantity) ||
    !Number.isInteger(value.quantity) ||
    value.quantity < 1
  ) {
    return null;
  }

  const unitWeightG =
    optionalPositiveNumber(
      value,
      'unitWeightG'
    );

  if (unitWeightG === null) {
    return null;
  }

  const rotationPolicy =
    value.rotationPolicy;

  if (
    rotationPolicy !== undefined &&
    !isBusinessProjectHandlingPolicy(
      rotationPolicy
    )
  ) {
    return null;
  }

  return {
    id: value.id,
    name: value.name,
    sku: value.sku,
    lengthMm: value.lengthMm,
    widthMm: value.widthMm,
    heightMm: value.heightMm,
    quantity: value.quantity,
    unitWeightG,
    ...(rotationPolicy !== undefined
      ? {
          rotationPolicy,
        }
      : {}),
  };
}

function parseCarton(
  value: unknown
): RecentBusinessProjectCarton | null {
  if (!isRecord(value)) {
    return null;
  }

  if (
    !isNonEmptyString(value.id) ||
    typeof value.name !== 'string' ||
    typeof value.cartonCode !== 'string' ||
    !isFiniteNumber(value.lengthMm) ||
    value.lengthMm <= 0 ||
    !isFiniteNumber(value.widthMm) ||
    value.widthMm <= 0 ||
    !isFiniteNumber(value.heightMm) ||
    value.heightMm <= 0 ||
    !isFiniteNumber(value.quantityAvailable) ||
    !Number.isInteger(
      value.quantityAvailable
    ) ||
    value.quantityAvailable < 0
  ) {
    return null;
  }

  const libraryId =
    value.libraryId;

  if (
    libraryId !== undefined &&
    !isNonEmptyString(
      libraryId
    )
  ) {
    return null;
  }

  const maxGrossWeightG =
    optionalPositiveNumber(
      value,
      'maxGrossWeightG'
    );

  if (maxGrossWeightG === null) {
    return null;
  }

  const emptyBoxWeightG =
    optionalPositiveNumber(
      value,
      'emptyBoxWeightG'
    );

  if (emptyBoxWeightG === null) {
    return null;
  }

  const costPerBox =
    optionalNonNegativeNumber(
      value,
      'costPerBox'
    );

  if (costPerBox === null) {
    return null;
  }

  return {
    id: value.id,
    ...(libraryId !== undefined
      ? {
          libraryId,
        }
      : {}),
    name: value.name,
    cartonCode: value.cartonCode,
    lengthMm: value.lengthMm,
    widthMm: value.widthMm,
    heightMm: value.heightMm,
    quantityAvailable:
      value.quantityAvailable,
    maxGrossWeightG,
    emptyBoxWeightG,
    costPerBox,
  };
}

function hasUniqueIds(
  values: readonly {
    id: string;
  }[]
): boolean {
  return (
    new Set(
      values.map(
        value => value.id
      )
    ).size === values.length
  );
}

function parseProject(
  value: unknown
): RecentBusinessProject | null {
  if (!isRecord(value)) {
    return null;
  }

  if (
    !isNonEmptyString(value.id) ||
    !isNonEmptyString(value.name) ||
    !Array.isArray(value.products) ||
    value.products.length === 0 ||
    !Array.isArray(value.cartons) ||
    value.cartons.length === 0 ||
    !isBusinessProjectObjective(
      value.objective
    ) ||
    !isFiniteNumber(value.savedAt) ||
    value.savedAt < 0
  ) {
    return null;
  }

  const products =
    value.products.map(
      parseProduct
    );

  if (
    products.some(
      product =>
        product === null
    )
  ) {
    return null;
  }

  const cartons =
    value.cartons.map(
      parseCarton
    );

  if (
    cartons.some(
      carton =>
        carton === null
    )
  ) {
    return null;
  }

  const parsedProducts =
    products as
      RecentBusinessProjectProduct[];

  const parsedCartons =
    cartons as
      RecentBusinessProjectCarton[];

  if (
    !hasUniqueIds(parsedProducts) ||
    !hasUniqueIds(parsedCartons)
  ) {
    return null;
  }

  return {
    id: value.id,
    name: value.name,
    products: parsedProducts,
    cartons: parsedCartons,
    objective: value.objective,
    savedAt: value.savedAt,
  };
}

function parseFailure(
  code:
    BusinessProjectJsonErrorCode,
  message: string
): BusinessProjectJsonParseResult {
  return {
    ok: false,
    error: {
      code,
      message,
    },
  };
}

export function createBusinessProjectJsonDocument(
  project:
    RecentBusinessProject
): BusinessProjectJsonDocument {
  const parsedProject =
    parseProject(project);

  if (parsedProject === null) {
    throw new TypeError(
      'Cannot serialize an invalid Business project.'
    );
  }

  return {
    format:
      BUSINESS_PROJECT_JSON_FORMAT,
    version:
      BUSINESS_PROJECT_JSON_VERSION,
    project:
      parsedProject,
  };
}

export function serializeBusinessProjectJson(
  project:
    RecentBusinessProject
): string {
  return JSON.stringify(
    createBusinessProjectJsonDocument(
      project
    ),
    null,
    2
  );
}

export function parseBusinessProjectJson(
  source: string
): BusinessProjectJsonParseResult {
  let value: unknown;

  try {
    value =
      JSON.parse(source);
  } catch {
    return parseFailure(
      'invalid-json',
      'The selected file is not valid JSON.'
    );
  }

  if (!isRecord(value)) {
    return parseFailure(
      'invalid-format',
      'The selected JSON is not a Packmetry Business project.'
    );
  }

  if (
    value.format !==
    BUSINESS_PROJECT_JSON_FORMAT
  ) {
    return parseFailure(
      'invalid-format',
      'The selected JSON is not a Packmetry Business project.'
    );
  }

  if (
    typeof value.version !== 'number' ||
    !Number.isInteger(
      value.version
    )
  ) {
    return parseFailure(
      'invalid-format',
      'The Packmetry Business project version is missing or invalid.'
    );
  }

  if (
    value.version !==
    BUSINESS_PROJECT_JSON_VERSION
  ) {
    return parseFailure(
      'unsupported-version',
      `Unsupported Packmetry Business project version: ${value.version}.`
    );
  }

  const project =
    parseProject(
      value.project
    );

  if (project === null) {
    return parseFailure(
      'invalid-project',
      'The Packmetry Business project data is invalid.'
    );
  }

  return {
    ok: true,
    project,
  };
}
