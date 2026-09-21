import { describe, it, expect } from 'vitest';

import type { SolverInput, SolverCandidateCarton, SolverCandidatePlan, SolverOutput, SolverAdapter } from '../core/solver/contracts.js';
import type { Item } from '../core/domain/item.js';
import type { Carton } from '../core/domain/carton.js';
import type { OptimizationObjective } from '../core/domain/objectives.js';
import type { ItemPlacement, PlanStatus } from '../core/domain/result.js';
import type { UnplacedItem, SolverMeta } from '../core/domain/plan-contracts.js';

describe('solver contracts', () => {
  describe('SolverInput', () => {
    it('can be constructed with valid domain types', () => {
      const item: Item = {
        id: 'item-1',
        dimensions: { length: 100, width: 50, height: 30 },
        quantity: 1,
        constraints: {
          rotationPolicy: 'any',
          fragile: false,
          paddingAllowanceMm: 0,
          spacingAllowanceMm: 0,
          stackable: true,
        },
      };

      const carton: Carton = {
        id: 'carton-1',
        internalDimensions: { length: 200, width: 100, height: 150 },
      };

      const objective: OptimizationObjective = {
        kind: 'fewest-cartons',
      };

      const input: SolverInput = {
        items: [item],
        cartons: [carton],
        objective,
      };

      expect(input).toBeDefined();
      expect(input.items).toHaveLength(1);
      expect(input.cartons).toHaveLength(1);
      expect(input.objective.kind).toBe('fewest-cartons');
    });
  });

  describe('SolverCandidateCarton', () => {
    it('can be constructed with valid data', () => {
      const placement: ItemPlacement = {
        itemId: 'item-1',
        instanceIndex: 0,
        x: 0,
        y: 0,
        z: 0,
        length: 100,
        width: 50,
        height: 30,
        rotation: 'LWH',
      };

      const candidateCarton: SolverCandidateCarton = {
        cartonId: 'carton-1',
        placements: [placement],
      };

      expect(candidateCarton).toBeDefined();
      expect(candidateCarton.cartonId).toBe('carton-1');
      expect(candidateCarton.placements).toHaveLength(1);
    });
  });

  describe('SolverCandidatePlan', () => {
    it('can be constructed with all PlanStatus values', () => {
      const statuses: PlanStatus[] = ['feasible', 'partial', 'infeasible', 'limit_reached'];

      statuses.forEach((status) => {
        const candidateCarton: SolverCandidateCarton = {
          cartonId: 'carton-1',
          placements: [],
        };

        const unplacedItem: UnplacedItem = {
          itemId: 'item-1',
          instanceIndex: 0,
          reason: 'no-fitting-carton',
        };

        const candidatePlan: SolverCandidatePlan = {
          status,
          cartons: [candidateCarton],
          unplacedItems: [unplacedItem],
        };

        expect(candidatePlan.status).toBe(status);
        expect(candidatePlan.cartons).toHaveLength(1);
        expect(candidatePlan.unplacedItems).toHaveLength(1);
      });
    });

    it('can be constructed with empty arrays', () => {
      const candidatePlan: SolverCandidatePlan = {
        status: 'feasible',
        cartons: [],
        unplacedItems: [],
      };

      expect(candidatePlan).toBeDefined();
      expect(candidatePlan.cartons).toHaveLength(0);
      expect(candidatePlan.unplacedItems).toHaveLength(0);
    });
  });

  describe('SolverOutput', () => {
    it('can be constructed with valid data', () => {
      const candidatePlan: SolverCandidatePlan = {
        status: 'feasible',
        cartons: [],
        unplacedItems: [],
      };

      const solverMeta: SolverMeta = {
        solverId: 'test-solver',
        solverVersion: '1.0.0',
        durationMs: 100,
        deterministic: true,
      };

      const output: SolverOutput = {
        candidates: [candidatePlan],
        solverMeta,
      };

      expect(output).toBeDefined();
      expect(output.candidates).toHaveLength(1);
      expect(output.solverMeta.solverId).toBe('test-solver');
      expect(output.solverMeta.durationMs).toBe(100);
      expect(output.solverMeta.deterministic).toBe(true);
    });
  });

  describe('SolverAdapter', () => {
    it('can be implemented as a mock', async () => {
      const mockAdapter: SolverAdapter = {
        solve: async (input: SolverInput): Promise<SolverOutput> => {
          // Use input to show it's being read
          expect(input).toBeDefined();

          const candidatePlan: SolverCandidatePlan = {
            status: 'feasible',
            cartons: [],
            unplacedItems: [],
          };

          const solverMeta: SolverMeta = {
            solverId: 'mock-solver',
            durationMs: 50,
            deterministic: true,
          };

          return {
            candidates: [candidatePlan],
            solverMeta,
          };
        },
      };

      const input: SolverInput = {
        items: [],
        cartons: [],
        objective: { kind: 'balanced' },
      };

      const result = await mockAdapter.solve(input);

      expect(result).toBeDefined();
      expect(result.candidates).toHaveLength(1);
      expect(result.candidates[0]?.status).toBe('feasible');
      expect(result.solverMeta.solverId).toBe('mock-solver');
    });

    it('returns Promise<SolverOutput> as required by interface', () => {
      const mockAdapter: SolverAdapter = {
        solve: async (input: SolverInput) => {
          // Use input to show it's being read
          expect(input).toBeDefined();

          return {
            candidates: [],
            solverMeta: {
              solverId: 'test',
              durationMs: 0,
              deterministic: false,
            },
          };
        },
      };

      const result = mockAdapter.solve({} as SolverInput);

      expect(result).toBeInstanceOf(Promise);
    });
  });
});