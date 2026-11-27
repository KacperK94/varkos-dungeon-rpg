import { seededRandom } from "./world-map.js";
export const ANOMALIES = {
  fog: {
    name: "Gęsta mgła",
    hint: "Widoczność zasobów ograniczona do 10 m",
    speed: 1,
    range: 10,
  },
  wind: {
    name: "Wichura",
    hint: "Marsz i bieg wolniejsze o 35%",
    speed: 0.65,
    range: 42,
  },
  storm: {
    name: "Burza",
    hint: "Ulewa: ruch wolniejszy o 20%, widoczność 18 m",
    speed: 0.8,
    range: 18,
  },
  meteors: {
    name: "Deszcz meteorów",
    hint: "Po zakończeniu zbierzesz 3 kryształy z opadu",
    speed: 1,
    range: 42,
  },
};
const kinds = Object.keys(ANOMALIES);
// Driven only by active expedition time: menus, hidden tabs and reloads cannot reroll weather.
export function weatherAt(elapsed, seed = 741) {
  const time = Math.max(0, elapsed),
    period = 150,
    index = Math.floor(time / period),
    phase = time % period;
  const random = seededRandom((seed ^ Math.imul(index + 1, 2654435761)) >>> 0);
  const kind = kinds[Math.floor(random() * kinds.length)];
  const start = 30,
    end = 80;
  if (phase < start || phase >= end)
    return {
      kind: "clear",
      name: "Pogodnie",
      hint:
        phase >= 20 && phase < 30
          ? `Nadchodzi: ${ANOMALIES[kind].name}`
          : "Spokojna pogoda",
      speed: 1,
      range: 42,
      index,
      remaining: phase < start ? start - phase : period - phase + start,
      next: kind,
      intensity: 0,
    };
  const intensity = Math.min(1, (phase - start) / 4, (end - phase) / 4);
  return { kind, ...ANOMALIES[kind], index, remaining: end - phase, intensity };
}
export function settleWeather(state) {
  const elapsed = state.elapsed || 0,
    lastCompleted = Math.floor((elapsed - 80) / 150);
  let rewarded = 0;
  const previous = Number.isInteger(state.weatherSettled)
    ? state.weatherSettled
    : -1;
  // Only completed intervals since the stored checkpoint; never offline time.
  for (let i = Math.max(0, previous + 1); i <= lastCompleted; i++) {
    if (weatherAt(i * 150 + 45, state.world?.seed).kind === "meteors")
      rewarded += 3;
  }
  if (lastCompleted >= 0)
    state.weatherSettled = Math.max(previous, lastCompleted);
  if (rewarded) state.inventory.crystal += rewarded;
  return rewarded;
}
