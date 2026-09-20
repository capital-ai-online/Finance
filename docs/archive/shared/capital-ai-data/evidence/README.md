# CAPITAL-AI-DATA — Evidence

DATA evidence is append-only technical evidence bound to the exact candidate/runtime identity where execution is claimed.

Minimum evidence fields should include:

- repository/candidate SHA;
- runtime SHA when runtime behavior is claimed;
- DATA contract version(s);
- provider matrix/provider adapter version or identity;
- UAI/evidence identity and provenance checks performed;
- freshness policy used;
- DQ status/output;
- negative-path test evidence;
- remaining compatibility/bypass paths;
- cross-project handoffs created or still blocked.

## Security-return evidence

For S1-R2-11 or later Security findings routed to DATA, record:

- source Security finding;
- project stage (`PVC-*`);
- implementation status;
- changed files;
- candidate/runtime identity;
- targeted Security tests;
- negative tests;
- evidence paths;
- residual risk;
- unresolved dependencies;
- verification requested.

Return with:

`[SECURITY_HANDOFF_RETURN -> CAPITAL-AI-SEC]`

DATA may report `IMPLEMENTED` or `EVIDENCE_READY`; it must not report Security `VERIFIED/CLOSED`.

A file's existence is not proof that a test, provider check or DQ gate passed. Missing execution evidence is `NOT_AVAILABLE`/`UNKNOWN`, never synthetic `PASS`.
