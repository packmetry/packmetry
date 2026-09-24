import {
  createCarton,
  type Carton,
} from '../domain/carton.js';
import {
  validateItem,
  type Item,
} from '../domain/item.js';
import type { CanonicalDimensions } from '../units/types.js';
import { ValidationError } from '../units/types.js';

type PackingAxis = keyof CanonicalDimensions;

const PACKING_AXES: readonly PackingAxis[] = [
  'length',
  'width',
  'height',
];

function sumAlongAxis(
  items: readonly Item[],
  axis: PackingAxis
): number {
  return items.reduce(
    (total, item) =>
      total + item.dimensions[axis] * item.quantity,
    0
  );
}

function maxAlongAxis(
  items: readonly Item[],
  axis: PackingAxis
): number {
  return Math.max(
    ...items.map(item => item.dimensions[axis])
  );
}

function dimensionsForAxis(
  items: readonly Item[],
  packingAxis: PackingAxis
): CanonicalDimensions {
  return {
    length:
      packingAxis === 'length'
        ? sumAlongAxis(items, 'length')
        : maxAlongAxis(items, 'length'),
    width:
      packingAxis === 'width'
        ? sumAlongAxis(items, 'width')
        : maxAlongAxis(items, 'width'),
    height:
      packingAxis === 'height'
        ? sumAlongAxis(items, 'height')
        : maxAlongAxis(items, 'height'),
  };
}

function dimensionsKey(
  dimensions: CanonicalDimensions
): string {
  return [
    dimensions.length,
    dimensions.width,
    dimensions.height,
  ].join('|');
}

/**
 * Generate deterministic purchase-carton candidates for Mode 1
 * ("I Need Boxes").
 *
 * The v1 policy deliberately uses simple exact internal-dimension
 * recommendations. For each canonical axis, it creates a row layout:
 *
 * - lengthwise: sum item-instance lengths, max width, max height
 * - widthwise: max length, sum item-instance widths, max height
 * - heightwise: max length, max width, sum item-instance heights
 *
 * The candidates are only carton definitions. They do not claim that a
 * supplier stocks the size and they do not invent cost, tare weight,
 * availability, supplier, external dimensions, or hidden padding.
 *
 * Duplicate dimension triples are removed while preserving deterministic
 * axis order.
 */
export function generatePurchaseCartonCandidates(
  items: readonly Item[]
): Carton[] {
  if (items.length === 0) {
    throw new ValidationError(
      'Purchase carton candidate generation requires at least one item'
    );
  }

  for (const item of items) {
    validateItem(item);
  }

  const seen = new Set<string>();
  const dimensions: CanonicalDimensions[] = [];

  for (const axis of PACKING_AXES) {
    const candidateDimensions = dimensionsForAxis(
      items,
      axis
    );

    const key = dimensionsKey(candidateDimensions);

    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    dimensions.push(candidateDimensions);
  }

  return dimensions.map((internalDimensions, index) =>
    createCarton({
      id: `purchase-carton-${index + 1}`,
      name: `Recommended box ${index + 1}`,
      internalDimensions,
    })
  );
}
