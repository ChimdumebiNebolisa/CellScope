# GUARDRAILS.md

## Purpose

These guardrails define how CellScope should be implemented.

They exist to keep the project simple, focused, maintainable, and aligned with the spec. They are not the product definition and they are not the execution roadmap. They are implementation boundaries.

## Core Implementation Bias

Prefer the simplest solution that fully satisfies the spec.

Default toward:

- direct solutions over clever ones
- small, readable code over abstraction-heavy code
- minimal dependencies over dependency growth
- focused features over speculative expansion
- explicit logic over hidden complexity

Do not add complexity unless the spec clearly requires it.

## Scope Control

CellScope is a **battery diagnostics tool**, not a simulation platform or a full battery management product.

Stay inside the defined scope:

- battery data input through CSV upload or manual entry
- validation and normalization
- metrics computation
- threshold alert detection
- voltage drop anomaly detection
- rule-based health classification
- dashboard output
- export
- optional browser-local persistence

Do not expand the project into:

- battery simulation
- battery chemistry modeling
- real-time IoT streaming
- multi-user cloud accounts
- machine learning predictions
- full battery management workflows
- unrelated admin or platform features

If a feature does not directly support the defined CellScope flow, it should probably not be added.

## Simplicity Rules

- Keep the frontend thin.
- Keep the backend responsible for analysis.
- Keep request handling stateless on the server.
- Keep the API surface small.
- Keep logic easy to trace from input to output.
- Keep the first version focused on one-dataset-at-a-time analysis.

Do not introduce extra layers, services, patterns, or abstractions without a clear need.

## Architecture Boundaries

The intended split is:

- **Frontend:** input, UI, dashboard rendering, optional local save/load, export controls
- **Backend:** parsing, validation, normalization, metrics, alerts, anomalies, health classification, chart-ready response shaping

Do not move core analysis logic into the frontend just for convenience.
Do not turn the backend into a persistence-heavy platform.
Do not introduce background jobs, queues, or distributed components for v1.

## Data Handling Rules

- Treat uploaded and manually entered datasets as request-scoped analysis inputs.
- Process analysis in memory for that request.
- Do not permanently store uploaded datasets on the server.
- Any persistence must be optional and browser-local only.
- Do not require login, signup, or user identity for the core product flow.

## Dependency Rules

Before adding a library, ask:

1. Is this actually necessary?
2. Is the standard library or existing stack enough?
3. Does this reduce real implementation effort without adding long-term weight?
4. Is this dependency focused and justified by the spec?

Prefer:

- standard library first where practical
- small, well-scoped packages
- fewer dependencies overall

Avoid:

- large framework additions without strong justification
- duplicate libraries for the same purpose
- dependency churn caused by trend-following rather than need

## Abstraction Rules

Avoid premature abstraction.

Do not create generic systems for hypothetical future use.
Do not build plugin systems, strategy systems, service layers, or wrapper-heavy architectures unless the current project actually needs them.

Prefer:

- concrete types over abstract hierarchies
- small helper functions over large utility layers
- direct module boundaries over over-designed architecture

Abstraction is allowed only when it reduces actual repetition or clarifies the code.

## Function and Module Rules

- Keep functions focused on one job.
- Keep modules small and responsibility-driven.
- Separate validation, metrics, alert detection, anomaly detection, and classification cleanly.
- Do not let one giant function handle the full pipeline if it hurts readability.
- Do not scatter business rules across unrelated files.

Each important rule in the analysis flow should have one obvious home.

## Frontend Rules

- The frontend should collect input, call the API, and render results.
- Do not duplicate backend analysis rules in the UI.
- Keep UI state simple and local where possible.
- Keep manual entry UX practical, not overbuilt.
- Avoid flashy UI additions that do not improve usability.
- Optimize for clarity of results over visual novelty.

Charts, alerts, and summaries should make the data easier to understand, not make the interface busier.

## Backend Rules

- The backend is the source of truth for analysis.
- Validation must happen before analysis.
- Rule-based analysis should stay explicit and inspectable.
- Thresholds and classification rules should be easy to locate and modify.
- Response shapes should be designed for direct frontend consumption.

Do not hide important business logic in confusing helper chains or implicit side effects.

## Validation Rules

Validation must be strict enough to protect analysis quality.

At minimum:

- required fields must exist
- numeric values must be valid
- malformed rows must be rejected
- normalized internal data should be consistent before analysis starts

Do not silently accept broken input that will poison downstream results.

## Testing Expectations

Testing should focus on the parts most likely to break trust in the product.

At minimum, cover:

- valid dataset acceptance
- malformed dataset rejection
- summary metric correctness
- threshold alert triggering
- sudden voltage drop detection
- health classification behavior
- export output shape for results and anomalies

Prefer focused tests around core analysis rules over shallow coverage inflation.

## Change Control

Ask before making major architecture changes.

Examples of major changes:

- replacing the frontend/backend split
- moving away from Go as the analysis layer
- adding server-side persistence
- introducing authentication/accounts
- adding real-time streaming infrastructure
- replacing rule-based analysis with ML/predictive systems

Do not quietly drift away from the original project shape.

## File Change Discipline

- Do not change unrelated files.
- Do not rename major structures without reason.
- Do not leave behind dead files, stale placeholders, or parallel unused implementations.
- Keep edits local to the work being done.
- When touching a file, preserve its role and keep its contents coherent.

## README Discipline

The README must stay aligned with the actual project state.

Do not let it become:

- stale
- aspirational
- disconnected from the codebase
- full of features that do not exist yet

Whenever major implementation changes land, update the README accordingly.

## Architectural Decisions

Major technical decisions must be documented in the README under a **Key Technical Decisions** section.

Each entry should include:

- Decision
- Context / constraint
- Alternatives considered
- Reason for the choice
- Trade-offs or downsides

Only document significant architectural or system-level decisions.
Do not log trivial implementation choices.

## Before Planning or Coding

Before proposing a plan or writing code:

- deeply review the relevant context
- review existing files and structure
- review dependencies and patterns already in use
- review constraints and documentation
- understand how the current system works first
- do not make shallow assumptions
- base decisions on what is actually present in the project

This rule applies every time new implementation work starts.

## Anti-Bloat Checks

Before adding anything, ask:

- Does this directly help meet the spec?
- Is this the simplest workable version?
- Can this be done with less code or less tooling?
- Is this solving a real current problem instead of a hypothetical one?
- Will this still make sense to a reviewer reading the repo later?

If the answer is unclear, do less.

## Final Rule

CellScope should remain a focused, engineering-oriented battery diagnostics tool.

Do not overbuild it.
Do not turn it into a platform.
Do not let implementation ambition overpower clarity.