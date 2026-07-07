# AI Agent FinTech Orchestration Platform V2

Welcome to the **AI Agent FinTech Orchestration Platform V2**, an enterprise-grade, event-driven, multi-agent execution system designed specifically for highly regulated and high-performance financial workflows.

This platform bridges advanced LLM reasoning capabilities with strict policy enforcement, immutable audit logging, dynamic workflow planning, and human-in-the-loop compliance checks.

---

## 🏗 System Architecture Overview

The system is constructed with eleven highly-decoupled, robust layers:

```
┌────────────────────────────────────────────────────────┐
│               1. Platform Director                     │
│               (Control Plane Brain)                    │
└─────────────────────────┬──────────────────────────────┘
                          ▼
┌────────────────────────────────────────────────────────┐
│               2. Master Supervisor                     │
│               (Global Orchestrator)                    │
└─────────────────────────┬──────────────────────────────┘
                          ▼
┌────────────────────────────────────────────────────────┐
│            3. Business Orchestrators                   │
│         (Stock, Crypto, Portfolio Workflows)           │
└─────────────────────────┬──────────────────────────────┘
                          ▼
┌────────────────────────────────────────────────────────┐
│                 4. AI Agent Layer                      │
│     (Planner, Executor, Validator, Router, Risk)       │
└─────────────────────────┬──────────────────────────────┘
                          ▼
┌────────────────────────────────────────────────────────┐
│                    5. Event Bus                        │
│          (Distributed Messaging: NATS/Memory)          │
└─────────────────────────┬──────────────────────────────┘
                          ▼
┌─────────────────────────┼──────────────────────────────┐
│  6. Policy Engine (OPA) │  7. LLM Gateway (Multi-LLM)  │
├─────────────────────────┼──────────────────────────────┤
│  8. Plugin System       │  9. Observability (OTel)     │
├─────────────────────────┼──────────────────────────────┤
│ 10. Security (RBAC/JWT) │ 11. Deployment Layer (Docker)│
└─────────────────────────┴──────────────────────────────┘
```

### Key Architectural Pillars

1. **Platform Director (Control Plane Brain)**: Manages registration of domain orchestrator nodes, routes active tasks to the Supervisor, and maintains overall cluster topology.
2. **Master Supervisor**: Manages parallel business orchestrators, controls the distributed event loop, and implements transactional retry strategies.
3. **Business Orchestrators**: Specialized domain agents orchestrating end-to-end investment strategies, raw materials indices, and real-time risk assessment.
4. **AI Agent Layer**: Modular role-based agents (Planner, Executor, Validator, Router, Risk, Compliance) built with rigorous schemas and state-driven memory.
5. **Replayable Event Bus**: Event history engine enabling deterministic workflow replay, distributed tracing via `correlationId`, and message-level auditing.
6. **OPA-Style Policy Engine**: Intercepts and validates every single execution. Denies operations that violate risk levels or investment constraints.
7. **Multi-LLM Gateway**: Intelligently routes prompt requests between OpenAI, Anthropic, Gemini, Mistral, and DeepSeek, optimizing for cost, latency, or depth.
8. **Plugin Sandbox**: Secure plugin-based execution mechanism using isolated execution runtimes.
9. **FinTech Compliance Engine**: Guarantees audit compliance, permanent audit logs, and handles human-in-the-loop approval gates for transactions exceeding threshold risk scores.

---

## 📁 Repository Structure

```
ai-fintech-agent-platform/
├── apps/                        # Deployable applications
│   └── api-gateway/             # Central entry point and orchestrator interface
├── packages/                    # Shared enterprise modules
│   └── core/                    # Event bus, Policy Engine, LLM Gateway, etc.
├── agents/                      # Specialized micro-agents
│   ├── planner-agent.ts
│   ├── executor-agent.ts
│   ├── validator-agent.ts
│   ├── router-agent.ts
│   ├── risk-agent.ts
│   └── compliance-agent.ts
├── infrastructure/              # Deployment & system configurations
│   ├── redis/
│   └── nginx/
├── docs/                        # Architecture & compliance specifications
│   ├── architecture.md
│   └── security-governance.md
├── scripts/                     # Platform automation tooling
└── tests/                       # Unit, integration, and security test suites
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js 20+
- Docker & Docker Compose
- Pnpm (recommended)

### Local Development Setup

1. **Clone the Repository and install dependencies**:
   ```bash
   pnpm install
   ```

2. **Configure Environment Variables**:
   ```bash
   cp .env.example .env
   # Add your Gemini, OpenAI, or Claude Keys
   ```

3. **Start Core Infrastructure**:
   ```bash
   docker-compose up -d
   ```

4. **Launch Dev Workspace**:
   ```bash
   pnpm run dev
   ```

---

## 🛡 Security, Policy, & Governance Model

- **Zero-Trust Token Introspection**: Every message and request requires authentication via signed JSON Web Tokens (JWT) containing cryptographic identity claims.
- **Pre-Execution Policy Interception**: If an agent requests an action with a risk score above `70`, the Policy Engine pauses execution and publishes a `human.approval.required` event.
- **Audit Trails**: Fully structured JSON logs detailing inputs, metadata, and token usage are written to directory `/logs/audit`.
