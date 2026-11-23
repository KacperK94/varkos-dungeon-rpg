import test from "node:test";
import assert from "node:assert/strict";
import {
  createState,
  gather,
  craft,
  restore,
  clampPosition,
  RECIPES,
  craftReason,
} from "../src/game.js";

const stocked = () => {
  const state = createState();
  Object.keys(state.inventory).forEach((key) => {
    state.inventory[key] = 50;
  });
  return state;
};
test("new games have independent inventories and start on land", () => {
  const a = createState(),
    b = createState();
  a.inventory.wood++;
  assert.equal(b.inventory.wood, 0);
  assert.ok(Math.hypot(b.position.x, b.position.z) < 15.5);
});
test("gathering exhausts nodes without giving unlimited resources", () => {
  const state = createState(),
    node = { id: "node-0", type: "wood", hits: 5 };
  for (let i = 0; i < 5; i++) assert.equal(gather(state, node).ok, true);
  assert.equal(gather(state, node).ok, false);
  assert.equal(state.inventory.wood, 5);
});
test("crystals require a pickaxe; failed gather leaves state untouched", () => {
  const state = createState(),
    node = { id: "node-1", type: "crystal", hits: 5 };
  const before = structuredClone(state);
  assert.equal(gather(state, node).ok, false);
  assert.deepEqual(state, before);
  state.crafted.push("pickaxe");
  assert.equal(gather(state, node).amount, 1);
});
test("tools double only their matching material yield", () => {
  const state = createState();
  state.crafted.push("axe", "pickaxe");
  assert.equal(
    gather(state, { id: "node-0", type: "wood", hits: 5 }).amount,
    2,
  );
  assert.equal(
    gather(state, { id: "node-1", type: "stone", hits: 5 }).amount,
    2,
  );
  assert.equal(
    gather(state, { id: "node-2", type: "fiber", hits: 3 }).amount,
    1,
  );
});
test("insufficient materials and unknown recipes do not mutate state", () => {
  const state = createState(),
    before = structuredClone(state);
  assert.equal(craft(state, "axe").ok, false);
  assert.equal(craft(state, "unknown").ok, false);
  assert.deepEqual(state, before);
});
test("crafting consumes exact recipe cost and cannot be repeated", () => {
  const state = stocked();
  assert.equal(craft(state, "axe").ok, true);
  assert.deepEqual(state.inventory, {
    wood: 46,
    stone: 48,
    fiber: 48,
    crystal: 50,
  });
  const before = structuredClone(state);
  assert.equal(craft(state, "axe").ok, false);
  assert.deepEqual(state, before);
});
test("beacon requires both campfire and pickaxe regardless of materials", () => {
  const state = stocked();
  assert.equal(craft(state, "beacon").ok, false);
  craft(state, "campfire");
  assert.equal(craft(state, "beacon").ok, false);
  craft(state, "pickaxe");
  assert.equal(craft(state, "beacon").ok, true);
});
test("a full expedition can collect, craft and complete the beacon", () => {
  const state = createState();
  let id = 0;
  const collect = (type, count) => {
    for (let i = 0; i < count; i++)
      gather(state, { id: `node-${id++}`, type, hits: 5 });
  };
  collect("wood", 4);
  collect("stone", 4);
  assert.equal(craft(state, "pickaxe").ok, true);
  collect("wood", 6);
  collect("stone", 2);
  assert.equal(craft(state, "campfire").ok, true);
  collect("wood", 10);
  collect("stone", 4);
  collect("crystal", 4);
  assert.equal(craft(state, "beacon").ok, true);
  assert.ok(state.crafted.includes("beacon"));
  assert.equal(restore(JSON.stringify(state)).crafted.includes("beacon"), true);
});
test("restore round-trips progress including depleted nodes and position", () => {
  const state = stocked();
  craft(state, "pickaxe");
  gather(state, { id: "node-9", type: "stone", hits: 5 });
  state.position = { x: 3.5, z: -7 };
  state.elapsed = 150;
  assert.deepEqual(restore(JSON.stringify(state)), state);
});
test("invalid saves fail safely and untrusted optional fields are normalized", () => {
  for (const raw of [
    null,
    "{}",
    "broken",
    '{"version":2}',
    JSON.stringify({ ...createState(), inventory: { wood: -1 } }),
  ])
    assert.equal(restore(raw), null);
  const state = createState();
  state.position = { x: 1e10, z: 1e10 };
  state.crafted = ["axe", "axe", "not-a-recipe"];
  state.depleted = { "node-1": 2, "node-2": -2, invalid: 3 };
  const result = restore(JSON.stringify(state));
  assert.deepEqual(result.position, createState().position);
  assert.deepEqual(result.crafted, ["axe"]);
  assert.deepEqual(result.depleted, { "node-1": 2 });
});
test("island movement cannot escape the shore", () => {
  for (const [x, z] of [
    [100, 20],
    [-90, 50],
    [20, -80],
    [0, 0],
  ]) {
    const result = clampPosition(x, z);
    assert.ok(Math.hypot(result.x, result.z) <= 15.5000001);
  }
});
test("each recipe exposes an accurate availability reason", () => {
  const state = stocked();
  assert.equal(craftReason(state, RECIPES[0]), "");
  craft(state, "axe");
  assert.equal(craftReason(state, RECIPES[0]), "Już wytworzono");
});
