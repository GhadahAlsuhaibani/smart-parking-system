// Calls another app with a time limit and a circuit breaker, so a dead app fails fast
// instead of making every caller wait (a stopped container can take ~4 s just to fail its DNS lookup).
const FAILURES_TO_OPEN = 3;   // after 3 failures in a row, stop calling that app...
const OPEN_MS = 10000;        // ...for 10 seconds, then let one call through to test it again
const breakers = new Map();   // one breaker per app (host:port)

module.exports = async function callService(url, options = {}, timeoutMs = 1000) {
  const host = new URL(url).host;
  if (!breakers.has(host)) breakers.set(host, { failures: 0, openUntil: 0 });
  const breaker = breakers.get(host);
  if (Date.now() < breaker.openUntil) {
    const error = new Error(`Circuit open for ${host}`);
    error.circuitOpen = true;
    throw error;
  }
  try {
    const response = await fetch(url, { ...options, signal: AbortSignal.timeout(timeoutMs) });
    breaker.failures = 0;
    return response;
  } catch (error) {
    // A test call after the pause that fails again reopens the breaker at once.
    breaker.failures++;
    if (breaker.failures >= FAILURES_TO_OPEN) {
      breaker.openUntil = Date.now() + OPEN_MS;
      console.log(`Circuit opened for ${host} for ${OPEN_MS / 1000}s after ${breaker.failures} failures`);
    }
    throw error;
  }
};
