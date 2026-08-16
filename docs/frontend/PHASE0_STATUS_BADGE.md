# Phase 0 — StatusBadge Primitive

**Status:** IMPLEMENTED (multiple call sites)  
**Stand:** 16. August 2026  
**Code:** `src/components/StatusBadge.tsx`  
**Spec:** `docs/frontend/PHASE0_LOADING_ERROR_STATES.md`

---

## API

```tsx
import { StatusBadge } from './StatusBadge';

<StatusBadge status="READY" />
<StatusBadge status="DATA_UNAVAILABLE" />
<StatusBadge status="LOADING" />
<StatusBadge status={result.status} label="Custom" size="md" />
```

### Supported statuses

| Status | Tone | Icon |
|--------|------|------|
| `READY` | emerald | CheckCircle2 |
| `REJECT` | rose | XCircle |
| `DATA_UNAVAILABLE` | muted white | Database |
| `LOADING` | gold | Loader2 (spin) |
| `SCORE_NOT_COMPUTABLE` | amber | CircleSlash |
| `OBSERVE` | orange | AlertTriangle |
| `ERROR` | red | AlertTriangle |

Unknown strings fall back to amber + normalized label. Soft aliases map `NOT_COMPUTABLE` → DATA_UNAVAILABLE, etc.

---

## Accessibility

- `role="status"` + `aria-label`
- Icon **and** text (not color-only)
- Font-mono uppercase for scanability

---

## Adoption

| Location | Status |
|----------|--------|
| `CryptoScoringEnterprise` (header status) | wired |
| `MarketScreener` (result card status) | wired |
| `UniverseBestWorst` (unavailable rows) | wired |
| `Dashboard` / `Screener` / other panels | backlog Phase 1 |

---

## Next

1. Replace remaining ad-hoc status pills site-wide
2. Optional: DecisionBadge for DECISION_STYLE tiers (A-Setup, Tradeable Watch, …)
