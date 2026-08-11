# AI Agent Risk Classification

LOW: docs, wording, formatting, non-executable metadata.
MEDIUM: isolated UI/business logic, bounded tests, no privileged path.
HIGH: auth/IAM, scoring, CI/CD, dependencies, security controls, provider routing.
CRITICAL: secrets, production DB/RLS, billing, deployment, Owner IAM, destructive operations, break-glass.

Risk is determined by affected resource and capability, not by the model used. When uncertain, classify upward. A change touching multiple classes inherits the highest class.