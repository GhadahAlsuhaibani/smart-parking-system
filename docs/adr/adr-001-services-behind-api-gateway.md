# ADR-001: Split the system into four services behind an API gateway

Date: 2026-11-02
Deciders: Fatimah Alotaibi, Ghadah Alsuhaibani, Mashael Aldughayem,
Rahaf Alsahli, Sarah Alothman

## Context

The Smart Parking System serves three kinds of people: drivers, parking
administrators and parking staff. It also talks to four outside systems:
parking sensors, a payment gateway, a notification provider and a mapping
service (see `docs/context.puml`).

The work falls into four areas that change for different reasons:

- **User**: accounts, sign-in and roles (driver, administrator, staff).
- **Parking**: facilities, spaces, pricing and live occupancy from sensors.
- **Reservation**: booking, extending and cancelling a space.
- **Payment**: charging for reservations and issuing refunds.

Sensor updates arrive all day, while payments happen only when a driver
books. If everything were one program, a spike in sensor traffic could
slow down checkout, and a bug in pricing could take down sign-in.

Five people are building this at the same time. We need clear boundaries
so we can work in parallel without breaking each other's code.

## Decision

We build four services: User, Parking, Reservation and Payment. Each one
lives in its own folder under `services/`.

The frontend never calls a service directly. Every request goes through
one API gateway (`gateway/`), which checks the user's sign-in and routes
the request to the right service.

Each service owns its own data. No service reads or writes another
service's database. If Reservation needs to know whether a space is free,
it asks the Parking service through its API. The API contracts are kept
in `api/`.

Only the Payment service talks to the payment gateway, and only the
Parking service receives sensor updates.

## Consequences

What gets better:

- Each team member can own a service and change it without waiting for
  the others, as long as the API contract stays the same.
- Sensor traffic hits only the Parking service, so it can be scaled on
  its own without affecting payments or reservations.
- Card payments are handled in one small service, which is easier to
  secure and review.
- The frontend has one address to call. Sign-in is checked once, at the
  gateway, instead of in every service.

What gets worse:

- A reservation now needs calls to Parking, Reservation and Payment.
  Network calls are slower than function calls, and any of them can fail.
  We must decide what happens when a payment fails after a space is held.
- The gateway is a single point of failure. If it goes down, the whole
  system is unreachable, so it must be kept simple and run more than one
  copy.
- Four services means four things to build, deploy and monitor, which is
  more work than one program for a team of five.
- Reports that join data across services (for example, revenue per
  parking facility) can no longer use a single database query.

## Status

Proposed.
