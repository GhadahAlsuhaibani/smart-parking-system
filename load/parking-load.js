// k6 load test for the Smart Parking System, based on docs/slo/slo.md.
// Run it with: docker compose run --rm k6
import http from "k6/http";
import { check, sleep } from "k6";

// Inside the Docker network the gateway is called "api-gateway".
const BASE = __ENV.BASE_URL || "http://localhost:8000";
const JSON_HEADERS = { headers: { "Content-Type": "application/json" } };

export const options = {
  // How many fake drivers use the system over time.
  stages: [
    // Over 20 seconds, go from 0 drivers up to 10 (normal traffic).
    { duration: "20s", target: 10 },
    // Hold 10 drivers for 30 seconds.
    { duration: "30s", target: 10 },
    // Over 20 seconds, go up to 30 drivers (increased traffic).
    { duration: "20s", target: 30 },
    // Over 10 seconds, come back down to 0.
    { duration: "10s", target: 0 }
  ],
  // The release test target from the SLO. If a rule fails, k6 exits with an error code.
  thresholds: {
    // 95 out of every 100 requests must finish in under 500 milliseconds.
    http_req_duration: ["p(95)<500"],
    // Fewer than 1 percent of requests may fail.
    http_req_failed: ["rate<0.01"],
    // At least 99 percent of the checks below must pass.
    checks: ["rate>0.99"]
  }
};

// Send a JSON POST and name it, so the summary groups requests by route instead of by id.
function post(path, body, name) {
  return http.post(BASE + path, body ? JSON.stringify(body) : null, Object.assign({ tags: { name } }, JSON_HEADERS));
}

// What one fake driver does, over and over: the flows the SLO says to cover.
export default function () {
  // Step 1: look for free parking.
  const available = http.get(BASE + "/spaces/available", { tags: { name: "GET /spaces/available" } });
  check(available, { "list available spaces is 200": r => r.status === 200 });

  // Step 2: register a new driver. The email must be unique, so build it from the driver number.
  const email = `driver-${__VU}-${__ITER}-${Date.now()}@test.com`;
  const user = post("/users", { name: `Driver ${__VU}`, email }, "POST /users");
  check(user, { "register user is 201": r => r.status === 201 });

  // Step 3: an administrator adds a space, so every driver has a free space to book.
  const space = post("/spaces", { location: "Load Test Lot", pricePerHour: 10 }, "POST /spaces");
  check(space, { "add space is 201": r => r.status === 201 });
  if (user.status !== 201 || space.status !== 201) return sleep(1);

  // Step 4: book the space for 2 hours.
  const reservation = post("/reservations", { userId: user.json("id"), spaceId: space.json("id"), hours: 2 }, "POST /reservations");
  check(reservation, {
    "create reservation is 201": r => r.status === 201,
    "amount is 2 hours x 10": r => r.json("amount") === 20
  });
  if (reservation.status !== 201) return sleep(1);
  const reservationId = reservation.json("id");

  // Step 5: half the drivers pay, the other half cancel.
  if (__ITER % 2 === 0) {
    const payment = post("/payments", { reservationId }, "POST /payments");
    check(payment, { "payment is 201": r => r.status === 201 });
  } else {
    const cancel = post(`/reservations/${reservationId}/cancel`, null, "POST /reservations/:id/cancel");
    check(cancel, { "cancel is 200": r => r.status === 200 });
  }

  // Wait one second, like a real person reading the page.
  sleep(1);
}
