import "./style.css";
import {
  SAVE_KEY,
  MATERIALS,
  RECIPES,
  createState,
  restore,
  craft,
  craftReason,
  gather,
} from "./game.js";
import { createWorld } from "./world.js";

const $ = (selector) => document.querySelector(selector);
let saved = null;
try {
  saved = restore(localStorage.getItem(SAVE_KEY));
} catch {
  /* Storage may be disabled. Play without persistence. */
}
const state = saved || createState();
let world,
  activeTab = "all",
  lastGather = 0,
  saveBlocked = false;
const keys = new Set();
const dialogs = [...document.querySelectorAll("dialog")];
const isActive = () =>
  !dialogs.some((dialog) => dialog.open) && !document.hidden && !!world;
function save() {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(state));
    $("#save-status").textContent = "✓ Zapisano lokalnie";
    saveBlocked = false;
  } catch {
    $("#save-status").textContent = "Zapis niedostępny";
    if (!saveBlocked)
      notify(
        "Zapis lokalny jest zablokowany. Postęp nie przetrwa zamknięcia strony.",
      );
    saveBlocked = true;
  }
}
let toastTimer;
function notify(message) {
  $("#toast").textContent = message;
  $("#toast").classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => $("#toast").classList.remove("show"), 3100);
}
function renderUI() {
  $("#inventory").innerHTML = Object.entries(MATERIALS)
    .map(
      ([key, item]) =>
        `<div class="material"><span class="material-icon ${key}">${item.icon}</span><span>${item.name}<strong id="count-${key}">${state.inventory[key]}</strong></span></div>`,
    )
    .join("");
  const filtered = RECIPES.filter(
    (recipe) => activeTab === "all" || recipe.category === activeTab,
  );
  $("#recipes").innerHTML = filtered
    .map((recipe) => {
      const done = state.crafted.includes(recipe.id);
      const reason = craftReason(state, recipe);
      return `<article class="recipe ${done ? "done" : ""}"><div class="recipe-head"><span class="recipe-icon ${recipe.id}">${recipe.icon}</span><div><span class="recipe-category">${recipe.category === "tools" ? "NARZĘDZIE" : "BUDOWLA"}</span><h4>${recipe.name}</h4></div>${done ? '<span class="done-check">✓</span>' : ""}</div><p>${recipe.description}</p><div class="costs">${Object.entries(
        recipe.cost,
      )
        .map(
          ([key, value]) =>
            `<span class="cost ${state.inventory[key] >= value || done ? "enough" : ""}" title="${MATERIALS[key].name}"><span aria-hidden="true">${MATERIALS[key].icon}</span> ${value}<span class="sr-only"> ${MATERIALS[key].name}</span></span>`,
        )
        .join(
          "",
        )}</div><button class="craft-button" data-craft="${recipe.id}" ${reason ? "disabled" : ""} title="${reason || "Wytwórz przedmiot"}">${done ? "✓ W ekwipunku" : reason === "Wymaga ogniska i kilofa" ? "Najpierw ognisko i kilof" : reason ? "Brakuje surowców" : "Wytwórz"}<span>${done ? "" : "↗"}</span><span class="sr-only"> — ${recipe.name}</span></button></article>`;
    })
    .join("");
  const quests = [
    {
      title: "Przygotuj narzędzia",
      detail: "Wytwórz kamienny kilof",
      done: state.crafted.includes("pickaxe"),
    },
    {
      title: "Rozpal pierwszy ogień",
      detail: "Zbuduj ognisko w obozie",
      done: state.crafted.includes("campfire"),
    },
    {
      title: "Daj światu znak",
      detail: "Wznieś latarnię ratunkową",
      done: state.crafted.includes("beacon"),
    },
  ];
  const count = quests.filter((q) => q.done).length;
  $("#quests").innerHTML = quests
    .map(
      (q, i) =>
        `<li class="${q.done ? "complete" : ""}"><span class="quest-number">${q.done ? "✓" : "0" + (i + 1)}</span><div><strong>${q.title}</strong><small>${q.detail}</small></div></li>`,
    )
    .join("");
  $("#quest-count").textContent = `${count} / 3`;
  $("#quest-bar").style.width = `${(count / 3) * 100}%`;
  $("#crafted-count").textContent = `${state.crafted.length} / 4`;
  $("#tool-label").textContent = state.crafted.includes("pickaxe")
    ? "Kilof gotowy. Ruszaj po kryształy."
    : state.crafted.includes("axe")
      ? "Z siekierą drewna nigdy za wiele"
      : "Wszystko zaczyna się od rąk";
}
function gatherNearest() {
  if (!isActive() || performance.now() - lastGather < 450) return;
  const node = world.nearest();
  if (!node) {
    notify("Podejdź bliżej drzewa, skały lub rośliny.");
    return;
  }
  lastGather = performance.now();
  const result = gather(state, node);
  if (!result.ok) {
    notify(result.message);
    return;
  }
  node.shake = 1;
  if (result.depleted) world.refresh();
  notify(
    `+${result.amount} ${MATERIALS[node.type].name.toLowerCase()}${result.depleted ? " · surowiec zebrany" : ""}`,
  );
  renderUI();
  save();
}
$("#recipes").addEventListener("click", (event) => {
  const button = event.target.closest("[data-craft]");
  if (!button || !isActive()) return;
  const result = craft(state, button.dataset.craft);
  notify(result.message);
  if (result.ok) {
    renderUI();
    save();
    if (button.dataset.craft === "beacon") {
      world.walkTo(0, -7);
      $("#win-dialog").showModal();
    }
  }
});
for (const button of document.querySelectorAll("[data-tab]"))
  button.addEventListener("click", () => {
    activeTab = button.dataset.tab;
    document
      .querySelectorAll("[data-tab]")
      .forEach((tab) =>
        tab.setAttribute("aria-selected", String(tab === button)),
      );
    renderUI();
  });
function showDialog(id) {
  keys.clear();
  save();
  $(id).showModal();
}
$("#help").onclick = () => showDialog("#help-dialog");
$("#pause").onclick = () => showDialog("#pause-dialog");
$("#reset").onclick = () => showDialog("#reset-dialog");
$("#confirm-reset").onclick = () => {
  Object.assign(state, createState());
  save();
  location.reload();
};
$("#start").onclick = () => {
  $("#welcome").close();
  save();
  notify(
    saved
      ? "Witaj ponownie na swojej wyspie."
      : "Pierwszy krok: zbierz drewno, kamień i włókna.",
  );
};
for (const button of document.querySelectorAll("[data-close]"))
  button.onclick = () => $(`#${button.dataset.close}`).close();
// Do not let Escape silently dismiss the introduction or reset confirmation.
for (const dialog of dialogs)
  dialog.addEventListener("cancel", (event) => {
    if (dialog.id === "welcome") event.preventDefault();
  });
$("#gather").onclick = gatherNearest;
$("#mobile-craft").onclick = () =>
  $("#workshop").classList.toggle("mobile-open");
$("#close-workshop").onclick = () =>
  $("#workshop").classList.remove("mobile-open");
const movementKeys = [
  "KeyW",
  "KeyA",
  "KeyS",
  "KeyD",
  "ArrowUp",
  "ArrowLeft",
  "ArrowDown",
  "ArrowRight",
  "KeyE",
  "Space",
];
window.addEventListener("keydown", (event) => {
  if (movementKeys.includes(event.code) && isActive()) event.preventDefault();
  if (event.code === "Escape" && isActive()) {
    event.preventDefault();
    showDialog("#pause-dialog");
    return;
  }
  if (!isActive()) return;
  keys.add(event.code);
  if (
    event.code === "KeyE" ||
    (event.code === "Space" && event.target === document.body)
  )
    gatherNearest();
  if (event.code === "KeyC" && !event.repeat) {
    $("#workshop").classList.toggle("mobile-open");
    $("#recipes").scrollTo({ top: 0, behavior: "smooth" });
  }
});
window.addEventListener("keyup", (event) => keys.delete(event.code));
window.addEventListener("blur", () => {
  keys.clear();
  save();
});
document.addEventListener("visibilitychange", () => {
  keys.clear();
  if (document.hidden) save();
});
window.addEventListener("pagehide", save);
const touchDirection = {
  up: [0, -1],
  down: [0, 1],
  left: [-1, 0],
  right: [1, 0],
};
for (const button of document.querySelectorAll("[data-move]")) {
  let held = false;
  const code = { up: "KeyW", down: "KeyS", left: "KeyA", right: "KeyD" }[
    button.dataset.move
  ];
  button.addEventListener("pointerdown", (event) => {
    if (!isActive()) return;
    held = true;
    button.setPointerCapture(event.pointerId);
    keys.add(code);
  });
  button.addEventListener("pointerup", () => {
    held = false;
    keys.delete(code);
  });
  button.addEventListener("lostpointercapture", () => {
    held = false;
    keys.delete(code);
  });
  button.addEventListener("click", () => {
    if (!isActive() || held) return;
    // A tap is also a short step, so touch and keyboard activation are useful.
    const [x, z] = touchDirection[button.dataset.move];
    world.walkTo(
      state.position.x + (x * 0.8 + z * 0.6) * 1.4,
      state.position.z + (z * 0.8 - x * 0.6) * 1.4,
    );
  });
}
renderUI();
try {
  world = createWorld($("#world"), state);
  if (!saved) $("#welcome").showModal();
} catch (error) {
  $("#error").hidden = false;
  $("#gather").disabled = true;
  $("#error").querySelector("p").textContent +=
    ` (${error instanceof Error ? error.message.slice(0, 100) : "Błąd grafiki"})`;
}
let lastFrame = performance.now(),
  saveTime = 0,
  previousTarget = "";
function tick(now) {
  const dt = Math.min((now - lastFrame) / 1000, 0.05);
  lastFrame = now;
  if (world) {
    const active = isActive();
    const movement = {
      x:
        Number(keys.has("KeyD") || keys.has("ArrowRight")) -
        Number(keys.has("KeyA") || keys.has("ArrowLeft")),
      z:
        Number(keys.has("KeyS") || keys.has("ArrowDown")) -
        Number(keys.has("KeyW") || keys.has("ArrowUp")),
    };
    const target = world.frame(
      dt,
      movement,
      keys.has("ShiftLeft") || keys.has("ShiftRight"),
      active,
    );
    if (active) {
      state.elapsed += dt;
      saveTime += dt;
      if (saveTime > 12) {
        save();
        saveTime = 0;
      }
      $("#day").textContent = `Dzień ${Math.floor(state.elapsed / 600) + 1}`;
    }
    const signature = target
      ? `${target.id}-${state.depleted[target.id] || 0}`
      : "";
    if (signature !== previousTarget || !$("#gather").dataset.ready) {
      $("#gather").dataset.ready = "true";
      previousTarget = signature;
      $("#gather-label").textContent = target
        ? `Zbierz ${MATERIALS[target.type].name.toLowerCase()}`
        : "Podejdź do surowca";
      $("#gather").classList.toggle("available", !!target);
      $("#target-hint").textContent = target
        ? `${target.hits - (state.depleted[target.id] || 0)} pozostałych zbiorów${target.type === "crystal" ? " · wymagany kilof" : ""}`
        : "Drzewa · skały · rośliny · kryształy";
    }
  }
  requestAnimationFrame(tick);
}
requestAnimationFrame(tick);
