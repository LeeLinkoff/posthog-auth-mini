# Analytics Instrumentation Control Panel (Frontend)

This frontend is a minimal control surface for exercising analytics ingestion behavior.

It is intentionally not a product UI, dashboard, or growth demo. Its purpose is to make analytics semantics and failure modes observable without relying on vendor tooling or verbal explanation.

## What this UI demonstrates

When running, this UI allows you to:

- send analytics events with explicit semantic meaning
- intentionally introduce duplicate events
- intentionally delay event delivery
- observe successful ingestion responses even when data quality is degraded

A successful response indicates that an event was accepted for ingestion, not that it is correct, unique, timely, or safe to use for decision-making.

## Running the frontend

From the repository root, run the following commands:

- cd frontend
- npm install
- npm run dev

This starts a local development server. Open the URL shown in the terminal and use the control panel to send events.

The frontend expects the backend API to be running locally at:

http://localhost:3000

## Design notes

- This UI is intentionally minimal.
- There is no authentication flow, persistence, or visualization.
- All explanation is embedded directly in the UI to avoid reliance on external documentation or verbal walkthroughs.
