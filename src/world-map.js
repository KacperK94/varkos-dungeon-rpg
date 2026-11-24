export const LEGACY_PLACEMENTS = [
  ["wood", -7, 4],
  ["wood", -9, 7],
  ["wood", -11, 0],
  ["wood", -7, -3],
  ["wood", -11, -6],
  ["wood", -5, -10],
  ["wood", 7, 7],
  ["wood", 10, 3],
  ["wood", 11, -3],
  ["wood", 7, -7],
  ["wood", -3, -13],
  ["wood", 4, 12],
  ["wood", -7, 11],
  ["wood", 11, 7],
  ["stone", 5, 2],
  ["stone", -5, 0],
  ["stone", -8, -7],
  ["stone", 6, -5],
  ["stone", 10, -8],
  ["stone", 4, 10],
  ["stone", -5, 11],
  ["stone", 8, 10],
  ["fiber", -5, 7],
  ["fiber", 4, 7],
  ["fiber", -9, 3],
  ["fiber", 8, 0],
  ["fiber", -4, -5],
  ["fiber", 4, -8],
  ["crystal", -3, -8],
  ["crystal", 4, -11],
  ["crystal", -7, -10],
  ["crystal", 8, -9],
];

export function seededRandom(seed) {
  let value = seed >>> 0;
  return () => {
    value = (Math.imul(value, 1664525) + 1013904223) >>> 0;
    return value / 4294967296;
  };
}
export function normalizeWorld(value = {}) {
  return {
    generator: 1,
    seed: Number.isInteger(value.seed) ? value.seed >>> 0 : 741,
    mode: value.mode === "explorer" ? "explorer" : "survival",
    terrain: ["meadow", "forest", "rocky"].includes(value.terrain)
      ? value.terrain
      : "meadow",
    vegetation: ["sparse", "normal", "dense"].includes(value.vegetation)
      ? value.vegetation
      : "normal",
    resources: ["scarce", "normal", "rich"].includes(value.resources)
      ? value.resources
      : "normal",
    wildlife: value.wildlife !== false,
  };
}
export function generateNodes(world) {
  const placements = [
    ["wood", -2.2, 5.5],
    ["stone", 2.2, 5.5],
    ["fiber", -1.5, 8.5],
  ];
  if (!world)
    return [...placements, ...LEGACY_PLACEMENTS].map(([type, x, z], i) => ({
      id: `node-${i}`,
      type,
      x,
      z,
      radius: type === "wood" ? 0.65 : type === "fiber" ? 0 : 1.15,
      hits: type === "fiber" ? 3 : 5,
    }));
  const config = normalizeWorld(world),
    random = seededRandom(config.seed);
  const density = { sparse: 0.6, normal: 1, dense: 1.45 }[config.vegetation];
  const abundance = { scarce: 0.65, normal: 1, rich: 1.5 }[config.resources];
  const counts = {
    wood: Math.round(65 * density * (config.terrain === "forest" ? 1.3 : 1)),
    stone: Math.round(45 * abundance * (config.terrain === "rocky" ? 1.3 : 1)),
    fiber: Math.round(35 * density),
    crystal: Math.round(18 * abundance),
  };
  for (const [type, count] of Object.entries(counts)) {
    for (let i = 0, attempts = 0; i < count && attempts < 12000; attempts++) {
      const x = +(random() * 92 - 46).toFixed(2),
        z = +(random() * 92 - 46).toFixed(2);
      if (
        Math.hypot(x, z) < 11 ||
        Math.hypot(x, z + 11.5) < 5 ||
        Math.abs(x) < 1.8
      )
        continue;
      if (placements.some(([, px, pz]) => Math.hypot(x - px, z - pz) < 3.1))
        continue;
      placements.push([type, x, z]);
      i++;
    }
  }
  return placements.map(([type, x, z], i) => ({
    id: `node-${i}`,
    type,
    x,
    z,
    radius: type === "wood" ? 0.65 : type === "fiber" ? 0 : 1.15,
    hits: type === "fiber" ? 3 : 5,
  }));
}
export function worldLimit(world) {
  return world ? 49.5 : 15.5;
}
export function inBounds(x, z, world) {
  return world
    ? Math.abs(x) <= 49.5 && Math.abs(z) <= 49.5
    : Math.hypot(x, z) <= 15.5;
}
export function obstaclesFor(nodes, state) {
  const obstacles = nodes
    .filter((n) => n.radius > 0 && (state.depleted[n.id] || 0) < n.hits)
    .map((n) => ({ x: n.x, z: n.z, radius: n.radius }));
  // Raised stone platform is solid; player does not climb onto it.
  obstacles.push({ x: 0, z: -11.5, radius: 2.65 });
  if (state.crafted.includes("campfire"))
    obstacles.push({ x: -2.6, z: 1.2, radius: 0.9 });
  if (state.crafted.includes("beacon"))
    obstacles.push({ x: 0, z: -11.5, radius: 1.2 });
  return obstacles;
}
export function canStand(x, z, obstacles, world, padding = 0.36) {
  return (
    inBounds(x, z, world) &&
    !obstacles.some((o) => Math.hypot(x - o.x, z - o.z) < o.radius + padding)
  );
}
export function moveWithCollisions(from, to, obstacles, world) {
  const steps = Math.max(
    1,
    Math.ceil(Math.hypot(to.x - from.x, to.z - from.z) / 0.15),
  );
  const dx = (to.x - from.x) / steps,
    dz = (to.z - from.z) / steps;
  let { x, z } = from;
  for (let i = 0; i < steps; i++) {
    if (canStand(x + dx, z + dz, obstacles, world)) {
      x += dx;
      z += dz;
    } else {
      if (canStand(x + dx, z, obstacles, world)) x += dx;
      if (canStand(x, z + dz, obstacles, world)) z += dz;
    }
  }
  return { x, z };
}
// Deterministic 1 m grid BFS; targets inside resources stop at a reachable edge.
export function findPath(from, target, obstacles, world) {
  const limit = Math.floor(worldLimit(world));
  const start = { x: Math.round(from.x), z: Math.round(from.z) };
  const key = (x, z) => `${x},${z}`;
  const queue = [start],
    parents = new Map([[key(start.x, start.z), null]]);
  let closest = start,
    best = Math.hypot(start.x - target.x, start.z - target.z);
  for (let at = 0; at < queue.length; at++) {
    const p = queue[at],
      d = Math.hypot(p.x - target.x, p.z - target.z);
    if (d < best) {
      closest = p;
      best = d;
    }
    if (d < 0.6) break;
    for (const [dx, dz] of [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ]) {
      const x = p.x + dx,
        z = p.z + dz,
        k = key(x, z);
      if (
        Math.abs(x) > limit ||
        Math.abs(z) > limit ||
        parents.has(k) ||
        !canStand(x, z, obstacles, world, 0.46)
      )
        continue;
      // Check mid-edge too: grid edges cannot cut a collider.
      if (!canStand(p.x + dx * 0.5, p.z + dz * 0.5, obstacles, world, 0.46))
        continue;
      parents.set(k, p);
      queue.push({ x, z });
    }
  }
  const path = [];
  let p = closest;
  while (p && key(p.x, p.z) !== key(start.x, start.z)) {
    path.push(p);
    p = parents.get(key(p.x, p.z));
  }
  path.reverse();
  return path;
}
