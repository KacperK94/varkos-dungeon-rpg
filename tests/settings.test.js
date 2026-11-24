import test from "node:test";
import assert from "node:assert/strict";
import {
  normalizeSettings,
  loadSettings,
  saveSettings,
  SETTINGS_KEY,
  canTapMove,
  mixLevels,
} from "../src/settings.js";
import { renderQuality } from "../src/render-quality.js";
import { createAudio } from "../src/audio.js";

test("new player moves by tapping with arrows off; switching is exclusive", () => {
  assert.equal(canTapMove(normalizeSettings()), true);
  assert.equal(canTapMove(normalizeSettings({ controls: "arrows" })), false);
  assert.equal(canTapMove(normalizeSettings({ controls: "unknown" })), true);
});
test("settings persist independently of expedition progress", () => {
  const map = new Map([["ember-island-v1", "existing-save"]]);
  const storage = {
    getItem: (key) => map.get(key),
    setItem: (key, value) => map.set(key, value),
  };
  const settings = normalizeSettings({
    controls: "arrows",
    graphics: "low",
    music: 0,
    effects: 0.9,
  });
  assert.equal(saveSettings(storage, settings), true);
  assert.deepEqual(loadSettings(storage), settings);
  assert.equal(map.get("ember-island-v1"), "existing-save");
  assert.ok(map.has(SETTINGS_KEY));
});
test("corrupt preferences and disabled storage fail safely", () => {
  assert.deepEqual(loadSettings({ getItem: () => "{" }), normalizeSettings());
  assert.deepEqual(
    loadSettings({
      getItem() {
        throw Error("blocked");
      },
    }),
    normalizeSettings(),
  );
  assert.equal(
    saveSettings(
      {
        setItem() {
          throw Error("blocked");
        },
      },
      {},
    ),
    false,
  );
  const settings = normalizeSettings({
    master: -5,
    music: 9,
    ambient: NaN,
    effects: "1",
    muted: "yes",
    graphics: "ultra",
  });
  assert.equal(settings.master, 0);
  assert.equal(settings.music, 1);
  assert.equal(settings.ambient, 0.45);
  assert.equal(settings.effects, 0.7);
  assert.equal(settings.muted, false);
  assert.equal(settings.graphics, "auto");
});
test("master mute preserves independent sound channel levels", () => {
  const s = normalizeSettings({
    muted: true,
    music: 0,
    ambient: 0.8,
    effects: 0.2,
  });
  assert.deepEqual(mixLevels(s), {
    master: 0,
    music: 0,
    ambient: 0.8,
    effects: 0.2,
  });
  assert.equal(mixLevels({ ...s, muted: false }).master, 0.65);
});
test("economy graphics do not increase resolution on zoom and cost less than auto", () => {
  const options = {
    zoom: 16,
    width: 390,
    height: 780,
    deviceRatio: 3,
    touchDevice: true,
  };
  assert.equal(renderQuality({ ...options, graphics: "low" }).pixelRatio, 1);
  assert.equal(
    renderQuality({ ...options, graphics: "medium" }).pixelRatio,
    1.25,
  );
  assert.equal(renderQuality({ ...options, graphics: "auto" }).pixelRatio, 2);
  assert.deepEqual(
    renderQuality({ ...options, graphics: "low" }),
    renderQuality({ ...options, zoom: 36, graphics: "low" }),
  );
});

function audioContext() {
  const gains = [],
    oscillators = [];
  const param = () => ({
    value: 0,
    setTargetAtTime(v) {
      this.value = v;
    },
    setValueAtTime(v) {
      this.value = v;
    },
    linearRampToValueAtTime() {},
    exponentialRampToValueAtTime() {},
  });
  const node = () => ({ connect() {}, disconnect() {}, start() {}, stop() {} });
  const ctx = {
    state: "suspended",
    currentTime: 0,
    sampleRate: 16,
    destination: {},
    async resume() {
      this.state = "running";
    },
    async suspend() {
      this.state = "suspended";
    },
    async close() {
      this.state = "closed";
    },
    createGain() {
      const gain = { ...node(), gain: param() };
      gains.push(gain);
      return gain;
    },
    createBuffer: () => ({ getChannelData: () => new Float32Array(64) }),
    createBufferSource: node,
    createBiquadFilter: () => ({ ...node(), frequency: param() }),
    createOscillator() {
      const osc = { ...node(), frequency: param() };
      oscillators.push(osc);
      return osc;
    },
  };
  return { ctx, gains, oscillators };
}
test("audio starts only on unlock, routes separate gains, mutes and suspends", async () => {
  const { ctx, gains, oscillators } = audioContext();
  let creations = 0;
  const audio = createAudio(normalizeSettings(), () => {
    creations++;
    return ctx;
  });
  audio.setActive(true);
  assert.equal(creations, 0);
  assert.equal(await audio.unlock(), true);
  assert.equal(creations, 1);
  assert.equal(gains[0].gain.value, 0.65);
  assert.equal(gains[1].gain.value, 0.35);
  audio.update(
    normalizeSettings({ muted: true, music: 0.1, ambient: 0, effects: 0.9 }),
  );
  assert.equal(gains[0].gain.value, 0);
  assert.equal(gains[1].gain.value, 0.1);
  assert.equal(gains[2].gain.value, 0);
  assert.equal(gains[3].gain.value, 0.9);
  const before = oscillators.length;
  audio.effect("craft");
  assert.equal(oscillators.length, before + 3);
  audio.setActive(false);
  assert.equal(ctx.state, "suspended");
  audio.effect("stone");
  assert.equal(oscillators.length, before + 3);
  await audio.dispose();
  assert.equal(ctx.state, "closed");
});
test("unsupported audio never blocks gameplay and cannot start after disposal", async () => {
  const audio = createAudio(normalizeSettings(), () => {
    throw Error("unsupported");
  });
  assert.equal(await audio.unlock(), false);
  audio.effect("craft");
  audio.setActive(false);
  await audio.dispose();
  assert.equal(await audio.unlock(), false);
});
