/**
 * Solver adapter contracts for Packmetry.
 *
 * @module solver/contracts
 */

import type { Item } from '../domain/item.js';
import type { Carton } from '../domain/carton.js';
import type { OptimizationObjective } from '../domain/objectives.js';
import type { ItemPlacement, PlanStatus } from '../domain/result.js';
import type { UnplacedItem, SolverMeta } from '../domain/plan-contracts.js';
import type { DimensionalWeightSettings } from '../units/dimensional-weight.js';

/**
 * Input to the solver adapter.
 *
 * Contains the items to pack, available cartons, optimization objective,
 * and optional dimensional-weight planning context.
 *
 * Dimensional-weight settings are planning/ranking context only.
 * The baseline solver must not change placement behavior because they exist.
 */
export interface SolverInput {
  items: Item[];
  cartons: Carton[];
  objective: OptimizationObjective;

  /**
   * Optional dimensional-weight settings.
   *
   * When absent, DIM-derived metrics remain unavailable.
   */
  dimensionalWeight?: DimensionalWeightSettings;
}

/**
 * Represents one carton instance in a solver candidate plan.
 */
export interface SolverCandidateCarton {
  cartonId: string;
  placements: ItemPlacement[];
}

/**
 * Candidate packing plan produced by a solver.
 *
 * This is the solver's claim before independent verification.
 */
export interface SolverCandidatePlan {
  status: PlanStatus;
  cartons: SolverCandidateCarton[];
  unplacedItems: UnplacedItem[];
}

/**
 * Output from the solver adapter.
 *
 * Contains one or more candidate plans and solver metadata.
 */
export interface SolverOutput {
  candidates: SolverCandidatePlan[];
  solverMeta: SolverMeta;
}

/**
 * Solver adapter interface.
 *
 * Async Promise contract is mandatory for Web Worker compatibility.
 */
export interface SolverAdapter {
  solve(input: SolverInput): Promise<SolverOutput>;
}