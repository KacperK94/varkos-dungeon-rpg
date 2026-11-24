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
import { bindPress } from "./press.js";
import {
  loadSettings,
  saveSettings,
  normalizeSettings,
  canTapMove,
} from "./settings.js";
import { createAudio } from "./audio.js";

const $ = (selector) => document.querySelector(selector);
let saved = null;
try {
  saved = restore(localStorage.getItem(SAVE_KEY));
} catch {
  /* Storage may be disabled. Play without persistence. */
}
const state = saved || createState();
let settings;
try {
  settings = loadSettings(localStorage);
} catch {
  settings = normalizeSettings();
}
const audio = createAudio(settings);
let audioReady = false;
async function unlockAudio() {
  audioReady = await audio.unlock();
  $("#audio-status").textContent = audioReady
    ? "Dźwięk gotowy"
    : "Dźwięk niedostępny lub zablokowany przez przeglądarkę";
}
window.addEventListener("pointerdown", unlockAudio, { capture: true });
window.addEventListener("keydown", unlockAudio, { capture: true });
let world,
  activeTab = "all",
  lastGather = 0,
  saveBlocked = false;
const keys = new Set();
const touchKeys = new Set();
const cancelPresses = [];
let holdingGather = false;
const mobileLayout = matchMedia("(max-width: 850px), (pointer: coarse)");
let workshopOpen = false;
function stopInput() {
  keys.clear();
  touchKeys.clear();
  holdingGather = false;
  cancelPresses.forEach((cancel) => cancel());
  world?.stopWalk();
}
function setWorkshop(open, restoreFocus = true) {
  stopInput();
  workshopOpen = open && mobileLayout.matches;
  const panel = $("#workshop");
  panel.classList.toggle("mobile-open", workshopOpen);
  panel.inert = mobileLayout.matches && !workshopOpen;
  $("#workshop-backdrop").hidden = !workshopOpen;
  $("#mobile-craft").setAttribute("aria-expanded", String(workshopOpen));
  $("#play-area").inert = workshopOpen;
  $(".topbar").inert = workshopOpen;
  if (workshopOpen) {
    panel.setAttribute("role", "dialog");
    panel.setAttribute("aria-modal", "true");
  } else {
    panel.removeAttribute("role");
    panel.removeAttribute("aria-modal");
  }
  if (workshopOpen) $("#close-workshop").focus();
  else if (restoreFocus && mobileLayout.matches) $("#mobile-craft").focus();
}
mobileLayout.addEventListener("change", () => setWorkshop(false, false));
const dialogs = [...document.querySelectorAll("dialog")];
const isActive = () =>
  !dialogs.some((dialog) => dialog.open) && !document.hidden && !!world;
function save() {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(state));
    $("#save-status").textContent = "Zapisano lokalnie";
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
      return `<article class="recipe ${done ? "done" : ""}"><div class="recipe-head"><span class="recipe-icon ${recipe.id}">${recipe.icon}</span><div><span class="recipe-category">${recipe.category === "tools" ? "NARZĘDZIE" : "BUDOWLA"}</span><h4>${recipe.name}</h4></div>${done ? '<span class="done-check">+</span>' : ""}</div><p>${recipe.description}</p><div class="costs">${Object.entries(
        recipe.cost,
      )
        .map(
          ([key, value]) =>
            `<span class="cost ${state.inventory[key] >= value || done ? "enough" : ""}" title="${MATERIALS[key].name}"><span aria-hidden="true">${MATERIALS[key].icon}</span> ${value}<span class="sr-only"> ${MATERIALS[key].name}</span></span>`,
        )
        .join(
          "",
        )}</div><button class="craft-button" data-craft="${recipe.id}" ${reason ? "disabled" : ""} title="${reason || "Wytwórz przedmiot"}">${done ? "W ekwipunku" : reason === "Wymaga ogniska i kilofa" ? "Najpierw ognisko i kilof" : reason ? "Brakuje surowców" : "Wytwórz"}<span>${done ? "" : "→"}</span><span class="sr-only"> — ${recipe.name}</span></button></article>`;
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
        `<li class="${q.done ? "complete" : ""}"><span class="quest-number">${q.done ? "+" : "0" + (i + 1)}</span><div><strong>${q.title}</strong><small>${q.detail}</small></div></li>`,
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
  if (!isActive() || workshopOpen || performance.now() - lastGather < 450)
    return;
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
  audio.effect(node.type);
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
    audio.effect(button.dataset.craft === "beacon" ? "win" : "craft");
    renderUI();
    save();
    if (button.dataset.craft === "beacon") {
      stopInput();
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
  stopInput();
  save();
  $(id).showModal();
}
function applySettings() {
  stopInput();
  document.body.classList.toggle(
    "arrow-controls",
    settings.controls === "arrows",
  );
  $(".touch-pad").inert = canTapMove(settings);
  $("#control-hint").textContent = canTapMove(settings)
    ? "Dotknij wyspy, aby podejść"
    : "Poruszaj się strzałkami";
  world?.setSettings(settings);
  audio.update(settings);
}
function syncSettingsUI() {
  document.querySelectorAll('[name="controls"]').forEach((input) => {
    input.checked = input.value === settings.controls;
  });
  $("#graphics-quality").value = settings.graphics;
  $("#sound-muted").checked = settings.muted;
  for (const key of ["master", "music", "ambient", "effects"]) {
    $("#volume-" + key).value = Math.round(settings[key] * 100);
    $("#value-" + key).textContent = Math.round(settings[key] * 100) + "%";
  }
}
$("#settings-button").onclick = () => {
  syncSettingsUI();
  showDialog("#settings-dialog");
};
function changeSetting(event) {
  const input = event.target;
  if (input.name === "controls") settings.controls = input.value;
  else if (input.id === "graphics-quality") settings.graphics = input.value;
  else if (input.id === "sound-muted") settings.muted = input.checked;
  else if (input.dataset.volume)
    settings[input.dataset.volume] = Number(input.value) / 100;
  else return;
  settings = normalizeSettings(settings);
  applySettings();
  syncSettingsUI();
  let stored = false;
  try {
    stored = saveSettings(localStorage, settings);
  } catch {
    /* Disabled storage. */
  }
  $("#settings-status").textContent = stored
    ? "Ustawienia zapisane na tym urządzeniu"
    : "Zapis zablokowany — ustawienia działają tylko do zamknięcia strony";
}
$("#settings-dialog").addEventListener("input", changeSetting);
$("#settings-dialog").addEventListener("change", changeSetting);
$("#sound-test").onclick = async () => {
  await unlockAudio();
  audio.effect("craft");
};
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
// Keep the introduction open until the player explicitly starts.
for (const dialog of dialogs)
  dialog.addEventListener("cancel", (event) => {
    if (dialog.id === "welcome") event.preventDefault();
  });
cancelPresses.push(
  bindPress($("#gather"), {
    start() {
      if (!isActive() || workshopOpen) return false;
      holdingGather = true;
      gatherNearest();
    },
    end() {
      holdingGather = false;
    },
    activate: gatherNearest,
  }),
);
$("#mobile-craft").onclick = () => setWorkshop(!workshopOpen);
$("#close-workshop").onclick = () => setWorkshop(false);
$("#workshop-backdrop").onclick = () => setWorkshop(false);
$("#quest-toggle").onclick = () => {
  const expanded = $("#quest-toggle").getAttribute("aria-expanded") !== "true";
  $("#quest-toggle").setAttribute("aria-expanded", String(expanded));
  $(".quest-panel").classList.toggle("expanded", expanded);
};
$("#zoom-in").onclick = () => world?.changeZoom(-3);
$("#zoom-out").onclick = () => world?.changeZoom(3);
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
];
window.addEventListener("keydown", (event) => {
  if (
    workshopOpen &&
    !dialogs.some((dialog) => dialog.open) &&
    event.code === "Tab"
  ) {
    const focusable = [
      ...$("#workshop").querySelectorAll("button:not(:disabled)"),
    ];
    const first = focusable[0],
      last = focusable.at(-1);
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }
  if (movementKeys.includes(event.code) && isActive()) event.preventDefault();
  if (event.code === "Escape" && workshopOpen) {
    event.preventDefault();
    setWorkshop(false);
    return;
  }
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
    setWorkshop(!workshopOpen);
    $("#recipes").scrollTo({ top: 0, behavior: "smooth" });
  }
});
window.addEventListener("keyup", (event) => keys.delete(event.code));
window.addEventListener("blur", () => {
  stopInput();
  save();
});
document.addEventListener("visibilitychange", () => {
  stopInput();
  if (document.hidden) {
    audio.setActive(false);
    save();
  }
});
window.addEventListener("pagehide", () => {
  save();
  audio.setActive(false);
});
const touchDirection = {
  up: [0, -1],
  down: [0, 1],
  left: [-1, 0],
  right: [1, 0],
};
for (const button of document.querySelectorAll("[data-move]")) {
  const direction = button.dataset.move;
  const step = () => {
    if (!isActive() || workshopOpen || canTapMove(settings)) return;
    const [x, z] = touchDirection[direction];
    world.walkTo(
      state.position.x + (x * 0.8 + z * 0.6) * 0.8,
      state.position.z + (z * 0.8 - x * 0.6) * 0.8,
    );
  };
  cancelPresses.push(
    bindPress(button, {
      start() {
        if (!isActive() || workshopOpen || canTapMove(settings)) return false;
        world.stopWalk();
        touchKeys.add(direction);
      },
      end({ cancelled, duration }) {
        touchKeys.delete(direction);
        if (!cancelled && duration < 120) step();
      },
      activate: step,
    }),
  );
}
setWorkshop(false, false);
renderUI();
applySettings();
try {
  world = createWorld($("#world"), state, settings);
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
    const active = isActive() && !workshopOpen;
    const audioActive =
      !document.hidden && (active || $("#settings-dialog").open);
    audio.setActive(audioActive);
    const movement = {
      x:
        Number(
          (canTapMove(settings) && keys.has("KeyD")) ||
            keys.has("ArrowRight") ||
            touchKeys.has("right"),
        ) -
        Number(
          (canTapMove(settings) && keys.has("KeyA")) ||
            keys.has("ArrowLeft") ||
            touchKeys.has("left"),
        ),
      z:
        Number(
          (canTapMove(settings) && keys.has("KeyS")) ||
            keys.has("ArrowDown") ||
            touchKeys.has("down"),
        ) -
        Number(
          (canTapMove(settings) && keys.has("KeyW")) ||
            keys.has("ArrowUp") ||
            touchKeys.has("up"),
        ),
    };
    const target = world.frame(
      dt,
      movement,
      keys.has("ShiftLeft") || keys.has("ShiftRight"),
      active,
    );
    if (active) {
      if (holdingGather) gatherNearest();
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
