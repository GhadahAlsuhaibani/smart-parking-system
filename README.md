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
| `load/` | Load tests |
