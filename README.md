# analytics-instrumentation-demo

A self-contained analytics instrumentation demo focused on event modeling, identity handling, and silent failure modes.

Designed to reason about analytics correctness and decision safety before data reaches a vendor or dashboard. Runs locally with no PostHog account or API key required. PostHog is treated as an analytics model, not a dependency.

---

## Purpose

Most analytics demos show that events can be sent. That is not the hard part.

This project exists to surface the harder problems:
- metrics that look correct but are unsafe to act on
- silent corruption caused by retries, duplication, or delayed delivery
- ambiguity introduced by identity and session transitions

The goal is to make those failure modes explicit and inspectable.

---

## Live Demo

A live, end-to-end deployment is available:

Frontend (static, GitHub Pages):  
https://leelinkoff.github.io/analytics-instrumentation-demo/

Backend API (Render):  
https://analytics-instrumentation-demo-backend.onrender.com

Health check:  
https://analytics-instrumentation-demo-backend.onrender.com/api/health

Note: The backend runs on a free-tier service and may cold-start on first request.

---

## Scope

This demo focuses on:
- analytics instrumentation and event semantics
- identity and session boundaries
- failure modes that do not surface as errors
- tradeoffs made intentionally and documented

It intentionally does **not** focus on UI polish or dashboards.

The backend is a standalone, runnable API that can be exercised independently; the frontend is a small UI used to trigger events and observe analytics behavior.

---

## Non-Goals

- SDK tutorials
- SaaS setup walkthroughs
- conversion optimization examples
- dashboard screenshots
- growth experiments

---

## Event Model

Events are treated as the primary artifact, not charts.

- Namespaced and versioned event names
- Format: `<domain>.<action>.<version>`
- Explicit required vs optional properties
- Intentional exclusion of high-cardinality properties
- Schema evolution handled via versioning, not mutation

Breaking analytics changes are treated as first-class design decisions.

---

## Identity and Sessions

Identity is modeled as a source of ambiguity rather than something to be hidden.

- Anonymous users supported
- Identified users supported
- Anonymous-to-identified transitions modeled explicitly
- No retroactive reassignment of pre-identification events
- Identity merges treated as lossy and documented
- Session boundaries explicit and observable

Funnels may look messier, but conclusions are more honest.

---

## Instrumentation Failure Modes

The demo intentionally includes non-happy-path scenarios:

- dropped events
- duplicate events
- delayed event arrival
- retry-induced metric inflation
- ambiguity caused by identity transitions

Most analytics systems fail by producing plausible numbers. This demo is designed to make that visible.

Delayed Delivery Semantics

When delayed delivery is enabled, the API intentionally returns a successful
response immediately while deferring internal event processing. This mirrors
real analytics systems, where ingestion success does not imply timely, ordered,
or unique data availability.

The absence of a delayed client response is intentional and highlights how
analytics pipelines can appear healthy while downstream data arrives late.

---

## Decision Safety

Metrics are tied to concrete decisions, not visualization.

The demo shows:
- how retries inflate success metrics
- how missing session context breaks funnels
- how anonymous traffic distorts conversion analysis

Emphasis is placed on what conclusions are *unsafe*, not just what can be observed.

---

## Database

The backend uses PostgreSQL, hosted on Neon, via a direct connection endpoint.

- Neon used only for fast provisioning
- Relies on standard PostgreSQL behavior and the native `pg` client
- No dependency on Neon-specific APIs or features
- Swappable with any local or hosted Postgres instance via `DATABASE_URL`
- Avoids pooled or proxy connections to keep behavior deterministic

The database exists to support realistic identity, session, and event-related state rather than to showcase database features.

---

## Authentication

Authentication is implemented as minimal, production-style supporting infrastructure.

- User registration with hashed passwords
- JWT-based authentication
- Protected routes enforced via auth middleware
- Database-level enforcement of unique, case-insensitive email addresses
- Minimal JWT payloads and generic auth errors

Auth is intentionally not the focus of this project. It exists to enable realistic analytics scenarios involving identity and session transitions.

---

## AI Usage

AI tools were used for boilerplate and mechanical setup.

They were not relied on for:
- event modeling decisions
- failure mode analysis
- tradeoff selection

---

## Running the Demo

The demo can be explored via the live deployment above or run entirely locally, and does not require a hosted analytics service.

To explore it:
- install dependencies
- start the application
- trigger the documented scenarios to inspect behavior

The intent is inspection, not setup.

---

## Runtime behavior (dev vs production)

This project intentionally distinguishes between development and production startup behavior to make failure modes explicit.

In development, the server can start without a database connection so analytics ingestion and failure modes can be reasoned about in isolation. Routes that depend on the database are not mocked and will fail normally if called.

In production, the database check is enforced at startup. If the database cannot be reached, the process exits immediately with a non-zero status. This prevents misconfigured deployments from running in a degraded state.

---

## Reviewer Guidance

This project should be evaluated on:
- clarity of event semantics
- understanding of failure modes
- quality of tradeoff reasoning
- decision safety

Not on UI polish or dashboards.

---

## Key Takeaway

Analytics systems rarely fail loudly.

They fail by producing numbers that look correct.
