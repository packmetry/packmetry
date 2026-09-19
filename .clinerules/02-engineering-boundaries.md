# Packmetry engineering boundaries

- Personal and Business are two experiences over one normalized domain model and one packing engine.
- Preserve all three box-availability workflows: need boxes; have boxes; hybrid use-existing-then-buy-remainder.
- Keep the packing engine independent from React, page components, Three.js, analytics, and storage implementations.
- Put any third-party or in-house solver behind an internal solver adapter.
- Never trust solver output solely because the solver produced it; independently verify boundaries, overlaps, quantities, rotations, weight limits, missing items, inventory usage, and metric consistency where applicable.
- Normalize dimensions and weights internally to canonical units.
- Three.js may visualize only the canonical verified result and must not perform a hidden second packing calculation.
- Core free use is browser-first and has no mandatory account/backend.
- Do not add paid APIs, recurring paid infrastructure, accounts, or server-side compute without explicit approval.
- Do not call heuristic results guaranteed optimal unless the exact scenario is provably optimal.
- Add dependencies only when authorized by the current task; verify maintenance and license before major adoption.
