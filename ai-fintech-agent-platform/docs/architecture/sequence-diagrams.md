# Sequence Diagrams Design Specification
## Platform Transaction Lifecycles & Sequence Flow Diagrams

This document contains text-based UML sequence flow diagrams detailing successful executions, regulatory blocks, escalation gating, and forensic audit replays.

---

## 1. End-to-End Successful Execution Path

```
User        API Gateway     Platform Director    Policy Engine    Master Supervisor    Event Bus      Agents
 │               │                  │                  │                  │                │             │
 ├─►[Submit]────►│                  │                  │                  │                │             │
 │               ├─►[Publish Init]────────────────────────────────────────────────────────►│             │
 │               │                  │                  │                  │                │             │
 │               │                  ◄─[Intercept]──────────────────────────────────────────┤             │
 │               │                  │                  │                  │                │             │
 │               │                  ├─►[Evaluate]─────►│                  │                │             │
 │               │                  │                  │                  │                │             │
 │               │                  │                  ├─►[Checks OK]     │                │             │
 │               │                  │                  ◄─[Allow: true]────┤                │             │
 │               │                  │                                     │                │             │
 │               │                  ├─►[Publish policy.approved]──────────────────────────►│             │
 │               │                  │                                     │                │             │
 │               │                  │                                     ◄─[Intercept]────┤             │
 │               │                  │                                     │                │             │
 │               │                  │                                     ├─►[Build DAG]   │             │
 │               │                  │                                     │                │             │
 │               │                  │                                     ├─►[Dispat. Task]─►│           │
 │               │                  │                                     │                ├─►[started]  │
 │               │                  │                                     │                │  (executing)│
 │               │                  │                                     │                ◄─[completed]─┤
 │               │                  │                                     │                │             │
 │               │                  │                                     ◄─[DAG Done]─────┤             │
 │               │                  │                                     │                │             │
 │               ◄─[Notify Success]─┴─────────────────────────────────────┴────────────────┴─────────────┘
```

---

## 2. Policy Rejection Lifecycle

```
User        API Gateway     Platform Director    Policy Engine      Event Bus         Observability
 │               │                  │                  │                │                   │
 ├─►[Submit]────►│                  │                  │                │                   │
 │               ├─►[Publish Init]─────────────────────────────────────►│                   │
 │               │                  │                  │                │                   │
 │               │                  ◄─[Intercept]───────────────────────┤                   │
 │               │                  │                  │                │                   │
 │               │                  ├─►[Evaluate]─────►│                │                   │
 │               │                  │                  │                │                   │
 │               │                  │                  ├─►[SSL check]   │                   │
 │               │                  │                  │  (Violation!)  │                   │
 │               │                  ◄─[Allow: false]───┘                │                   │
 │               │                  │                                   │                   │
 │               │                  ├─►[Publish policy.violation]──────►│                   │
 │               │                  │                                   │                   │
 │               │                  │                                   ◄─[Record Span]─────┤
 │               │                  │                                   │                   │
 ◄─[Error Alert]─┴──────────────────┴───────────────────────────────────┴───────────────────┘
```

---

## 3. Risk Escalation (Human-in-the-Loop) Path

```
User        API Gateway     Platform Director    Policy Engine    Master Supervisor    Event Bus      Compliance
 │               │                  │                  │                  │                │             │
 ├─►[Submit]────►│                  │                  │                  │                │             │
 │               ├─►[Publish Init]────────────────────────────────────────────────────────►│             │
 │               │                  │                  │                  │                │             │
 │               │                  ◄─[Intercept]──────────────────────────────────────────┤             │
 │               │                  │                  │                  │                │             │
 │               │                  ├─►[Evaluate]─────►│                  │                │             │
 │               │                  │                  │                  │                │             │
 │               │                  │                  ├─►[Risk Score 75] │                │             │
 │               │                  ◄─[Gating: true]───┘                  │                │             │
 │               │                  │                                     │                │             │
 │               │                  ├─►[Publish policy.suspended]────────────────────────►│             │
 │               │                  │                                     │                │             │
 │               │                  │                                     │                ◄─[Alert UI]──┤
 │               │                  │                                     │                │             │
 │               │                  │                                     │                ├─►[Reviews]  │
 │               │                  │                                     │                ├─►[Approves] │
 │               │                  │                                     │                │             │
 │               │                  │                                     ◄─[Resumes DAG]──┴─────────────┘
```

---

## 4. Forensic Audit Event Replay Path

```
Auditor       Developer UI         Event Bus         Observability        File Logs
   │               │                   │                   │                  │
   ├─►[Query Log]─►│                   │                   │                  │
   │               ├─►[Replay Trigger]►│                   │                  │
   │               │                   ├─►[Query History]──┼─────────────────►│
   │               │                   │                   │                  │
   │               │                   │                   ◄─[Stream JSONL]───┤
   │               │                   │                   │                  │
   │               │                   ◄─[Return Array]────┤                  │
   │               │                   │                   │                  │
   ◄─[Display Map]─┴───────────────────┴───────────────────┴──────────────────┘
```
