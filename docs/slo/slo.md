# Service Level Objective: Smart Parking System
 
**Owner:** Smart Parking Project Team Lead (to be assigned)\
**Reviewed:** Every quarter; next review 2027-02-04\
**Status:** Proposed
 
------------------------------------------------------------------------
 
## 1. What we measure (the SLI)
 
The share of user requests that receive a successful response in under
**500 milliseconds**, measured at the API Gateway, over a rolling 30-day
period.
 
The measurement covers the User Service, Parking Service, Reservation
Service, and Payment Service.
 
A request counts as successful when: - The HTTP status code is below
500. - The total response time is less than 500 milliseconds.
 
Examples: - `200 OK` in 200 ms: success. - `201 Created` in 350 ms:
success. - `404 Not Found` in 100 ms: success, because it is a valid
response. - `400 Bad Request` in 150 ms: success, because the system
correctly rejected invalid input. - `500 Internal Server Error` or
`503 Service Unavailable`: failure. - `200 OK` in 800 ms: failure
because the response was too slow. - A timeout or no response: failure.
 
We measure at the API Gateway because it represents the point where
users interact with our system and captures failures in communication
with backend services.
 
Health-check requests are excluded from the measurement.
 
## 2. What we promise (the SLO)
 
**99.5% of requests** will receive a successful response in under **500
milliseconds** over a rolling 30-day period.
 
This target applies to the Smart Parking System as a whole, rather than
promising a separate availability percentage for each service.
 
## 3. What we are allowed to lose (the error budget)
 
100% minus 99.5% is **0.5%**.
 
The error budget is the number of requests that may fail or exceed the
500 ms response-time target while the system remains within its SLO.
 
For example, if the system receives 100,000 requests in 30 days: - Total
requests: 100,000 - Allowed error rate: 0.5% - Error budget: 500
requests
 
Therefore, up to 500 requests may fail or be too slow during that 30-day
period.
 
**Error budget = Total requests × 0.005**
 
Spending the error budget is allowed. It gives the team room to release
updates and add features while maintaining reliability.
 
## 4. The stop rule
 
If more than 50% of the error budget is spent before day 15 of the
rolling 30-day window: - All new feature development is paused. - The
team focuses on fixing reliability problems. - The team investigates
which service or dependency caused the failures. - The Project Team Lead
informs the project supervisor.
 
If the entire error budget is spent: - New deployments are paused,
except for reliability fixes or rollbacks. - The team investigates the
root cause before releasing new features. - Normal development resumes
after the team agrees that reliability is sufficiently restored.
 
## 5. What we do not promise
 
-   We do not promise that the user's internet connection or device will
    respond within 500 milliseconds.
-   We do not promise the availability or speed of external services
    outside our control.
-   We do not guarantee that every request will complete within 500
    milliseconds. The SLO applies to 99.5% of measured requests.
-   We do not guarantee permanent data storage in the current prototype
    because the services use in-memory data.
-   We do not guarantee real payment processing. The current Payment
    Service simulates payments for demonstration purposes.
 
## 6. Where the numbers come from
 
**During operation:** - API Gateway access logs. - HTTP response status
codes. - Request duration measured at the gateway. - Service health
endpoints for troubleshooting.
 
**Before release:** - Load testing using a tool such as
[k6](Load testing for engineering teams | Grafana k6). - Test requests to the API Gateway and backend
services. - Check response times and error rates under normal and
increased traffic.
 
A proposed release test target is: - At least 95% of requests complete
within 500 milliseconds. - No unexpected HTTP 5xx errors during the
normal-load test.
 
The load test should cover user registration, parking-space lookup,
reservation creation, reservation cancellation, and payment simulation.
 
## 7. Named owner
 
The Smart Parking Project Team Lead is accountable for this SLO.
 
The owner is responsible for reviewing the SLI measurements, monitoring
the error budget, and coordinating reliability improvements.
 
If the owner changes, the document must be reassigned within one week.
Otherwise, this SLO is considered expired until a new owner is assigned.
 
------------------------------------------------------------------------
 
**Implementation note:** Every service records the duration and status
code of each request (`GET /metrics`, excluding health checks), and the
nginx gateway sends the same data from its access log through
`gateway-exporter`. Prometheus collects these numbers and the Grafana
dashboard "Smart Parking - Service Health and SLO" shows the SLI live.
The release test target is checked by the k6 script in
`load/parking-load.js`. Prometheus keeps data only while it runs, so the
30-day window is not yet measured; the prototype also still uses
in-memory data.
