# Packmetry AI Implementation Workflow

This is a concise operational guide derived from the Packmetry bootstrap. It does not override the bootstrap.

## Roles

### ChatGPT
Architect, planner, reviewer, and gatekeeper. Defines one narrow task, scope, acceptance criteria, validation, and correction work.

### Cline in VS Code
Implementation agent. Reads relevant context, edits files, runs allowed commands/tests, inspects its diff, and returns a receipt. It stops before commit/push.

### User
Human control layer. Approves task execution, credentials/external accounts, local tool approvals, and commit/push timing.

### GitHub
Durable reviewed source of truth. Only reviewed work should be pushed.

## Normal loop

1. Accepted repo state + authority docs.
2. ChatGPT issues ONE task packet.
3. User pastes the packet into a fresh/focused Cline task when appropriate.
4. Cline implements only that task.
5. Cline validates and inspects the diff.
6. Cline returns `READY_FOR_REVIEW`; no commit and no push.
7. User sends the receipt/diff to ChatGPT.
8. ChatGPT returns either `CORRECTIONS_REQUIRED` or `APPROVED_FOR_COMMIT`.
9. Only after approval does the user stage, commit, and push.
10. Pushed GitHub state is verified before the task is accepted.

## Required task packet shape

```text
TASK ID:
OBJECTIVE:
AUTHORITY:
READ FIRST:
IN SCOPE:
OUT OF SCOPE:
REQUIREMENTS:
ARCHITECTURAL CONSTRAINTS:
DEPENDENCIES:
TESTS TO ADD OR UPDATE:
VALIDATION COMMANDS:
ACCEPTANCE CRITERIA:
STOP CONDITIONS:
GIT RULE: No commit. No push. Stop for review.
REQUIRED RECEIPT: READY_FOR_REVIEW structured report.
```

## Required completion receipt

```text
STATUS: READY_FOR_REVIEW
TASK:
FILES_CHANGED:
IMPLEMENTED:
TESTS_ADDED_OR_UPDATED:
COMMANDS_RUN:
VALIDATION:
KNOWN_LIMITATIONS:
DEPENDENCIES_CHANGED:
OUT_OF_SCOPE_CHANGES:
GIT_STATUS:
- uncommitted changes present
- NO COMMIT
- NO PUSH
READY_FOR_REVIEW: YES
```

If blocked, return:

```text
STATUS: BLOCKED
BLOCKER:
EVIDENCE:
DECISION_NEEDED:
NO COMMIT
NO PUSH
```

## Scope discipline

Prefer one contract, one small module, one component, one validation layer, one bug, or one narrow refactor per task. Do not issue "build the website" or "build the whole packing engine" as one task.
