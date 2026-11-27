import test from "node:test";
import assert from "node:assert/strict";
import { weatherAt, settleWeather } from "../src/weather.js";
import { createExpedition, restore } from "../src/game.js";
test("weather is seeded, timed and begins with a safe clear interval", () => {
  assert.equal(weatherAt(0, 42).kind, "clear");
  assert.equal(weatherAt(29, 42).kind, "clear");
  assert.notEqual(weatherAt(40, 42).kind, "clear");
  assert.equal(weatherAt(80, 42).kind, "clear");
  assert.deepEqual(weatherAt(45, 42), weatherAt(45, 42));
  const types = new Set(
    Array.from({ length: 40 }, (_, i) => weatherAt(i * 150 + 45, 42).kind),
  );
  assert.equal(types.size, 4);
  assert.match(weatherAt(25, 42).hint, /Nadchodzi/);
});
test("fog limits resource visibility, wind and storm reduce movement, meteors do not", () => {
  for (let seed = 0; seed < 50; seed++) {
    const w = weatherAt(45, seed);
    if (w.kind === "fog") assert.equal(w.range, 10);
    if (w.kind === "storm") {
      assert.equal(w.range, 18);
      assert.equal(w.speed, 0.8);
    }
    if (w.kind === "wind") assert.equal(w.speed, 0.65);
    if (w.kind === "meteors") assert.equal(w.speed, 1);
  }
});
test("meteor reward is granted once at completion and remains settled after reload", () => {
  let seed = 0;
  while (weatherAt(45, seed).kind !== "meteors") seed++;
  const state = createExpedition({ seed });
  state.elapsed = 79;
  assert.equal(settleWeather(state), 0);
  state.elapsed = 80;
  assert.equal(settleWeather(state), 3);
  assert.equal(state.inventory.crystal, 3);
  assert.equal(settleWeather(state), 0);
  const loaded = restore(JSON.stringify(state));
  assert.equal(settleWeather(loaded), 0);
  assert.equal(loaded.inventory.crystal, 3);
});
test("elapsed time controls duration and fades, not wall time", () => {
  assert.equal(weatherAt(30, 3).intensity, 0);
  assert.equal(weatherAt(34, 3).intensity, 1);
  assert.equal(weatherAt(79, 3).intensity, 0.25);
  assert.equal(weatherAt(80, 3).intensity, 0);
  const state = createExpedition({ seed: 4 });
  state.elapsed = 45;
  const before = weatherAt(state.elapsed, 4);
  assert.deepEqual(weatherAt(state.elapsed, 4), before);
});
