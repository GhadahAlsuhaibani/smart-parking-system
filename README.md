# Smart Parking System

Course project for Software Architecture and Solution Design.

## Team Members

- Fatimah Alotaibi
- Ghadah Alsuhaibani
- Mashael Aldughayem
- Rahaf Alsahli
- Sarah Alothman

## Architecture

The frontend sends every request through an API gateway, which routes it to the right service:

```
Frontend ──► Gateway ──┬──► User
                       ├──► Parking
                       ├──► Reservation
                       └──► Payment
```

## Repository layout

| Folder | Purpose |
|---|---|
| `docs/` | Diagrams and ERDs |
| `docs/adr/` | Architecture Decision Records |
| `docs/slo/` | Service level objectives |
| `api/` | API contracts between services |
| `gateway/` | API gateway routing config |
| `services/user/` | User service: accounts and authentication |
| `services/parking/` | Parking service: lots, spots and availability |
| `services/reservation/` | Reservation service: booking and cancelling spots |
| `services/payment/` | Payment service: charging for reservations |
| `load/` | k6 load tests |
| `lib/` | Shared code: request metrics for every app |
| `monitoring/` | Prometheus and Grafana configuration and dashboard |


# Smart Parking Backend (Simple Lab Version)

Node.js + Express, four services and a small JavaScript API gateway. Data is kept in memory, so it resets on restart. No frontend or database.

## Start

Requires Node.js 18+ (Node.js 20+ recommended).

```bash
npm install
```

Open **five terminals** in this folder and run one command per terminal:

```bash
npm run start:users
npm run start:parking
npm run start:reservations
npm run start:payments
npm start
```

The gateway is at `http://localhost:3000`. The services use ports 3001–3004.

Or start everything with Docker in one command:

```bash
docker compose up --build
```

## Demo in VS Code

Install the **REST Client** extension, start the system, open `demo.http` and click **Send Request** above each request from 1 to 22, in order. Each request says what result to expect.

## Try the API

List available parking:

```bash
curl http://localhost:3000/spaces/available
```

Create a reservation for sample user 1 and space 1:

```bash
curl -X POST http://localhost:3000/reservations -H 'Content-Type: application/json' -d '{"userId":1,"spaceId":1,"hours":2}'
```

Pay reservation 1 (simulated):

```bash
curl -X POST http://localhost:3000/payments -H 'Content-Type: application/json' -d '{"reservationId":1}'
```

See reservations:

```bash
curl http://localhost:3000/reservations
```

To demonstrate cancellation, create another reservation (e.g. space 2), then call:

```bash
curl -X POST http://localhost:3000/reservations/2/cancel
```

## Routes

| Service | Routes |
|---|---|
| User | `GET /users`, `GET /users/:id`, `POST /users` |
| Parking | `GET /spaces`, `GET /spaces/available`, `GET /spaces/:id`, `POST /spaces`, `POST /spaces/:id/reserve`, `POST /spaces/:id/release` |
| Reservation | `GET /reservations`, `GET /reservations/:id`, `POST /reservations`, `POST /reservations/:id/cancel`, `POST /reservations/:id/paid` |
| Payment | `GET /payments`, `POST /payments` |

All applications have `GET /health` and `GET /metrics` (request counts and timings for Prometheus).

`POST /spaces/:id/reserve`, `POST /spaces/:id/release` and `POST /reservations/:id/paid` are internal: services call them on each other directly, and the gateway refuses them with `403`.

## Monitoring

`docker compose up --build` also starts the monitoring tools:

| Tool | Address | What it does |
|---|---|---|
| Prometheus | http://localhost:9090 | Reads `/metrics` from every app every 5 seconds |
| Grafana | http://localhost:3030 | Dashboard "Smart Parking - Service Health and SLO" (opens directly, no login) |

The dashboard tracks the SLO in `docs/slo/slo.md` at the gateway: the share of good requests (status below 500, under 500 ms), p95 response time, the 5xx error rate, whether each app is up, and traffic and speed per app.

To see a failure on the dashboard, stop a service, send a few requests, and watch it turn `DOWN` and the 502 errors appear:

```bash
docker compose stop parking-service
docker compose start parking-service
```

## When a service is down (timeout and circuit breaker)

Every call between apps goes through `lib/call-service.js`:

- **Timeout:** the gateway gives a service 2.5 seconds; a service gives another service 1 second.
- **Circuit breaker:** after 3 failures in a row to the same service, calls to it fail at once for 10 seconds, then one call is let through to test it again.

Without this, a stopped container made every caller wait about 4 seconds, because Docker takes that long to report that the name does not exist. To see it:

```bash
docker compose stop parking-service
```

Call `GET /spaces` through the gateway 5 times: the first 3 answer `502` after 2.5 seconds, then `503` in a few milliseconds. `docker compose logs api-gateway` shows `Circuit opened`. Start the service again, and about 10 seconds later requests work normally.

## Load test (k6)

With the system running, open a second terminal and run:

```bash
docker compose run --rm k6
```

The test in `load/parking-load.js` takes 80 seconds. It ramps up to 10 drivers, holds, then rises to 30 drivers. Each driver lists available spaces, registers, books a space for 2 hours, and then either pays or cancels. It passes only if it meets the SLO release target: p95 under 500 ms, fewer than 1% failed requests, and more than 99% of checks passing. Watch the Grafana dashboard while it runs.

## Limitations

For **course demonstrations only**: no authentication, data persistence, physical sensors, actual payment processing, time-slot availability, or distributed transactions. Internal service operations are not secured and must not be exposed on the public internet. Parking claims are atomic only within one single Node.js process, not across multiple replicas. This starter is intentionally simpler than the full C4 architecture and ADRs.
