import {
  useState,
  type SyntheticEvent,
} from 'react';

import {
  convertDimensions,
  normalizeDimensions,
  type CanonicalDimensions,
  type Dimensions,
  type LengthUnit,
} from '../core/units/index.js';
import type {
  RotationPolicy,
} from '../core/domain/constraints.js';
import {
  getRotatedDimensions,
  type PlacementRotation,
} from '../core/domain/result.js';

export interface BoxSizeToolInput {
  length: number;
  width: number;
  height: number;
  unit: LengthUnit;
  rotationPolicy: RotationPolicy;
  availableBox?: Dimensions;
}

export interface BoxSizeOrientation {
  rotation: PlacementRotation;
  dimensionsMm: CanonicalDimensions;
  dimensions: Dimensions;
}

export interface BoxSizeToolResult {
  unit: LengthUnit;
  orientations: BoxSizeOrientation[];
  availableBoxCheck?: {
    fits: boolean;
    matchingRotation?: PlacementRotation;
  };
}

const LENGTH_UNITS:
  readonly {
    value: LengthUnit;
    label: string;
  }[] = [
    { value: 'mm', label: 'Millimeters (mm)' },
    { value: 'cm', label: 'Centimeters (cm)' },
    { value: 'm', label: 'Meters (m)' },
    { value: 'in', label: 'Inches (in)' },
    { value: 'ft', label: 'Feet (ft)' },
  ];

const ROTATIONS_BY_POLICY: Record<
  RotationPolicy,
  readonly PlacementRotation[]
> = {
  any: [
    'LWH',
    'WLH',
    'LHW',
    'HLW',
    'WHL',
    'HWL',
  ],
  upright: ['LWH', 'WLH'],
  'vertical-axis-only': ['LWH', 'WLH'],
  fixed: ['LWH'],
};

const ROTATION_OPTIONS:
  readonly {
    value: RotationPolicy;
    label: string;
  }[] = [
    {
      value: 'any',
      label: 'Any allowed orientation',
    },
    {
      value: 'upright',
      label: 'Keep height upright',
    },
    {
      value: 'vertical-axis-only',
      label: 'Vertical-axis only',
    },
    {
      value: 'fixed',
      label: 'Fixed orientation',
    },
  ];

function orientationKey(
  dimensions: CanonicalDimensions
): string {
  return [
    dimensions.length,
    dimensions.width,
    dimensions.height,
  ].join('|');
}

function fitsInside(
  item: CanonicalDimensions,
  box: CanonicalDimensions
): boolean {
  return (
    item.length <= box.length &&
    item.width <= box.width &&
    item.height <= box.height
  );
}

export function calculateBoxSizeTool(
  input: BoxSizeToolInput
): BoxSizeToolResult {
  const itemDimensionsMm =
    normalizeDimensions(
      {
        length: input.length,
        width: input.width,
        height: input.height,
      },
      input.unit
    );

  const seen =
    new Set<string>();

  const orientations:
    BoxSizeOrientation[] = [];

  for (
    const rotation of
      ROTATIONS_BY_POLICY[
        input.rotationPolicy
      ]
  ) {
    const dimensionsMm =
      getRotatedDimensions(
        itemDimensionsMm,
        rotation
      );

    const key =
      orientationKey(
        dimensionsMm
      );

    if (seen.has(key)) {
      continue;
    }

    seen.add(key);

    orientations.push({
      rotation,
      dimensionsMm,
      dimensions:
        convertDimensions(
          dimensionsMm,
          input.unit
        ),
    });
  }

  if (
    input.availableBox === undefined
  ) {
    return {
      unit: input.unit,
      orientations,
    };
  }

  const availableBoxMm =
    normalizeDimensions(
      input.availableBox,
      input.unit
    );

  const matchingOrientation =
    orientations.find(
      orientation =>
        fitsInside(
          orientation.dimensionsMm,
          availableBoxMm
        )
    );

  return {
    unit: input.unit,
    orientations,
    availableBoxCheck:
      matchingOrientation ===
        undefined
        ? {
            fits: false,
          }
        : {
            fits: true,
            matchingRotation:
              matchingOrientation.rotation,
          },
  };
}

function parseRequiredNumber(
  value: string,
  label: string
): number {
  if (value.trim() === '') {
    throw new Error(
      `${label} is required.`
    );
  }

  const parsed =
    Number(value);

  if (!Number.isFinite(parsed)) {
    throw new Error(
      `${label} must be a number.`
    );
  }

  return parsed;
}

function parseAvailableBox(
  length: string,
  width: string,
  height: string
): Dimensions | undefined {
  const values = [
    length,
    width,
    height,
  ];

  if (
    values.every(
      value =>
        value.trim() === ''
    )
  ) {
    return undefined;
  }

  if (
    values.some(
      value =>
        value.trim() === ''
    )
  ) {
    throw new Error(
      'Enter all three available-box dimensions or leave all three blank.'
    );
  }

  return {
    length:
      parseRequiredNumber(
        length,
        'Available box length'
      ),
    width:
      parseRequiredNumber(
        width,
        'Available box width'
      ),
    height:
      parseRequiredNumber(
        height,
        'Available box height'
      ),
  };
}

function formatNumber(
  value: number
): string {
  return new Intl.NumberFormat(
    'en',
    {
      maximumFractionDigits: 3,
    }
  ).format(value);
}

function formatDimensions(
  dimensions: Dimensions,
  unit: LengthUnit
): string {
  return [
    formatNumber(
      dimensions.length
    ),
    formatNumber(
      dimensions.width
    ),
    formatNumber(
      dimensions.height
    ),
  ].join(' × ') + ` ${unit}`;
}

export default function BoxSizeCalculator() {
  const [length, setLength] =
    useState('');
  const [width, setWidth] =
    useState('');
  const [height, setHeight] =
    useState('');
  const [unit, setUnit] =
    useState<LengthUnit>('cm');
  const [
    rotationPolicy,
    setRotationPolicy,
  ] =
    useState<RotationPolicy>(
      'any'
    );
  const [
    boxLength,
    setBoxLength,
  ] = useState('');
  const [
    boxWidth,
    setBoxWidth,
  ] = useState('');
  const [
    boxHeight,
    setBoxHeight,
  ] = useState('');
  const [result, setResult] =
    useState<
      BoxSizeToolResult |
      null
    >(null);
  const [error, setError] =
    useState<string | null>(
      null
    );

  const submit = (
    event:
      SyntheticEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    try {
      const nextResult =
        calculateBoxSizeTool({
          length:
            parseRequiredNumber(
              length,
              'Item length'
            ),
          width:
            parseRequiredNumber(
              width,
              'Item width'
            ),
          height:
            parseRequiredNumber(
              height,
              'Item height'
            ),
          unit,
          rotationPolicy,
          availableBox:
            parseAvailableBox(
              boxLength,
              boxWidth,
              boxHeight
            ),
        });

      setResult(nextResult);
      setError(null);
    } catch (caught) {
      setResult(null);

      setError(
        caught instanceof Error
          ? caught.message
          : 'Unable to calculate box size.'
      );
    }
  };

  return (
    <section
      className="pm-box-size-tool"
      aria-labelledby="box-size-tool-title"
    >
      <div className="pm-box-size-panel">
        <div className="pm-box-size-heading">
          <p className="pm-tool-kicker">
            Calculator
          </p>

          <h2 id="box-size-tool-title">
            Size a box for one rectangular item
          </h2>

          <p>
            Enter one item&apos;s dimensions
            and its allowed rotation policy.
            Packmetry will show the distinct
            minimum internal box profiles that
            can contain that item geometrically.
          </p>
        </div>

        <form
          className="pm-box-size-form"
          onSubmit={submit}
        >
          <fieldset>
            <legend>
              Item dimensions
            </legend>

            <div className="pm-box-size-grid">
              <label>
                <span>Length</span>
                <input
                  type="number"
                  min="0"
                  step="any"
                  inputMode="decimal"
                  value={length}
                  onChange={
                    event =>
                      setLength(
                        event.currentTarget.value
                      )
                  }
                  required
                />
              </label>

              <label>
                <span>Width</span>
                <input
                  type="number"
                  min="0"
                  step="any"
                  inputMode="decimal"
                  value={width}
                  onChange={
                    event =>
                      setWidth(
                        event.currentTarget.value
                      )
                  }
                  required
                />
              </label>

              <label>
                <span>Height</span>
                <input
                  type="number"
                  min="0"
                  step="any"
                  inputMode="decimal"
                  value={height}
                  onChange={
                    event =>
                      setHeight(
                        event.currentTarget.value
                      )
                  }
                  required
                />
              </label>

              <label>
                <span>Unit</span>
                <select
                  value={unit}
                  onChange={
                    event =>
                      setUnit(
                        event.currentTarget.value as LengthUnit
                      )
                  }
                >
                  {
                    LENGTH_UNITS.map(
                      lengthUnit => (
                        <option
                          key={lengthUnit.value}
                          value={lengthUnit.value}
                        >
                          {lengthUnit.label}
                        </option>
                      )
                    )
                  }
                </select>
              </label>
            </div>
          </fieldset>

          <fieldset>
            <legend>
              Rotation policy
            </legend>

            <p className="pm-box-size-field-note">
              Rotation changes which item axis
              can map to each internal box axis.
              The tool follows the same four
              rotation-policy labels used by
              Packmetry.
            </p>

            <label className="pm-box-size-select-row">
              <span>Allowed rotation</span>

              <select
                value={rotationPolicy}
                onChange={
                  event =>
                    setRotationPolicy(
                      event.currentTarget.value as RotationPolicy
                    )
                }
              >
                {
                  ROTATION_OPTIONS.map(
                    option => (
                      <option
                        key={option.value}
                        value={option.value}
                      >
                        {option.label}
                      </option>
                    )
                  )
                }
              </select>
            </label>
          </fieldset>

          <fieldset>
            <legend>
              Optional box check
            </legend>

            <p className="pm-box-size-field-note">
              Already have a box? Enter its
              internal dimensions in the same
              unit. Leave all three fields blank
              if you only want minimum profiles.
            </p>

            <div className="pm-box-size-grid pm-box-size-grid-three">
              <label>
                <span>Internal length</span>
                <input
                  type="number"
                  min="0"
                  step="any"
                  inputMode="decimal"
                  value={boxLength}
                  onChange={
                    event =>
                      setBoxLength(
                        event.currentTarget.value
                      )
                  }
                />
              </label>

              <label>
                <span>Internal width</span>
                <input
                  type="number"
                  min="0"
                  step="any"
                  inputMode="decimal"
                  value={boxWidth}
                  onChange={
                    event =>
                      setBoxWidth(
                        event.currentTarget.value
                      )
                  }
                />
              </label>

              <label>
                <span>Internal height</span>
                <input
                  type="number"
                  min="0"
                  step="any"
                  inputMode="decimal"
                  value={boxHeight}
                  onChange={
                    event =>
                      setBoxHeight(
                        event.currentTarget.value
                      )
                  }
                />
              </label>
            </div>
          </fieldset>

          <button
            className="pm-box-size-submit"
            type="submit"
          >
            Calculate box size
          </button>
        </form>
      </div>

      <aside
        className="pm-box-size-result"
        aria-live="polite"
      >
        <p className="pm-tool-kicker">
          Result
        </p>

        {
          error !== null ? (
            <div
              className="pm-box-size-error"
              role="alert"
            >
              {error}
            </div>
          ) : result === null ? (
            <div className="pm-box-size-empty">
              <strong>
                Minimum internal sizes will
                appear here.
              </strong>

              <p>
                These are geometric minima for
                one rectangular item. No padding,
                void fill or manufacturing
                tolerance is added automatically.
              </p>
            </div>
          ) : (
            <div className="pm-box-size-result-content">
              <div>
                <span>
                  Allowed minimum internal profiles
                </span>

                <ul className="pm-box-size-orientations">
                  {
                    result.orientations.map(
                      orientation => (
                        <li
                          key={
                            orientation.rotation
                          }
                        >
                          <strong>
                            {
                              formatDimensions(
                                orientation.dimensions,
                                result.unit
                              )
                            }
                          </strong>

                          <small>
                            Rotation {
                              orientation.rotation
                            }
                          </small>
                        </li>
                      )
                    )
                  }
                </ul>
              </div>

              {
                result.availableBoxCheck !==
                  undefined && (
                  <div className="pm-box-size-fit-check">
                    <span>
                      Available box check
                    </span>

                    <strong>
                      {
                        result
                          .availableBoxCheck
                          .fits
                          ? 'Fits geometrically'
                          : 'Does not fit geometrically'
                      }
                    </strong>

                    {
                      result
                        .availableBoxCheck
                        .matchingRotation !==
                          undefined && (
                        <small>
                          Matching rotation: {
                            result
                              .availableBoxCheck
                              .matchingRotation
                          }
                        </small>
                      )
                    }
                  </div>
                )
              }

              <p className="pm-box-size-result-note">
                This is a single-item geometry
                calculation. It does not add
                protective clearance or solve a
                multi-item packing arrangement.
              </p>
            </div>
          )
        }
      </aside>
    </section>
  );
}
