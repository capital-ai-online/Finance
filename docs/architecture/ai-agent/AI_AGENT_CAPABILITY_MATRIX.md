# AI Agent Capability Matrix

| Capability | LOW | MEDIUM | HIGH | CRITICAL |
|---|---|---|---|---|
| READ/ANALYZE | allow | allow | allow with audit | allow with audit |
| PLAN | allow | allow | allow with audit | allow with audit |
| BRANCH/COMMIT | allow docs | allow isolated | approval by policy | normally deny |
| PR | allow | allow | allow with evidence | deny without step-up |
| CI_REQUEST | allow | allow | allow | allow with approval |
| DEPLOY_REQUEST | deny | deny | approval | step-up + owner |
| PRODUCTION_MUTATION | deny | deny | exceptional | step-up + owner + rollback |

NotebookLM: READ/ANALYZE only. Google AI Studio: READ/ANALYZE/PLAN and isolated BRANCH/COMMIT only when connected through approved development tooling. ChatGPT/Claude: capabilities are policy grants, never provider defaults.