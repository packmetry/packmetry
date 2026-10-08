import {
  useState,
  type SyntheticEvent,
} from 'react';

import {
  normalizeDimensions,
  toMillimeters,
  volumeMm3,
  type LengthUnit,
} from '../core/units/index.js';

export interface BoxUtilizationToolInput {
  cartonLength: number;
  cartonWidth: number;
  cartonHeight: number;
  itemLength: number;
  itemWidth: number;
  itemHeight: number;
  quantity: number;
  unit: LengthUnit;
}

export interface BoxUtilizationToolResult {
  unit: LengthUnit;
  cartonVolumeMm3: number;
  requestedItemVolumeMm3: number;
  utilizationPercent: number;
  volumeExceedsCapacity: boolean;
  cartonVolume: number;
  requestedItemVolume: number;
  remainingVolume: number;
  excessVolume: number;
}

const LENGTH_UNITS: readonly {
  value: LengthUnit;
  label: string;
}[] = [
  { value: 'mm', label: 'Millimeters (mm)' },
  { value: 'cm', label: 'Centimeters (cm)' },
  { value: 'm', label: 'Meters (m)' },
  { value: 'in', label: 'Inches (in)' },
  { value: 'ft', label: 'Feet (ft)' },
];

function requireFiniteVolume(
  value: number
): number {
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(
      'Calculated volume is outside the supported numeric range.'
    );
  }

  return value;
}

export function calculateBoxUtilizationTool(
  input: BoxUtilizationToolInput
): BoxUtilizationToolResult {
  if (
    !Number.isSafeInteger(input.quantity) ||
    input.quantity < 1
  ) {
    throw new Error(
      'Quantity must be a positive whole number.'
    );
  }

  const cartonMm = normalizeDimensions(
    {
      length: input.cartonLength,
      width: input.cartonWidth,
      height: input.cartonHeight,
    },
    input.unit
  );

  const itemMm = normalizeDimensions(
    {
      length: input.itemLength,
      width: input.itemWidth,
      height: input.itemHeight,
    },
    input.unit
  );

  const cartonVolumeMm3 = requireFiniteVolume(
    volumeMm3(cartonMm)
  );

  const requestedItemVolumeMm3 = requireFiniteVolume(
    volumeMm3(itemMm) * input.quantity
  );

  const utilizationPercent =
    (requestedItemVolumeMm3 / cartonVolumeMm3) * 100;

  if (!Number.isFinite(utilizationPercent)) {
    throw new Error(
      'Calculated utilization is outside the supported numeric range.'
    );
  }

  // Remove tiny conversion-rounding differences around exact volume equality.
  const difference =
    cartonVolumeMm3 - requestedItemVolumeMm3;
  const relativeTolerance =
    Math.max(cartonVolumeMm3, requestedItemVolumeMm3) * 1e-12;
  const normalizedDifference =
    Math.abs(difference) <= relativeTolerance
      ? 0
      : difference;

  const cubicUnitInMm3 =
    toMillimeters(1, input.unit) ** 3;

  return {
    unit: input.unit,
    cartonVolumeMm3,
    requestedItemVolumeMm3,
    utilizationPercent,
    volumeExceedsCapacity: normalizedDifference < 0,
    cartonVolume: cartonVolumeMm3 / cubicUnitInMm3,
    requestedItemVolume:
      requestedItemVolumeMm3 / cubicUnitInMm3,
    remainingVolume:
      Math.max(0, normalizedDifference) / cubicUnitInMm3,
    excessVolume:
      Math.max(0, -normalizedDifference) / cubicUnitInMm3,
  };
}

function parseRequiredNumber(
  value: string,
  label: string
): number {
  if (value.trim() === '') {
    throw new Error(`${label} is required.`);
  }

  const parsed = Number(value);

  if (!Number.isFinite(parsed)) {
    throw new Error(`${label} must be a finite number.`);
  }

  return parsed;
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat('en', {
    maximumFractionDigits: 3,
  }).format(value);
}

export default function BoxUtilizationCalculator() {
  const [cartonLength, setCartonLength] = useState('');
  const [cartonWidth, setCartonWidth] = useState('');
  const [cartonHeight, setCartonHeight] = useState('');
  const [itemLength, setItemLength] = useState('');
  const [itemWidth, setItemWidth] = useState('');
  const [itemHeight, setItemHeight] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [unit, setUnit] = useState<LengthUnit>('cm');
  const [result, setResult] =
    useState<BoxUtilizationToolResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const submit = (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();

    try {
      const nextResult = calculateBoxUtilizationTool({
        cartonLength: parseRequiredNumber(
          cartonLength,
          'Internal carton length'
        ),
        cartonWidth: parseRequiredNumber(
          cartonWidth,
          'Internal carton width'
        ),
        cartonHeight: parseRequiredNumber(
          cartonHeight,
          'Internal carton height'
        ),
        itemLength: parseRequiredNumber(
          itemLength,
          'Item length'
        ),
        itemWidth: parseRequiredNumber(
          itemWidth,
          'Item width'
        ),
        itemHeight: parseRequiredNumber(
          itemHeight,
          'Item height'
        ),
        quantity: parseRequiredNumber(quantity, 'Quantity'),
        unit,
      });

      setResult(nextResult);
      setError(null);
    } catch (caught) {
      setResult(null);
      setError(
        caught instanceof Error
          ? caught.message
          : 'Unable to calculate volume utilization.'
      );
    }
  };

  return (
    <section
      className="pm-utilization-tool"
      aria-labelledby="utilization-tool-title"
    >
      <div className="pm-utilization-panel">
        <div className="pm-utilization-heading">
          <p className="pm-tool-kicker">Calculator</p>
          <h2 id="utilization-tool-title">
            Calculate carton volume utilization
          </h2>
          <p>
            Compare the volume of identical rectangular items
            with one carton&apos;s internal volume. This is a
            volume calculation, not a geometric packing test.
          </p>
        </div>

        <form
          className="pm-utilization-form"
          onSubmit={submit}
        >
          <fieldset>
            <legend>Carton internal dimensions</legend>
            <div className="pm-utilization-grid">
              <label>
                <span>Internal length</span>
                <input
                  type="number"
                  min="0"
                  step="any"
                  inputMode="decimal"
                  value={cartonLength}
                  onChange={event =>
                    setCartonLength(event.currentTarget.value)
                  }
                  required
                />
              </label>
              <label>
                <span>Internal width</span>
                <input
                  type="number"
                  min="0"
                  step="any"
                  inputMode="decimal"
                  value={cartonWidth}
                  onChange={event =>
                    setCartonWidth(event.currentTarget.value)
                  }
                  required
                />
              </label>
              <label>
                <span>Internal height</span>
                <input
                  type="number"
                  min="0"
                  step="any"
                  inputMode="decimal"
                  value={cartonHeight}
                  onChange={event =>
                    setCartonHeight(event.currentTarget.value)
                  }
                  required
                />
              </label>
              <label>
                <span>Measurement unit</span>
                <select
                  value={unit}
                  onChange={event =>
                    setUnit(event.currentTarget.value as LengthUnit)
                  }
                >
                  {LENGTH_UNITS.map(option => (
                    <option
                      key={option.value}
                      value={option.value}
                    >
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </fieldset>

          <fieldset>
            <legend>Identical items</legend>
            <p className="pm-utilization-field-note">
              Enter the dimensions of one item and the number
              of identical instances. Use the same measurement
              unit selected above.
            </p>
            <div className="pm-utilization-grid">
              <label>
                <span>Item length</span>
                <input
                  type="number"
                  min="0"
                  step="any"
                  inputMode="decimal"
                  value={itemLength}
                  onChange={event =>
                    setItemLength(event.currentTarget.value)
                  }
                  required
                />
              </label>
              <label>
                <span>Item width</span>
                <input
                  type="number"
                  min="0"
                  step="any"
                  inputMode="decimal"
                  value={itemWidth}
                  onChange={event =>
                    setItemWidth(event.currentTarget.value)
                  }
                  required
                />
              </label>
              <label>
                <span>Item height</span>
                <input
                  type="number"
                  min="0"
                  step="any"
                  inputMode="decimal"
                  value={itemHeight}
                  onChange={event =>
                    setItemHeight(event.currentTarget.value)
                  }
                  required
                />
              </label>
              <label>
                <span>Quantity</span>
                <input
                  type="number"
                  min="1"
                  step="1"
                  inputMode="numeric"
                  value={quantity}
                  onChange={event =>
                    setQuantity(event.currentTarget.value)
                  }
                  required
                />
              </label>
            </div>
          </fieldset>

          <button
            className="pm-utilization-submit"
            type="submit"
          >
            Calculate utilization
          </button>
        </form>
      </div>

      <aside
        className="pm-utilization-result"
        aria-live="polite"
      >
        <p className="pm-tool-kicker">Volume comparison</p>
        {error !== null ? (
          <div className="pm-utilization-error" role="alert">
            {error}
          </div>
        ) : result === null ? (
          <div className="pm-utilization-empty">
            <strong>Your result will appear here.</strong>
            <p>
              Only aggregate volume is compared. No geometric
              fit has been verified.
            </p>
          </div>
        ) : (
          <div className="pm-utilization-result-content">
            <div className="pm-utilization-primary">
              <span>Requested volume utilization</span>
              <strong>
                {formatNumber(result.utilizationPercent)}%
              </strong>
              <div
                className="pm-utilization-meter"
                role="img"
                aria-label={`Requested item volume is ${formatNumber(result.utilizationPercent)}% of carton internal volume`}
              >
                <span
                  style={{
                    width: `${Math.min(100, Math.max(0, result.utilizationPercent))}%`,
                  }}
                />
              </div>
            </div>
            <dl className="pm-utilization-metrics">
              <div>
                <dt>Internal carton volume</dt>
                <dd>
                  {formatNumber(result.cartonVolume)}{' '}
                  {result.unit}³
                </dd>
              </div>
              <div>
                <dt>Requested item volume</dt>
                <dd>
                  {formatNumber(result.requestedItemVolume)}{' '}
                  {result.unit}³
                </dd>
              </div>
              <div>
                <dt>
                  {result.volumeExceedsCapacity
                    ? 'Volume deficit'
                    : 'Unallocated volume (arithmetic)'}
                </dt>
                <dd>
                  {formatNumber(
                    result.volumeExceedsCapacity
                      ? result.excessVolume
                      : result.remainingVolume
                  )}{' '}
                  {result.unit}³
                </dd>
              </div>
            </dl>
            <p className="pm-utilization-result-note">
              {result.volumeExceedsCapacity
                ? 'Requested item volume exceeds the carton’s internal volume, so all items cannot fit in this carton.'
                : 'Requested volume does not exceed carton volume, but that does not prove the items can fit together without overlap.'}
            </p>
            <p className="pm-utilization-result-note">
              No packing positions, rotations, clearance,
              weight limits or inventory have been verified.
            </p>
          </div>
        )}
      </aside>
    </section>
  );
}
