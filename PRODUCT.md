# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Cyclists preparing, navigating, or reviewing outdoor rides. Their immediate job is to make city-limit signs along a planned route usable in a navigation device. Strava is an optional way for the same cyclists to track the signs collected across their outdoor rides.

## Product Purpose

Ortsschildsprint finds city-limit signs along cycling routes and turns them into useful route and ride context. Success means a rider can confidently review relevant signs, include them in an exported navigation route, and—when they choose the optional Strava connection—see a personal collection built from their rides.

## Positioning

Ortsschildsprint combines route-file enrichment for navigation with an optional connected-rides collection: city-limit signs are not only discovered on a route, but can also become a record of places encountered while riding.

## Operating Context

The core workflow begins with a cyclist's GPX, TCX, or FIT route file. They inspect detected signs on a map, resolve ambiguous route matches, and download an enriched route for navigation.

The optional Strava workflow is a deployed, server-side integration. It connects an athlete's account, ingests and processes eligible outdoor rides, builds a sign collection and its map/statistics, supports historic imports and ongoing updates, and can append a sign summary to an activity when the rider enables that preference.

## Capabilities and Constraints

- Route files are parsed in the browser for the route-file workflow; the files themselves are not uploaded. That workflow sends only the route bounding box to the API for sign lookup.
- The product finds and snaps city-limit signs to a route, lets riders review, select, or remove matches, and flags ambiguous matches for review.
- Enriched routes can be exported as GPX, TCX, or FIT.
- Sign data is based on OpenStreetMap-derived data queried through the deployed API and database.
- Public sign lookup is geographically bounded and rate-limited.
- Strava is optional and is materially different from the browser-local file flow: it requires server-side authentication, data ingestion, computation, and storage in the deployed application.
- The Strava integration processes only eligible outdoor rides and stores the connected-account, session, ride, and collected-sign data needed to provide the feature; access and refresh tokens are encrypted before storage.

## Brand Commitments

- Product name: Ortschildsprint.
- German and English are supported product languages.
- Privacy-first handling is a core promise: no account or tracking is required for the route-file workflow, and the connected Strava experience is optional.

## Evidence on Hand

- [README.md](README.md) documents the route-file workflow, privacy model, formats, stack, and deployment.
- [api/README.md](api/README.md) and [api/src/strava/README.md](api/src/strava/README.md) document the deployed API, rate limits, and Strava integration.
- [docs/logo trikot white.png](docs/logo%20trikot%20white.png) is an existing logo asset.
- No customer testimonials, performance benchmarks, pricing, or other external proof claims are documented here; future work must not fabricate them.

## Product Principles

1. Keep the route-file workflow local and privacy-preserving by default.
2. Treat sign matching as reviewable route information, not unquestionable automation.
3. Make results useful where cyclists need them: their chosen navigation-file format and, when explicitly connected, their ride history.
4. Keep the richer connected-rides experience clearly opt-in and transparent about its server-side processing and stored data.
5. Support riders in German and English without making either language a second-class workflow.
6. Use plain, purposeful interface language: every label, heading, description, and action tells riders what they see, what will happen, or why it matters. Avoid aspirational slogans and invented narratives.
