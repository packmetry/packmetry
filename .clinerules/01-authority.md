# Packmetry authority rule

Before any product, architecture, design, or implementation decision, apply this hierarchy:

1. Explicit current user instruction in the active task.
2. `docs/authority/PACKMETRY_NEW_PROJECT_CHAT_BOOTSTRAP.md`.
3. Accepted ADRs in `docs/decisions/`.
4. The current approved ChatGPT implementation task packet.
5. `docs/authority/CARTONLAB_ULTIMATE_PROJECT_SPECIFICATION.md` for detailed legacy product requirements not overridden by the Packmetry bootstrap.
6. Existing accepted tests/contracts.
7. Current implementation.
8. AI assumptions.

Rules:
- `CartonLab` in the legacy product specification means `Packmetry` unless explicitly historical.
- Never let an old CartonLab helper file override the Packmetry bootstrap.
- Do not invent a product rule when the authority is materially ambiguous. Stop and report the ambiguity.
- Do not silently remove, merge, reinterpret, or simplify a requirement.
- Do not reopen the Packmetry brand/domain decision unless the user explicitly asks.
