# AI Agent Deployment Identity

Deployment is a distinct service identity from coding agents. Only verified `main` source may request production deployment. Prefer short-lived/OIDC identity when supported by the target. For Render, if direct GitHub OIDC authentication is unavailable, use an environment-scoped secret bridge with owner, rotation, revocation and audit controls.

PR #190 deployment code is intentionally not carried into M2; implementation waits for M7.