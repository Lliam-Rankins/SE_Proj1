---
name: Isolated Project 1a Tests
overview: Create a completely isolated, student-authored Project 1a test suite derived from the corrected 20 EcoBites use cases, then produce the exact D3/D4 evidence required by the assignment. No production files, legacy tests, package scripts, Jest/Vitest configuration, or existing coverage artifacts will be changed.
todos:
  - id: build-isolated-suite
    content: Create Project 1a-only helpers and UC01–UC20 required/findings tests without touching legacy or production files
    status: completed
  - id: run-and-capture
    content: Run required and findings suites separately and preserve raw outputs in the isolated evidence directory
    status: completed
  - id: write-d3
    content: Produce the D3 LaTeX code link, raw-output samples, complete results table, and failure explanations
    status: completed
  - id: write-d4
    content: Produce bidirectional test-to-use-case traceability and a separate evidence-based assessment of legacy test blind spots
    status: completed
  - id: verify-isolation
    content: Re-run tests and verify all changes and generated artifacts remain inside the two Project 1a directories
    status: completed
isProject: false
---

# Isolated Project 1a Test Suite

## Isolation boundary
- Put all new automated tests and helpers under [`proj2/Ecobites/server/tests/project1a/`](proj2/Ecobites/server/tests/project1a/), separated into:
  - `required/`: passing tests for supported behavior.
  - `findings/`: genuine requirement tests expected to fail against the unmodified product.
  - `helpers/`: Project 1a-only database, authentication, and fixture utilities.
- Put all assignment artifacts under [`proj2/Ecobites/project1a/`](proj2/Ecobites/project1a/):
  - `evidence/`: verbatim passing-suite and findings-suite output.
  - `report/d3-d4.tex`: ACM-compatible D3/D4 LaTeX content.
  - `README.md`: exact commands and artifact index.
- Do not edit production code, pre-existing tests, package files, test configuration, or `server/coverage/`.

## Tests derived from D2
- Add at least three focused tests per corrected use case: one main-success test and two defensible extensions/edge cases, using descriptive sentence-style names.
- Cover UC1–UC20 with Jest, Supertest, and MongoMemoryServer against the real Express routes. Organize `describe` blocks and test IDs as `UC01-T01`, etc., so every result maps directly to D2 and D4.
- Keep supported behavior in `required/`; place only verified requirement/code mismatches in `findings/`, including representative gaps such as cross-user order-detail access, cancellation after delivery, unenforced status transitions, and client-only reward/payment behavior.
- Use isolated fixtures, cookie-preserving agents, uppercase statuses, supplied coordinates, and serial execution to avoid external geocoding and shared-Mongoose flakiness.

## Execute and preserve evidence
- Run only the new required suite with Jest `--runInBand --coverage=false`; do not invoke the legacy coverage-writing package script.
- Run the findings suite separately and preserve its non-zero result as evidence rather than weakening assertions or repairing production code.
- Save exact raw outputs in [`proj2/Ecobites/project1a/evidence/`](proj2/Ecobites/project1a/evidence/) and verify that the required suite passes while the findings suite contains at least one reproducible failure for the report and demo.

## D3 deliverable
- Generate an ACM-compatible LaTeX section containing:
  - the GitHub code link for the isolated suite;
  - representative raw-output excerpts for both passing and failing runs;
  - one results-table row per new test with test ID/name, why it was tried, expected result, and observed result;
  - concise explanations for every genuine failure.
- State assumptions explicitly where the environment is mocked or in-memory.

## D4 deliverable
- Generate one traceability row per student-authored test: test ID/name, UC number/name, and what it proves.
- Check both directions and explicitly list any use case without a test and any test without a use case; the target is zero unexplained orphans.
- Only after the student suite and traceability table are complete, assess the pre-existing server/client tests separately: identify which UCs they cover, where they are partial, and their blind spots. Do not count legacy tests as D3 tests.

## Verification
- Re-run both isolated commands from a clean test database and ensure outputs match the LaTeX tables.
- Confirm `git diff` shows changes only inside `server/tests/project1a/` and `proj2/Ecobites/project1a/`.
- Check the LaTeX fragment for escaped special characters, table fit in ACM two-column format, valid links, and explicit pass/failure evidence required by the assignment.
