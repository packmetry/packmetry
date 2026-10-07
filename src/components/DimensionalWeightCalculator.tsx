import {
  useState,
  type SyntheticEvent,
} from 'react';

import {
  calculateChargeableWeightG,
  calculateDimensionalWeightG,
  fromGrams,
  toGrams,
  toMillimeters,
  type LengthUnit,
  type MassUnit,
} from '../core/units/index.js';

export interface DimensionalWeightToolInput {
  length: number;
  width: number;
  height: number;
  dimensionUnit: LengthUnit;
  divisorValue: number;
  divisorLengthUnit: LengthUnit;
  divisorMassUnit: MassUnit;
  grossWeight?: number;
  grossWeightUnit?: MassUnit;
}

export interface DimensionalWeightToolResult {
  dimensionalWeightG: number;
  dimensionalWeight: number;
  outputMassUnit: MassUnit;
  grossWeightG?: number;
  chargeableWeightG?: number;
  chargeableWeight?: number;
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

const MASS_UNITS:
  readonly {
    value: MassUnit;
    label: string;
  }[] = [
    { value: 'g', label: 'Grams (g)' },
    { value: 'kg', label: 'Kilograms (kg)' },
    { value: 'oz', label: 'Ounces (oz)' },
    { value: 'lb', label: 'Pounds (lb)' },
  ];

function requirePositive(
  value: number,
  label: string
): number {
  if (
    !Number.isFinite(value) ||
    value <= 0
  ) {
    throw new Error(
      `${label} must be greater than 0.`
    );
  }

  return value;
}

export function calculateDimensionalWeightTool(
  input: DimensionalWeightToolInput
): DimensionalWeightToolResult {
  const length =
    requirePositive(
      input.length,
      'External length'
    );

  const width =
    requirePositive(
      input.width,
      'External width'
    );

  const height =
    requirePositive(
      input.height,
      'External height'
    );

  const divisorValue =
    requirePositive(
      input.divisorValue,
      'DIM divisor'
    );

  const dimensionsMm = {
    length: toMillimeters(
      length,
      input.dimensionUnit
    ),
    width: toMillimeters(
      width,
      input.dimensionUnit
    ),
    height: toMillimeters(
      height,
      input.dimensionUnit
    ),
  };

  const dimensionalWeightG =
    calculateDimensionalWeightG(
      dimensionsMm,
      {
        value: divisorValue,
        lengthUnit:
          input.divisorLengthUnit,
        massUnit:
          input.divisorMassUnit,
      }
    );

  const dimensionalWeight =
    fromGrams(
      dimensionalWeightG,
      input.divisorMassUnit
    );

  if (
    input.grossWeight === undefined
  ) {
    return {
      dimensionalWeightG,
      dimensionalWeight,
      outputMassUnit:
        input.divisorMassUnit,
    };
  }

  const grossWeight =
    requirePositive(
      input.grossWeight,
      'Actual gross weight'
    );

  const grossWeightUnit =
    input.grossWeightUnit ??
    input.divisorMassUnit;

  const grossWeightG =
    toGrams(
      grossWeight,
      grossWeightUnit
    );

  const chargeableWeightG =
    calculateChargeableWeightG(
      grossWeightG,
      dimensionalWeightG
    );

  return {
    dimensionalWeightG,
    dimensionalWeight,
    outputMassUnit:
      input.divisorMassUnit,
    grossWeightG,
    chargeableWeightG,
    chargeableWeight:
      fromGrams(
        chargeableWeightG,
        input.divisorMassUnit
      ),
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

function parseOptionalNumber(
  value: string
): number | undefined {
  if (value.trim() === '') {
    return undefined;
  }

  const parsed =
    Number(value);

  if (!Number.isFinite(parsed)) {
    throw new Error(
      'Actual gross weight must be a number.'
    );
  }

  return parsed;
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

export default function DimensionalWeightCalculator() {
  const [
    length,
    setLength,
  ] = useState('');

  const [
    width,
    setWidth,
  ] = useState('');

  const [
    height,
    setHeight,
  ] = useState('');

  const [
    dimensionUnit,
    setDimensionUnit,
  ] = useState<LengthUnit>('cm');

  const [
    divisorValue,
    setDivisorValue,
  ] = useState('');

  const [
    divisorLengthUnit,
    setDivisorLengthUnit,
  ] = useState<LengthUnit>('cm');

  const [
    divisorMassUnit,
    setDivisorMassUnit,
  ] = useState<MassUnit>('kg');

  const [
    grossWeight,
    setGrossWeight,
  ] = useState('');

  const [
    grossWeightUnit,
    setGrossWeightUnit,
  ] = useState<MassUnit>('kg');

  const [
    result,
    setResult,
  ] =
    useState<
      DimensionalWeightToolResult |
      null
    >(null);

  const [
    error,
    setError,
  ] =
    useState<string | null>(null);

  const submit = (
    event:
      SyntheticEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    try {
      const nextResult =
        calculateDimensionalWeightTool({
          length:
            parseRequiredNumber(
              length,
              'External length'
            ),
          width:
            parseRequiredNumber(
              width,
              'External width'
            ),
          height:
            parseRequiredNumber(
              height,
              'External height'
            ),
          dimensionUnit,
          divisorValue:
            parseRequiredNumber(
              divisorValue,
              'DIM divisor'
            ),
          divisorLengthUnit,
          divisorMassUnit,
          grossWeight:
            parseOptionalNumber(
              grossWeight
            ),
          grossWeightUnit,
        });

      setResult(nextResult);
      setError(null);
    } catch (caught) {
      setResult(null);

      setError(
        caught instanceof Error
          ? caught.message
          : 'Unable to calculate dimensional weight.'
      );
    }
  };

  return (
    <section
      className="pm-dim-tool"
      aria-labelledby="dim-tool-title"
    >
      <div className="pm-dim-tool-panel">
        <div className="pm-dim-tool-heading">
          <p className="pm-tool-kicker">
            Calculator
          </p>

          <h2 id="dim-tool-title">
            Calculate dimensional weight
          </h2>

          <p>
            Enter the package&apos;s external
            dimensions and the divisor supplied
            by the carrier, service, contract or
            workflow you are evaluating.
          </p>
        </div>

        <form
          className="pm-dim-tool-form"
          onSubmit={submit}
        >
          <fieldset>
            <legend>
              External package dimensions
            </legend>

            <div className="pm-dim-tool-grid">
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
                <span>Dimension unit</span>
                <select
                  value={dimensionUnit}
                  onChange={
                    event =>
                      setDimensionUnit(
                        event.currentTarget.value as LengthUnit
                      )
                  }
                >
                  {
                    LENGTH_UNITS.map(
                      unit => (
                        <option
                          key={unit.value}
                          value={unit.value}
                        >
                          {unit.label}
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
              DIM divisor
            </legend>

            <p className="pm-dim-tool-field-note">
              Packmetry does not assume a universal
              carrier divisor. Enter the value and
              unit semantics you actually need.
            </p>

            <div className="pm-dim-tool-grid">
              <label>
                <span>Divisor value</span>
                <input
                  type="number"
                  min="0"
                  step="any"
                  inputMode="decimal"
                  value={divisorValue}
                  onChange={
                    event =>
                      setDivisorValue(
                        event.currentTarget.value
                      )
                  }
                  placeholder="Enter your divisor"
                  required
                />
              </label>

              <label>
                <span>Divisor length unit</span>
                <select
                  value={divisorLengthUnit}
                  onChange={
                    event =>
                      setDivisorLengthUnit(
                        event.currentTarget.value as LengthUnit
                      )
                  }
                >
                  {
                    LENGTH_UNITS.map(
                      unit => (
                        <option
                          key={unit.value}
                          value={unit.value}
                        >
                          {unit.label}
                        </option>
                      )
                    )
                  }
                </select>
              </label>

              <label>
                <span>Divisor mass unit</span>
                <select
                  value={divisorMassUnit}
                  onChange={
                    event => {
                      const nextUnit =
                        event.currentTarget.value as MassUnit;

                      setDivisorMassUnit(
                        nextUnit
                      );

                      if (
                        grossWeight.trim() ===
                        ''
                      ) {
                        setGrossWeightUnit(
                          nextUnit
                        );
                      }
                    }
                  }
                >
                  {
                    MASS_UNITS.map(
                      unit => (
                        <option
                          key={unit.value}
                          value={unit.value}
                        >
                          {unit.label}
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
              Actual gross weight
              <span>optional</span>
            </legend>

            <p className="pm-dim-tool-field-note">
              Add the packed package&apos;s actual
              gross weight if you also want the
              base chargeable-weight comparison.
            </p>

            <div className="pm-dim-tool-grid pm-dim-tool-grid-optional">
              <label>
                <span>Actual gross weight</span>
                <input
                  type="number"
                  min="0"
                  step="any"
                  inputMode="decimal"
                  value={grossWeight}
                  onChange={
                    event =>
                      setGrossWeight(
                        event.currentTarget.value
                      )
                  }
                  placeholder="Optional"
                />
              </label>

              <label>
                <span>Weight unit</span>
                <select
                  value={grossWeightUnit}
                  onChange={
                    event =>
                      setGrossWeightUnit(
                        event.currentTarget.value as MassUnit
                      )
                  }
                >
                  {
                    MASS_UNITS.map(
                      unit => (
                        <option
                          key={unit.value}
                          value={unit.value}
                        >
                          {unit.label}
                        </option>
                      )
                    )
                  }
                </select>
              </label>
            </div>
          </fieldset>

          <button
            className="pm-dim-tool-submit"
            type="submit"
          >
            Calculate DIM weight
          </button>
        </form>
      </div>

      <aside
        className="pm-dim-tool-result"
        aria-live="polite"
      >
        <p className="pm-tool-kicker">
          Result
        </p>

        {
          error !== null ? (
            <div
              className="pm-dim-tool-error"
              role="alert"
            >
              {error}
            </div>
          ) : result === null ? (
            <div className="pm-dim-tool-empty">
              <strong>
                Your result will appear here.
              </strong>

              <p>
                The calculation uses external
                package dimensions and the
                explicit divisor you enter.
              </p>
            </div>
          ) : (
            <div className="pm-dim-tool-result-content">
              <div>
                <span>
                  Dimensional weight
                </span>

                <strong>
                  {
                    formatNumber(
                      result.dimensionalWeight
                    )
                  }{' '}
                  {result.outputMassUnit}
                </strong>
              </div>

              {
                result.chargeableWeight !==
                  undefined ? (
                  <div>
                    <span>
                      Estimated chargeable weight
                    </span>

                    <strong>
                      {
                        formatNumber(
                          result.chargeableWeight
                        )
                      }{' '}
                      {result.outputMassUnit}
                    </strong>
                  </div>
                ) : (
                  <p className="pm-dim-tool-result-note">
                    Add actual gross weight to
                    compare it with dimensional
                    weight.
                  </p>
                )
              }

              <p className="pm-dim-tool-result-note">
                No carrier billing rounding,
                service pricing, zone rules or
                shipping-rate calculation is
                applied.
              </p>
            </div>
          )
        }
      </aside>
    </section>
  );
}
