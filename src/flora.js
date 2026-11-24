import { seededRandom } from "./world-map.js";

// Separate random stream: decorations never move saved resource nodes or IDs.
export function generateFlora(world, nodes = []) {
  const random = seededRandom((world?.seed ?? 741) ^ 0x6f10a93b);
  const density = { sparse: 0.65, normal: 1, dense: 1.5 }[
    world?.vegetation ?? "normal"
  ];
  const count = Math.round((world ? 3800 : 600) * density);
  const extent = world ? 48 : 15;
  const patches = Array.from({ length: world ? 36 : 10 }, () => ({
    x: (random() * 2 - 1) * extent,
    z: (random() * 2 - 1) * extent,
    radius: 2 + random() * 7,
  }));
  const result = [];
  for (
    let attempts = 0;
    result.length < count && attempts < count * 20;
    attempts++
  ) {
    const patch = patches[Math.floor(random() * patches.length)];
    const clustered = random() < 0.7;
    const a = random() * Math.PI * 2,
      r = Math.sqrt(random()) * patch.radius;
    const x = clustered
      ? patch.x + Math.cos(a) * r
      : (random() * 2 - 1) * extent;
    const z = clustered
      ? patch.z + Math.sin(a) * r
      : (random() * 2 - 1) * extent;
    if (world ? Math.abs(x) > 48 || Math.abs(z) > 48 : Math.hypot(x, z) > 15)
      continue;
    if (
      (Math.abs(x) < 1.6 && z > -14 && z < 10) ||
      Math.hypot(x + 2.6, z - 1.2) < 1.8 ||
      Math.hypot(x, z + 11.5) < 3.4 ||
      Math.hypot(x, z - 6) < 1.2
    )
      continue;
    if (
      nodes.some(
        (node) =>
          Math.hypot(x - node.x, z - node.z) < (node.radius || 0.5) + 0.5,
      )
    )
      continue;
    const roll = random();
    const kind = roll < 0.72 ? "grass" : roll < 0.91 ? "flower" : "shrub";
    result.push({
      x,
      z,
      kind,
      scale: 0.55 + random() * 1.1,
      rotation: random() * Math.PI * 2,
      color: Math.floor(random() * 4),
    });
  }
  return result;
}
