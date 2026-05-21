# /checkpoint

Create a git checkpoint for current NextViz work.

**Usage:** `/checkpoint <description>`
**Example:** `/checkpoint add HTTP Request Tier 2 authentication support`

---

## Protocol

1. Run `git status` to see what changed
2. Stage only relevant files:
   ```bash
   git add flows/ .env.nextviz.example app/nextviz/ lib/nextviz/ components/nextviz/ docs/
   ```
   Do not stage: `.env.nextviz`, `node_modules`, `.next/`
3. Commit with standard prefix:
   ```bash
   git commit -m "nextviz: $ARGUMENTS"
   ```
4. Show the commit hash and summary to confirm
