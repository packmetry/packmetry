# Packmetry

Packmetry is a browser-first packing and cartonization decision workbench.

> Tell us what you are packing. We will figure out the boxes.

## Project authority

Before changing product behavior, architecture, design direction, or implementation strategy, read:

1. `docs/authority/PACKMETRY_NEW_PROJECT_CHAT_BOOTSTRAP.md` — highest repository project authority after an explicit current user instruction.
2. `docs/authority/CARTONLAB_ULTIMATE_PROJECT_SPECIFICATION.md` — detailed legacy product specification; interpret `CartonLab` as `Packmetry` unless the bootstrap explicitly says otherwise.
3. Accepted ADRs in `docs/decisions/`.
4. The current approved task packet.

The Packmetry bootstrap controls naming, workflow, design status, repository policy, and any override of the older CartonLab document.

## Important boundaries

- Final public brand: **Packmetry**
- Domain: **Packmetry.com**
- Repository: **packmetry**
- Personal and Business are two experiences on one shared engine.
- The three box-availability workflows are first-class product requirements.
- The packing engine must remain independent from React/UI and Three.js.
- Solver output must be independently verified before being presented as a successful packing result.
- Three.js visualizes the canonical verified result; it does not invent placements.
- Core free use remains browser-first with no mandatory backend or account.
- Do not claim globally optimal packing unless it is actually proven for the exact case.

## AI implementation workflow

Cline is the implementation agent, not the product owner.

For every meaningful task:

1. ChatGPT issues one narrow task packet.
2. Cline reads only the relevant repository context.
3. Cline implements and validates the approved scope.
4. Cline inspects its diff and returns `READY_FOR_REVIEW`.
5. Cline does **not** commit or push.
6. ChatGPT reviews the receipt/diff.
7. Only after approval does the user commit and push.

See `docs/process/AI_IMPLEMENTATION_WORKFLOW.md`.

## Current state

Repository/governance foundation only. Do not start the production UI or packing solver until the foundation task is reviewed and accepted.
