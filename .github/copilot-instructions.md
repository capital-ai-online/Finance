# CAPITAL-AI — GitHub Copilot Adapter

**Adapter ID:** `ADAPTER-GITHUB-COPILOT-001`  
**Status:** ACTIVE ADAPTER — non-authoritative  
**Repository trust root:** `/AGENTS.md`

GitHub Copilot MUST read and obey `/AGENTS.md` as the single repository-wide agent trust root before proposing or applying repository changes.

This adapter creates no independent governance authority. It MUST NOT weaken, duplicate or supersede global rules from `/AGENTS.md` or its stable authority/control registries.

If any Copilot instruction, generated suggestion or host behavior conflicts with `/AGENTS.md`, `/AGENTS.md` wins. If the trust root cannot be resolved, protected work stops fail-closed.
