# Backend Service Overview

This service is a standalone API responsible for authentication, authorization, and analytics event emission.  
It can be run and exercised independently of the frontend.

The backend exists to demonstrate system boundaries, control flow, and observability, not production hardening.

---

## Responsibilities

The backend owns:

- Credential validation and session token issuance
- Authorization enforcement
- Explicit analytics event emission at security relevant boundaries
- Data access via a minimal persistence layer

It does not implement external identity providers, OAuth flows, or advanced account lifecycle management.

---

## Module Layout

### analytics/

PostHog integration and event definitions.

- Centralized event emission
- No business logic
- Events are emitted explicitly at authentication and authorization boundaries
- Analytics failures do not block request handling

Analytics initialization is environment driven.

- If `POSTHOG_API_KEY` is unset, analytics are disabled and treated as a no-op
- Analytics must never block request handling or cause application failure
- In non production environments, a log message is emitted when analytics are intentionally disabled

This module exists to make observability intentional and inspectable.

---

### auth/

Authentication and authorization logic.

- Credential validation
- Token creation and verification
- Role assignment and enforcement

Authorization decisions are enforced server side and do not rely on frontend state.

---

### db/

Data access and persistence layer.

- Encapsulates storage interactions
- No business logic
- Can be swapped or mocked without affecting higher layers

---

### middleware/

Cross cutting request concerns.

- Authorization enforcement (currently identity-based)
- Authorization checks
- Request context population

Middleware defines control boundaries, not application behavior.

---

### types/

Shared type definitions used across backend modules.

- Request and response shapes
- Authentication related types
- Analytics event typing

Types are centralized to make system contracts explicit.

---

### src/index.ts

Application entry point.

- Server initialization
- Middleware wiring
- Route registration

No business logic lives at the entry point.

---

## Analytics Contract

Analytics events are emitted only at explicit lifecycle boundaries, such as:

- Successful authentication
- Authentication failure
- Authorized access to protected resources
- Authorization denial

The system does not attempt to infer user behavior or track UI interactions at this layer.

---

## Non Goals

This backend intentionally does not include:

- OAuth, SAML, or external identity providers
- Refresh token rotation
- Multi tenant isolation
- Production grade security hardening
- Deployment automation

These concerns are treated as out of scope for the demo.

---

## Runtime Notes

The backend can be run in isolation for inspection and testing.  
The frontend exists only to exercise the API and generate observable events.
