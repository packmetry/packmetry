import {
  describe,
  expect,
  it,
} from 'vitest';

import {
  calculateChargeableWeightG,
  calculateDimensionalWeightG,
  validateDimensionalWeightDivisor,
  type DimensionalWeightDivisor,
} from '../core/units/dimensional-weight.js';

import {
  ValidationError,
} from '../core/units/types.js';

describe(
  'dimensional-weight calculations',
  () => {
    describe(
      'validateDimensionalWeightDivisor',
      () => {
        it(
          'accepts a valid explicit divisor with units',
          () => {
            expect(() =>
              validateDimensionalWeightDivisor(
                {
                  value: 1000,
                  lengthUnit:
                    'cm',
                  massUnit:
                    'kg',
                }
              )
            ).not.toThrow();
          }
        );

        it(
          'rejects a non-object divisor',
          () => {
            expect(() =>
              validateDimensionalWeightDivisor(
                null
              )
            ).toThrow(
              ValidationError
            );

            expect(() =>
              validateDimensionalWeightDivisor(
                1000
              )
            ).toThrow(
              ValidationError
            );
          }
        );

        it(
          'rejects non-finite, zero, and negative divisor values',
          () => {
            const invalidValues = [
              NaN,
              Infinity,
              -Infinity,
              0,
              -1,
            ];

            for (
              const value
              of invalidValues
            ) {
              expect(() =>
                validateDimensionalWeightDivisor(
                  {
                    value,
                    lengthUnit:
                      'cm',
                    massUnit:
                      'kg',
                  }
                )
              ).toThrow(
                ValidationError
              );
            }
          }
        );

        it(
          'rejects invalid length-unit semantics',
          () => {
            expect(() =>
              validateDimensionalWeightDivisor(
                {
                  value: 1000,
                  lengthUnit:
                    'yards',
                  massUnit:
                    'kg',
                }
              )
            ).toThrow(
              ValidationError
            );
          }
        );

        it(
          'rejects invalid mass-unit semantics',
          () => {
            expect(() =>
              validateDimensionalWeightDivisor(
                {
                  value: 1000,
                  lengthUnit:
                    'cm',
                  massUnit:
                    'stone',
                }
              )
            ).toThrow(
              ValidationError
            );
          }
        );
      }
    );

    describe(
      'calculateDimensionalWeightG',
      () => {
        it(
          'calculates DIM weight using explicit centimeter and kilogram divisor semantics',
          () => {
            const divisor: DimensionalWeightDivisor =
              {
                value: 1000,
                lengthUnit:
                  'cm',
                massUnit:
                  'kg',
              };

            const result =
              calculateDimensionalWeightG(
                {
                  length: 100,
                  width: 100,
                  height: 100,
                },
                divisor
              );

            expect(
              result
            ).toBe(1000);
          }
        );

        it(
          'converts the divisor result into canonical grams',
          () => {
            const divisor: DimensionalWeightDivisor =
              {
                value: 1,
                lengthUnit:
                  'in',
                massUnit:
                  'oz',
              };

            const result =
              calculateDimensionalWeightG(
                {
                  length: 25.4,
                  width: 25.4,
                  height: 25.4,
                },
                divisor
              );

            expect(
              result
            ).toBeCloseTo(
              28.349523125,
              10
            );
          }
        );

        it(
          'supports millimeter divisor semantics without unit assumptions',
          () => {
            const result =
              calculateDimensionalWeightG(
                {
                  length: 10,
                  width: 20,
                  height: 30,
                },
                {
                  value: 6000,
                  lengthUnit:
                    'mm',
                  massUnit:
                    'g',
                }
              );

            expect(
              result
            ).toBe(1);
          }
        );

        it(
          'does not apply carrier-style billing rounding',
          () => {
            const result =
              calculateDimensionalWeightG(
                {
                  length: 100,
                  width: 100,
                  height: 150,
                },
                {
                  value: 1000,
                  lengthUnit:
                    'cm',
                  massUnit:
                    'kg',
                }
              );

            expect(
              result
            ).toBe(1500);
          }
        );

        it(
          'rejects invalid canonical package dimensions',
          () => {
            expect(() =>
              calculateDimensionalWeightG(
                {
                  length: 0,
                  width: 100,
                  height: 100,
                },
                {
                  value: 1000,
                  lengthUnit:
                    'cm',
                  massUnit:
                    'kg',
                }
              )
            ).toThrow(
              ValidationError
            );

            expect(() =>
              calculateDimensionalWeightG(
                {
                  length: NaN,
                  width: 100,
                  height: 100,
                },
                {
                  value: 1000,
                  lengthUnit:
                    'cm',
                  massUnit:
                    'kg',
                }
              )
            ).toThrow(
              ValidationError
            );
          }
        );

        it(
          'rejects an invalid divisor during calculation',
          () => {
            expect(() =>
              calculateDimensionalWeightG(
                {
                  length: 100,
                  width: 100,
                  height: 100,
                },
                {
                  value: 0,
                  lengthUnit:
                    'cm',
                  massUnit:
                    'kg',
                }
              )
            ).toThrow(
              ValidationError
            );
          }
        );

        it(
          'does not mutate dimensions or divisor input',
          () => {
            const dimensions = {
              length: 100,
              width: 200,
              height: 300,
            };

            const divisor: DimensionalWeightDivisor =
              {
                value: 1000,
                lengthUnit:
                  'cm',
                massUnit:
                  'kg',
              };

            const dimensionsBefore =
              structuredClone(
                dimensions
              );

            const divisorBefore =
              structuredClone(
                divisor
              );

            calculateDimensionalWeightG(
              dimensions,
              divisor
            );

            expect(
              dimensions
            ).toEqual(
              dimensionsBefore
            );

            expect(
              divisor
            ).toEqual(
              divisorBefore
            );
          }
        );
      }
    );

    describe(
      'calculateChargeableWeightG',
      () => {
        it(
          'returns actual gross weight when it is greater',
          () => {
            expect(
              calculateChargeableWeightG(
                5000,
                3200
              )
            ).toBe(5000);
          }
        );

        it(
          'returns dimensional weight when it is greater',
          () => {
            expect(
              calculateChargeableWeightG(
                3200,
                5000
              )
            ).toBe(5000);
          }
        );

        it(
          'returns the shared value when both weights are equal',
          () => {
            expect(
              calculateChargeableWeightG(
                4000,
                4000
              )
            ).toBe(4000);
          }
        );

        it(
          'allows zero as a valid derived weight',
          () => {
            expect(
              calculateChargeableWeightG(
                0,
                0
              )
            ).toBe(0);
          }
        );

        it(
          'rejects negative or non-finite weights',
          () => {
            expect(() =>
              calculateChargeableWeightG(
                -1,
                100
              )
            ).toThrow(
              ValidationError
            );

            expect(() =>
              calculateChargeableWeightG(
                100,
                -1
              )
            ).toThrow(
              ValidationError
            );

            expect(() =>
              calculateChargeableWeightG(
                NaN,
                100
              )
            ).toThrow(
              ValidationError
            );

            expect(() =>
              calculateChargeableWeightG(
                100,
                Infinity
              )
            ).toThrow(
              ValidationError
            );
          }
        );
      }
    );
  }
);