import test from "node:test";
import assert from "node:assert/strict";
import { generateFlora } from "../src/flora.js";
import { generateNodes, normalizeWorld } from "../src/world-map.js";
test("flora is dense, varied and reproducible without changing saved resources", () => {
  const world = normalizeWorld({ seed: 2026 }),
    nodes = generateNodes(world),
    before = structuredClone(nodes);
  const flora = generateFlora(world, nodes);
  assert.equal(flora.length, 3800);
  assert.deepEqual(flora, generateFlora(world, nodes));
  assert.deepEqual(nodes, before);
  assert.notDeepEqual(flora, generateFlora({ ...world, seed: 2027 }, nodes));
  for (const kind of ["grass", "flower", "shrub"])
    assert.ok(flora.some((p) => p.kind === kind));
  assert.ok(flora.some((p) => p.x > 35) && flora.some((p) => p.x < -35));
});
test("density preference changes counts and keeps camp, path and resources clear", () => {
  const world = normalizeWorld({ seed: 18 }),
    nodes = generateNodes(world);
  assert.ok(
    generateFlora({ ...world, vegetation: "dense" }, nodes).length >
      generateFlora({ ...world, vegetation: "sparse" }, nodes).length,
  );
  for (const p of generateFlora(world, nodes)) {
    assert.ok(Math.abs(p.x) <= 48 && Math.abs(p.z) <= 48);
    assert.ok(!(Math.abs(p.x) < 1.6 && p.z > -14 && p.z < 10));
    assert.ok(Math.hypot(p.x, p.z - 6) >= 1.2);
    assert.ok(
      nodes.every(
        (n) => Math.hypot(p.x - n.x, p.z - n.z) >= (n.radius || 0.5) + 0.5,
      ),
    );
  }
});
