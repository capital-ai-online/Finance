# AI Agent Audit Event Schema

Required fields:
- event_id, timestamp, request_id, trace_id, span_id
- human_actor_id, app_id, agent_id, session_id
- provider, model (metadata only)
- intent, scope, environment, resource
- capability_requested, capability_granted, risk_class
- policy_id, policy_version, authorization_decision
- approval_id/step_up_id where applicable
- tool_id, command/action, sanitized_input_hash
- repo, branch, commit, pr, workflow_run
- artifact_digest, deployment_id, runtime_version when applicable
- result, error_code, rollback_reference

Never store secrets/tokens or full sensitive prompts/diffs in this event by default.