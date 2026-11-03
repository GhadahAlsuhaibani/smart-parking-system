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

All applications have `GET /health`.

## Limitations

For **course demonstrations only**: no authentication, data persistence, physical sensors, actual payment processing, time-slot availability, or distributed transactions. Internal service operations are not secured and must not be exposed on the public internet. Parking claims are atomic only within one single Node.js process, not across multiple replicas. This starter is intentionally simpler than the full C4 architecture and ADRs.
