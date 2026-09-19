# Task, review, and Git workflow

Work on one narrow approved task at a time.

For each task:
1. Read only the repository context required by the task packet.
2. Inspect current state before editing.
3. Stay inside scope and do not modify unrelated files.
4. Do not weaken or delete tests merely to make validation pass.
5. Run the validation commands required by the task.
6. Fix failures caused by your changes when they remain in scope.
7. Inspect the final diff.
8. Return the required `READY_FOR_REVIEW` receipt.
9. STOP.

Git rule:
- NO autonomous commit.
- NO autonomous push.
- Do not stage unrelated files.
- The user commits/pushes only after ChatGPT review says `APPROVED_FOR_COMMIT`.

If blocked, return `STATUS: BLOCKED` with evidence and the exact decision needed instead of guessing.
