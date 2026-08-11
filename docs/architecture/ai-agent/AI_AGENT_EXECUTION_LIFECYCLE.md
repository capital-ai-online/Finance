# AI Agent Execution Lifecycle

`REQUEST -> IDENTITY -> EVIDENCE -> RISK -> POLICY -> PLAN -> ISOLATED EXECUTION -> VALIDATION -> ATTEST -> REVIEW -> RELEASE -> VERIFY`

Each transition emits correlation/audit evidence. Read-first is mandatory. Agent write occurs only on isolated branch/workspace. Merge and production release remain independent gates. Failed authorization stops before tool execution. Failed validation returns to plan/fix without privilege escalation.