# Smart Parking Management System - Context Map

A bounded context is a boundary where one word has exactly one meaning. Two teams might use the same word differently. That is fine, as long as we write it down here and translate at the border.

We start with four core contexts based directly on our code services.

---

## Context 1: User & Auth

Owner: Identity Team  
Purpose: Secure and manage user access to the app.

| Word | What it means inside User & Auth |
| :--- | :--- |
| user | A registered account with login details and a clear role (`Driver`, `Admin`, or `Staff`). Identified by a unique `user_id`. |
| profile | The personal information (like name or email) tied directly to a specific user account. |

What User & Auth promises to others:
* Gives out secure login tokens (JWT) at the API Gateway.
* Provides simple API endpoints to find user profile details using a `user_id`.

---

## Context 2: Parking Facility

Owner: Infrastructure & IoT Team  
Purpose: Track the real-world parking lots and live sensor updates.

| Word | What it means inside Parking Facility                                                                        |
| :--- |:-------------------------------------------------------------------------------------------------------------|
| spot | A real, physical parking spot marked on the ground with a live IoT sensor. Identified by a unique `spot_number`. |
| status | The live, real-time sensor readout of a physical spot right now: either `available` or `occupied`.            |
| driver | An anonymous car license plate detected by physical cameras or gate barriers.                                |

What Parking Facility promises to others:
* Sends a message called `OccupancyUpdated` over RabbitMQ whenever a real-world sensor changes state.
* This message always includes the `facility_id`, `spot_number`, and the current live `status`.

---

## Context 3: Reservation

Owner: Booking Team  
Purpose: Handle digital bookings and prevent double-booking.

| Word | What it means inside Reservation |
| :--- | :--- |
| booking | A digital ticket or voucher that saves a spot for a driver during a specific future time window. It does not look at a real physical spot number until the driver arrives. |
| status | The current step of the booking agreement lifecycle: `pending`, `active`, `completed`, `cancelled`, or `expired`. |
| driver | A customer account containing booking history, loyalty tier status, and notification preferences. |

What Reservation promises to others:
* Checks database records to guarantee a spot cannot be double-booked for overlapping times.
* Sends a message called `ReservationCreated` whenever a new booking is confirmed, containing `booking_id`, `user_id`, and the reserved `time_window`.

---

## Context 4: Payment

Owner: Finance Team  
Purpose: Take payments safely and track financial transactions.

| Word | What it means inside Payment |
| :--- | :--- |
| status | The official banking stage of an invoice or payment: `authorized`, `captured`, `settled`, or `refunded`. |
| charge | The final cash amount billed to the customer, calculated using parking rates, duration, and VAT taxes. |

What Payment promises to others:
* Sends a message called `PaymentCaptured` as soon as the external bank successfully charges the user's card.
* This message always carries the `order_id`, `user_id`, `amount`, and a secure transaction token from the bank.

---

## The borders between them

### The word `spot` vs. `booking` is the dangerous confusion.
* In **Parking Facility**, a spot is a real piece of ground. If a car sits on it, it is occupied right now. It does not know about tomorrow.
* In **Reservation**, a spot is a digital time slot. It can be saved for 3:00 PM tomorrow while sitting completely empty right now.

**Rule:** The Reservation service never looks at the live sensor database to make a booking for next week. It only looks at its own digital ledger. When a driver arrives at the garage, Reservation asks the Parking service to pair their digital `booking` with an empty physical `spot_number`.

### The word `status` is the second dangerous confusion.
* In **Parking Facility**, status means hardware sensor data (`occupied`/`available`).
* In **Reservation**, status means a ticket lifecycle (`pending`/`expired`).
* In **Payment**, status means a banking stage (`authorized`/`captured`).

**Rule:** To avoid confusion, developers must never say just `status`. They must explicitly say `physical spot occupancy status`, `booking contract status`, or `invoice transaction status`.

---

## Relationship type

### 1. Reservation → Parking Facility
* **Type:** Downstream (Reservation) → Upstream (Parking Facility).
* **Pattern:** Customer-Supplier.
* **Details:** The Reservation service depends entirely on the layout rules and capacities owned by the Parking service. The Parking service acts as the boss (Upstream) and provides a clean API for the Reservation service to check lot limits.

### 2. Reservation → Payment
* **Type:** Downstream (Reservation) → Upstream (Payment).
* **Pattern:** Conformist (Follower).
* **Details:** A booking cannot become active until the payment goes through. Because banks require strict financial rules, the Reservation service must completely follow and accept (`Conformist`) the exact data schemas and payment statuses built by the payment team.

### 3. All Services ↔ Messaging Broker (RabbitMQ)
* **Type:** Shared Kernel (Shared Space).
* **Pattern:** Published Language (Standard Messages).
* **Details:** All core services use RabbitMQ to talk to each other without being directly linked. They share simple, standard JSON messages (`Published Language`) to announce when things happen, keeping the services independent.
