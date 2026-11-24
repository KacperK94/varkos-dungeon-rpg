import { normalizeWorld, inBounds } from "./world-map.js";
import { ICONS } from "./icons.js";

export const SAVE_KEY = "ember-island-v1";
export const MATERIALS = {
  wood: { name: "Drewno", icon: ICONS.wood, color: "#dca56f" },
  stone: { name: "Kamień", icon: ICONS.stone, color: "#bcc5ce" },
  fiber: { name: "Włókno", icon: ICONS.fiber, color: "#a9c888" },
  crystal: { name: "Kryształ", icon: ICONS.crystal, color: "#8bdad0" },
};
export const RECIPES = [
  {
    id: "axe",
    name: "Kamienna siekiera",
    category: "tools",
    icon: ICONS.axe,
    description: "Dwa razy więcej drewna przy każdym uderzeniu.",
    cost: { wood: 4, stone: 2, fiber: 2 },
  },
  {
    id: "pickaxe",
    name: "Kamienny kilof",
    category: "tools",
    icon: ICONS.pickaxe,
    description: "Wydobywaj kryształy i sprawniej rozbijaj skały.",
    cost: { wood: 4, stone: 4 },
  },
  {
    id: "campfire",
    name: "Ognisko",
    category: "camp",
    icon: ICONS.campfire,
    description: "Pierwszy płomień. Początek twojego obozu.",
    cost: { wood: 6, stone: 4 },
  },
  {
    id: "beacon",
    name: "Latarnia ratunkowa",
    category: "camp",
    icon: ICONS.beacon,
    description: "Rozświetl horyzont i ukończ swoją wyprawę.",
    cost: { wood: 10, stone: 8, crystal: 4 },
    requires: ["campfire", "pickaxe"],
  },
];
export function createState() {
  return {
    version: 1,
    inventory: { wood: 0, stone: 0, fiber: 0, crystal: 0 },
    crafted: [],
    depleted: {},
    position: { x: 0, z: 6 },
    elapsed: 0,
  };
}
export function craftReason(state, recipe) {
  if (!recipe) return "Nieznana receptura";
  if (state.crafted.includes(recipe.id)) return "Już wytworzono";
  if (state.world?.mode === "explorer") return "";
  if (recipe.requires?.some((id) => !state.crafted.includes(id)))
    return "Wymaga ogniska i kilofa";
  if (
    Object.entries(recipe.cost).some(
      ([key, value]) => state.inventory[key] < value,
    )
  )
    return "Zbierz brakujące surowce";
  return "";
}
export function craft(state, id) {
  const recipe = RECIPES.find((item) => item.id === id);
  const reason = craftReason(state, recipe);
  if (reason) return { ok: false, message: reason };
  for (const [key, value] of Object.entries(
    state.world?.mode === "explorer" ? {} : recipe.cost,
  ))
    state.inventory[key] -= value;
  state.crafted.push(id);
  return { ok: true, message: `Wytworzono: ${recipe.name}` };
}
export function gather(state, node) {
  const hits = state.depleted[node.id] || 0;
  if (hits >= node.hits) return { ok: false, message: "Surowiec wyczerpany" };
  if (
    node.type === "crystal" &&
    !state.crafted.includes("pickaxe") &&
    state.world?.mode !== "explorer"
  )
    return { ok: false, message: "Do kryształów potrzebujesz kilofa" };
  const amount =
    (node.type === "wood" && state.crafted.includes("axe")) ||
    (node.type === "stone" && state.crafted.includes("pickaxe"))
      ? 2
      : 1;
  state.inventory[node.type] += amount;
  state.depleted[node.id] = hits + 1;
  return { ok: true, amount, type: node.type, depleted: hits + 1 >= node.hits };
}
export function restore(raw) {
  try {
    const data = JSON.parse(raw);
    if (data?.version !== 1 || !data.inventory || !Array.isArray(data.crafted))
      return null;
    const state = createState();
    if (data.world?.generator === 1 && Number.isInteger(data.world.seed)) {
      state.world = normalizeWorld(data.world);
      state.tutorial = Number.isInteger(data.tutorial)
        ? Math.max(0, Math.min(5, data.tutorial))
        : 0;
    }
    for (const key of Object.keys(MATERIALS)) {
      const value = data.inventory[key];
      if (!Number.isSafeInteger(value) || value < 0 || value > 100000)
        return null;
      state.inventory[key] = value;
    }
    state.crafted = [
      ...new Set(data.crafted.filter((id) => RECIPES.some((r) => r.id === id))),
    ];
    if (data.depleted && typeof data.depleted === "object") {
      for (const [key, value] of Object.entries(data.depleted)) {
        if (
          /^node-\d+$/.test(key) &&
          Number.isInteger(value) &&
          value >= 0 &&
          value <= 10
        )
          state.depleted[key] = value;
      }
    }
    if (
      Number.isFinite(data.position?.x) &&
      Number.isFinite(data.position?.z) &&
      inBounds(data.position.x, data.position.z, state.world)
    )
      state.position = { x: data.position.x, z: data.position.z };
    if (Number.isFinite(data.elapsed) && data.elapsed >= 0)
      state.elapsed = Math.min(data.elapsed, 1e8);
    return state;
  } catch {
    return null;
  }
}
export function clampPosition(x, z) {
  const distance = Math.hypot(x, z);
  return distance > 15.5
    ? { x: (x / distance) * 15.5, z: (z / distance) * 15.5 }
    : { x, z };
}

export function createExpedition(config) {
  return { ...createState(), world: normalizeWorld(config), tutorial: 0 };
}
export function inventoryItems(state) {
  return RECIPES.filter((recipe) => state.crafted.includes(recipe.id)).map(
    (recipe) => ({
      id: recipe.id,
      name: recipe.name,
      icon: recipe.icon,
      kind:
        recipe.category === "tools"
          ? "Założone automatycznie"
          : "Zbudowane na wyspie",
    }),
  );
}
