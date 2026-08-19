# CAPITAL-AI — Claude Adapter

**Adapter ID:** `ADAPTER-CLAUDE-001`  
**Status:** ACTIVE ADAPTER — non-authoritative  
**Repository trust root:** `/AGENTS.md`

This file contains **no independent repository-wide governance authority**.

Claude Code MUST read and obey `/AGENTS.md` before repository work. All global authority, security, data-integrity, branch, PR, CI, merge, documentation and production-mutation rules are resolved through that trust root and its stable authority/control registries.

If this adapter conflicts with `/AGENTS.md`, `/AGENTS.md` wins. If `/AGENTS.md` cannot be read or its governing authority cannot be resolved, protected work MUST stop fail-closed.

`.claude/` settings and hooks are execution-host configuration only. They MUST NOT be interpreted as permission to weaken, bypass, supersede or duplicate repository governance.

Claude may use provider-specific capabilities and connected tools only inside the authority and least-privilege boundaries resolved through `/AGENTS.md`. Model or provider identity never creates Owner, merge, deployment or production-mutation authority.
