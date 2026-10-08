import { useState, type SyntheticEvent } from 'react';

import {
  normalizeDimensions,
  volumeMm3,
  type CanonicalDimensions,
  type LengthUnit,
} from '../core/units/index.js';
import type { RotationPolicy } from '../core/domain/constraints.js';
import {
  getRotatedDimensions,
  type PlacementRotation,
} from '../core/domain/result.js';

export interface ItemsFitToolInput {
  cartonLength: number;
  cartonWidth: number;
  cartonHeight: number;
  itemLength: number;
  itemWidth: number;
  itemHeight: number;
  unit: LengthUnit;
  rotationPolicy: RotationPolicy;
  requestedQuantity?: number;
}

export interface ItemsFitToolResult {
  gridCapacity: number;
  rotation: PlacementRotation;
  countAlongLength: number;
  countAlongWidth: number;
  countAlongHeight: number;
  gridUtilizationPercent: number;
  requestedQuantityFitsGrid?: boolean;
}

const ROTATIONS_BY_POLICY: Record<
  RotationPolicy,
  readonly PlacementRotation[]
> = {
  any: ['LWH', 'WLH', 'LHW', 'HLW', 'WHL', 'HWL'],
  upright: ['LWH', 'WLH'],
  'vertical-axis-only': ['LWH', 'WLH'],
  fixed: ['LWH'],
};

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

const ROTATION_OPTIONS: readonly {
  value: RotationPolicy;
  label: string;
}[] = [
  { value: 'any', label: 'Any orientation' },
  { value: 'upright', label: 'Keep height upright' },
  { value: 'vertical-axis-only', label: 'Vertical-axis only' },
  { value: 'fixed', label: 'Fixed orientation' },
];

function requireFiniteDimensions(
  dimensions: CanonicalDimensions
): CanonicalDimensions {
  if (
    Object.values(dimensions).some(
      value => !Number.isFinite(value) || value <= 0
    )
  ) {
    throw new Error('Dimensions are outside the supported numeric range.');
  }
  return dimensions;
}

function requireFiniteVolume(value: number): number {
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error('Volume is outside the supported numeric range.');
  }
  return value;
}

export function calculateHowManyItemsFitTool(
  input: ItemsFitToolInput
): ItemsFitToolResult {
  if (
    input.requestedQuantity !== undefined &&
    (!Number.isSafeInteger(input.requestedQuantity) ||
      input.requestedQuantity < 1)
  ) {
    throw new Error('Requested quantity must be a positive whole number.');
  }

  const carton = requireFiniteDimensions(
    normalizeDimensions(
      {
        length: input.cartonLength,
        width: input.cartonWidth,
        height: input.cartonHeight,
      },
      input.unit
    )
  );
  const item = requireFiniteDimensions(
    normalizeDimensions(
      {
        length: input.itemLength,
        width: input.itemWidth,
        height: input.itemHeight,
      },
      input.unit
    )
  );

  const cartonVolumeMm3 = requireFiniteVolume(volumeMm3(carton));
  const itemVolumeMm3 = requireFiniteVolume(volumeMm3(item));
  const rotations = ROTATIONS_BY_POLICY[input.rotationPolicy];

  if (!rotations) {
    throw new Error('Unsupported rotation policy.');
  }

  let best: Omit<ItemsFitToolResult, 'requestedQuantityFitsGrid'> = {
    gridCapacity: 0,
    rotation: rotations[0]!,
    countAlongLength: 0,
    countAlongWidth: 0,
    countAlongHeight: 0,
    gridUtilizationPercent: 0,
  };

  for (const rotation of rotations) {
    const oriented = getRotatedDimensions(item, rotation);
    const alongLength = Math.floor(carton.length / oriented.length);
    const alongWidth = Math.floor(carton.width / oriented.width);
    const alongHeight = Math.floor(carton.height / oriented.height);
    const gridCapacity = alongLength * alongWidth * alongHeight;

    if (!Number.isSafeInteger(gridCapacity)) {
      throw new Error('Grid quantity is outside the supported numeric range.');
    }

    // Stable tie-break: retain the first allowed orientation.
    if (gridCapacity > best.gridCapacity) {
      const packedVolumeMm3 = itemVolumeMm3 * gridCapacity;
      if (!Number.isFinite(packedVolumeMm3)) {
        throw new Error('Packed volume is outside the supported numeric range.');
      }
      best = {
        gridCapacity,
        rotation,
        countAlongLength: alongLength,
        countAlongWidth: alongWidth,
        countAlongHeight: alongHeight,
        gridUtilizationPercent: Math.min(
          100,
          (packedVolumeMm3 / cartonVolumeMm3) * 100
        ),
      };
    }
  }

  if (input.requestedQuantity === undefined) {
    return best;
  }

  return {
    ...best,
    requestedQuantityFitsGrid:
      input.requestedQuantity <= best.gridCapacity,
  };
}

function parseNumber(value: string, label: string): number {
  if (value.trim() === '') {
    throw new Error(`${label} is required.`);
  }
  const number = Number(value);
  if (!Number.isFinite(number)) {
    throw new Error(`${label} must be a finite number.`);
  }
  return number;
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat('en', {
    maximumFractionDigits: 2,
  }).format(value);
}

export default function HowManyItemsFitCalculator() {
  const [cartonLength, setCartonLength] = useState('');
  const [cartonWidth, setCartonWidth] = useState('');
  const [cartonHeight, setCartonHeight] = useState('');
  const [itemLength, setItemLength] = useState('');
  const [itemWidth, setItemWidth] = useState('');
  const [itemHeight, setItemHeight] = useState('');
  const [unit, setUnit] = useState<LengthUnit>('cm');
  const [rotationPolicy, setRotationPolicy] =
    useState<RotationPolicy>('any');
  const [requestedQuantity, setRequestedQuantity] = useState('');
  const [result, setResult] = useState<ItemsFitToolResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const submit = (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      const next = calculateHowManyItemsFitTool({
        cartonLength: parseNumber(cartonLength, 'Carton length'),
        cartonWidth: parseNumber(cartonWidth, 'Carton width'),
        cartonHeight: parseNumber(cartonHeight, 'Carton height'),
        itemLength: parseNumber(itemLength, 'Item length'),
        itemWidth: parseNumber(itemWidth, 'Item width'),
        itemHeight: parseNumber(itemHeight, 'Item height'),
        unit,
        rotationPolicy,
        ...(requestedQuantity.trim() !== ''
          ? {
              requestedQuantity: parseNumber(
                requestedQuantity,
                'Requested quantity'
              ),
            }
          : {}),
      });
      setResult(next);
      setError(null);
    } catch (caught) {
      setResult(null);
      setError(
        caught instanceof Error
          ? caught.message
          : 'Unable to calculate regular-grid fit.'
      );
    }
  };

  return (
    <section
      className="pm-utilization-tool"
      aria-labelledby="items-fit-title"
    >
      <div className="pm-utilization-panel">
        <div className="pm-utilization-heading">
          <p className="pm-tool-kicker">Calculator</p>
          <h2 id="items-fit-title">Estimate identical-item grid capacity</h2>
          <p>
            Try each permitted orientation in a uniform rectangular grid.
            The result is a constructible grid estimate, not a proof of
            the greatest possible number of items.
          </p>
        </div>

        <form className="pm-utilization-form" onSubmit={submit}>
          <fieldset>
            <legend>Carton internal dimensions</legend>
            <div className="pm-utilization-grid">
              <label>
                <span>Length</span>
                <input type="number" min="0" step="any" required
                  value={cartonLength}
                  onChange={e => setCartonLength(e.currentTarget.value)} />
              </label>
              <label>
                <span>Width</span>
                <input type="number" min="0" step="any" required
                  value={cartonWidth}
                  onChange={e => setCartonWidth(e.currentTarget.value)} />
              </label>
              <label>
                <span>Height</span>
                <input type="number" min="0" step="any" required
                  value={cartonHeight}
                  onChange={e => setCartonHeight(e.currentTarget.value)} />
              </label>
              <label>
                <span>Unit</span>
                <select value={unit}
                  onChange={e => setUnit(e.currentTarget.value as LengthUnit)}>
                  {LENGTH_UNITS.map(option => (
                    <option value={option.value} key={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </fieldset>

          <fieldset>
            <legend>Identical item dimensions</legend>
            <div className="pm-utilization-grid">
              <label>
                <span>Length</span>
                <input type="number" min="0" step="any" required
                  value={itemLength}
                  onChange={e => setItemLength(e.currentTarget.value)} />
              </label>
              <label>
                <span>Width</span>
                <input type="number" min="0" step="any" required
                  value={itemWidth}
                  onChange={e => setItemWidth(e.currentTarget.value)} />
              </label>
              <label>
                <span>Height</span>
                <input type="number" min="0" step="any" required
                  value={itemHeight}
                  onChange={e => setItemHeight(e.currentTarget.value)} />
              </label>
              <label>
                <span>Rotation policy</span>
                <select value={rotationPolicy}
                  onChange={e =>
                    setRotationPolicy(e.currentTarget.value as RotationPolicy)
                  }>
                  {ROTATION_OPTIONS.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </fieldset>

          <fieldset>
            <legend>Optional quantity comparison</legend>
            <p className="pm-utilization-field-note">
              Enter a requested item count to compare against this grid
              arrangement, or leave it blank.
            </p>
            <div className="pm-utilization-grid">
              <label>
                <span>Requested quantity</span>
                <input type="number" min="1" step="1"
                  value={requestedQuantity}
                  onChange={e => setRequestedQuantity(e.currentTarget.value)} />
              </label>
            </div>
          </fieldset>

          <button className="pm-utilization-submit" type="submit">
            Calculate grid fit
          </button>
        </form>
      </div>

      <aside className="pm-utilization-result" aria-live="polite">
        <p className="pm-tool-kicker">Result</p>
        {error !== null ? (
          <div className="pm-utilization-error" role="alert">{error}</div>
        ) : result === null ? (
          <div className="pm-utilization-empty">
            <strong>Regular-grid estimate will appear here.</strong>
            <p>Enter the box interior and identical item dimensions.</p>
          </div>
        ) : (
          <div className="pm-utilization-result-content">
            <div className="pm-utilization-primary">
              <span>Items in the best evaluated uniform grid</span>
              <strong>{formatNumber(result.gridCapacity)}</strong>
            </div>
            <dl className="pm-utilization-metrics">
              <div>
                <dt>Items along length × width × height</dt>
                <dd>
                  {result.countAlongLength} × {result.countAlongWidth}
                  {' × '}{result.countAlongHeight}
                </dd>
              </div>
              <div>
                <dt>Selected rotation</dt>
                <dd>{result.rotation}</dd>
              </div>
              <div>
                <dt>Grid volume utilization</dt>
                <dd>{formatNumber(result.gridUtilizationPercent)}%</dd>
              </div>
              {result.requestedQuantityFitsGrid !== undefined && (
                <div>
                  <dt>Requested quantity in this grid</dt>
                  <dd>
                    {result.requestedQuantityFitsGrid
                      ? 'Fits the evaluated grid'
                      : 'Exceeds evaluated grid capacity'}
                  </dd>
                </div>
              )}
            </dl>
            <p className="pm-utilization-result-note">
              A uniform, same-orientation grid only. Mixed rotations,
              other layouts, protective spacing, weight and handling
              constraints are not evaluated. This is not a guaranteed
              maximum or a verified PackingPlan.
            </p>
          </div>
        )}
      </aside>
    </section>
  );
}
