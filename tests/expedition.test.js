import test from "node:test";
import assert from "node:assert/strict";
import {
  generateNodes,
  normalizeWorld,
  obstaclesFor,
  moveWithCollisions,
  canStand,
  findPath,
  inBounds,
} from "../src/world-map.js";
import {
  createState,
  createExpedition,
  restore,
  craft,
  gather,
  inventoryItems,
} from "../src/game.js";
import { renderQuality } from "../src/render-quality.js";
import { normalizeSettings } from "../src/settings.js";

test("same seed regenerates identical nodes; different seeds produce different maps", () => {
  const a = normalizeWorld({ seed: 123 });
  assert.deepEqual(generateNodes(a), generateNodes(a));
  assert.notDeepEqual(
    generateNodes(a).slice(3),
    generateNodes({ ...a, seed: 124 }).slice(3),
  );
});
test("world preferences change placement counts and preserve starter resources", () => {
  const sparse = generateNodes(
    normalizeWorld({ seed: 1, vegetation: "sparse", resources: "scarce" }),
  );
  const rich = generateNodes(
    normalizeWorld({ seed: 1, vegetation: "dense", resources: "rich" }),
  );
  assert.ok(rich.length > sparse.length);
  for (const nodes of [sparse, rich]) {
    assert.deepEqual(
      nodes.slice(0, 3).map((n) => n.type),
      ["wood", "stone", "fiber"],
    );
    assert.ok(nodes.every((n) => inBounds(n.x, n.z, {})));
    for (const type of ["wood", "stone", "fiber", "crystal"])
      assert.ok(
        nodes
          .filter((n) => n.type === type)
          .reduce((sum, n) => sum + n.hits, 0) > 20,
      );
  }
});
test("new 100m worlds save seed, preferences, distant position and tutorial", () => {
  const state = createExpedition({
    seed: 42,
    mode: "explorer",
    terrain: "rocky",
    wildlife: false,
  });
  state.position = { x: 45, z: -44 };
  state.tutorial = 3;
  craft(state, "axe");
  gather(state, generateNodes(state.world)[0]);
  const loaded = restore(JSON.stringify(state));
  assert.deepEqual(loaded, state);
  assert.deepEqual(generateNodes(loaded.world), generateNodes(state.world));
});
test("old save remains legacy map, inventory, tools and depletion preserved", () => {
  const state = createState();
  state.crafted = ["pickaxe"];
  state.inventory.wood = 8;
  state.depleted["node-4"] = 5;
  const loaded = restore(JSON.stringify(state));
  assert.deepEqual(loaded, state);
  assert.equal(loaded.world, undefined);
  assert.equal(generateNodes(loaded.world).length, 35);
});
test("explorer crafts for free without prerequisites but cannot duplicate items", () => {
  const state = createExpedition({ seed: 1, mode: "explorer" });
  for (const id of ["beacon", "axe", "pickaxe", "campfire"])
    assert.equal(craft(state, id).ok, true);
  assert.deepEqual(state.inventory, createState().inventory);
  assert.equal(craft(state, "axe").ok, false);
  assert.equal(inventoryItems(state).length, 4);
  assert.equal(
    inventoryItems(state).find((i) => i.id === "pickaxe").kind,
    "Założone automatycznie",
  );
});
test("survival crafting and loaded inventory preserve exact costs", () => {
  const state = createExpedition({ seed: 1 });
  Object.assign(state.inventory, { wood: 4, stone: 4 });
  assert.equal(craft(state, "pickaxe").ok, true);
  assert.equal(state.inventory.wood, 0);
  assert.equal(state.inventory.stone, 0);
  assert.equal(inventoryItems(restore(JSON.stringify(state)))[0].id, "pickaxe");
});
test("movement cannot tunnel through rocks even for a very large step", () => {
  const obstacles = [{ x: 0, z: 0, radius: 1 }];
  const next = moveWithCollisions(
    { x: -4, z: 0 },
    { x: 4, z: 0 },
    obstacles,
    {},
  );
  assert.ok(next.x < -1.35);
  assert.equal(canStand(next.x, next.z, obstacles, {}), true);
});
test("diagonal movement slides along colliders and map limits stay at 100m", () => {
  const obstacles = [{ x: 0, z: 0, radius: 1 }];
  let p = { x: -2, z: -2 };
  for (let i = 0; i < 60; i++) {
    p = moveWithCollisions(p, { x: p.x + 0.1, z: p.z + 0.08 }, obstacles, {});
    assert.equal(canStand(p.x, p.z, obstacles, {}), true);
  }
  const edge = moveWithCollisions({ x: 49, z: 49 }, { x: 60, z: 60 }, [], {});
  assert.ok(edge.x <= 49.5 && edge.z <= 49.5);
});
test("tap path routes around a collider and stops next to a solid target", () => {
  const o = [{ x: 0, z: 0, radius: 1.15 }];
  const path = findPath({ x: -5, z: 0 }, { x: 5, z: 0 }, o, {});
  assert.ok(path.some((p) => Math.abs(p.z) > 1));
  assert.deepEqual(path.at(-1), { x: 5, z: 0 });
  let p = { x: -5, z: 0 };
  for (const waypoint of path) {
    p = moveWithCollisions(p, waypoint, o, {});
    assert.ok(canStand(p.x, p.z, o, {}));
    assert.ok(Math.hypot(p.x - waypoint.x, p.z - waypoint.z) < 0.01);
  }
  const near = findPath({ x: -5, z: 0 }, { x: 0, z: 0 }, o, {}).at(-1);
  assert.ok(Math.hypot(near.x, near.z) >= 1.5);
});
test("depleting nodes removes colliders and camp structures add solid footprints", () => {
  const state = createExpedition({ seed: 1 });
  const nodes = generateNodes(state.world);
  const n = nodes[0];
  assert.equal(
    canStand(n.x, n.z, obstaclesFor(nodes, state), state.world),
    false,
  );
  state.depleted[n.id] = n.hits;
  assert.equal(
    canStand(n.x, n.z, obstaclesFor(nodes, state), state.world),
    true,
  );
  state.crafted.push("campfire");
  assert.equal(
    canStand(-2.6, 1.2, obstaclesFor(nodes, state), state.world),
    false,
  );
  assert.equal(
    canStand(0, -11.5, obstaclesFor(nodes, state), state.world),
    false,
  );
});
test("Full HD and 4K choose longest framebuffer edge and honor GPU limit", () => {
  for (const [width, height] of [
    [1920, 1080],
    [390, 780],
    [844, 390],
  ])
    for (const [graphics, edge] of [
      ["fullhd", 1920],
      ["4k", 3840],
    ]) {
      const quality = renderQuality({
        width,
        height,
        graphics,
        deviceRatio: 1,
        touchDevice: true,
        zoom: 24,
      });
      assert.ok(
        Math.abs(Math.max(width, height) * quality.pixelRatio - edge) < 0.01,
      );
      assert.equal(normalizeSettings({ graphics }).graphics, graphics);
    }
  assert.equal(
    renderQuality({
      width: 1000,
      height: 500,
      graphics: "4k",
      maxDimension: 2048,
    }).pixelRatio,
    2.048,
  );
});
