import test from "node:test";
import assert from "node:assert/strict";
import { bindCameraGestures, clampZoom } from "../src/camera-gestures.js";
class Canvas extends EventTarget {
  captured = new Set();
  setPointerCapture(id) {
    this.captured.add(id);
  }
  hasPointerCapture(id) {
    return this.captured.has(id);
  }
  releasePointerCapture(id) {
    this.captured.delete(id);
  }
  send(type, id, x = 0, y = 0, pointerType = "touch") {
    const event = new Event(type, { cancelable: true });
    Object.assign(event, {
      pointerId: id,
      clientX: x,
      clientY: y,
      button: 0,
      pointerType,
    });
    this.dispatchEvent(event);
  }
}
function setup() {
  const canvas = new Canvas();
  const state = { zoom: 24, taps: [], pinches: 0 };
  const gestures = bindCameraGestures(canvas, {
    getZoom: () => state.zoom,
    setZoom: (value) => {
      state.zoom = value;
    },
    onTap: (...point) => state.taps.push(point),
    onPinch: () => {
      state.pinches++;
    },
  });
  return { canvas, state, gestures };
}
test("spreading fingers zooms in and closing them zooms out proportionally", () => {
  const { canvas, state } = setup();
  canvas.send("pointerdown", 1, 0);
  canvas.send("pointerdown", 2, 100);
  canvas.send("pointermove", 2, 150);
  assert.equal(state.zoom, 16);
  canvas.send("pointermove", 2, 80);
  assert.equal(state.zoom, 30);
  assert.equal(state.pinches, 1);
});
test("pinch respects both camera limits", () => {
  const { canvas, state } = setup();
  canvas.send("pointerdown", 1, 0);
  canvas.send("pointerdown", 2, 100);
  canvas.send("pointermove", 2, 10000);
  assert.equal(state.zoom, 16);
  canvas.send("pointermove", 2, 1);
  assert.equal(state.zoom, 36);
  assert.equal(clampZoom(24), 24);
});
test("neither finger release after a pinch starts a walk, even without moving", () => {
  const { canvas, state } = setup();
  canvas.send("pointerdown", 1, 10);
  canvas.send("pointerdown", 2, 100);
  canvas.send("pointerup", 2, 100);
  canvas.send("pointermove", 1, 12);
  canvas.send("pointerup", 1, 12);
  assert.deepEqual(state.taps, []);
  canvas.send("pointerdown", 3, 60);
  canvas.send("pointerup", 3, 60);
  assert.deepEqual(state.taps, [[60, 0]]);
});
test("mouse and single-finger taps still walk; dragging never becomes a tap", () => {
  const { canvas, state } = setup();
  canvas.send("pointerdown", 1, 5, 6, "mouse");
  canvas.send("pointerup", 1, 5, 6, "mouse");
  canvas.send("pointerdown", 2, 40);
  canvas.send("pointermove", 2, 90);
  canvas.send("pointermove", 2, 40);
  canvas.send("pointerup", 2, 40);
  assert.deepEqual(state.taps, [[5, 6]]);
});
test("pointer cancellation and lost capture cannot select a target", () => {
  for (const type of ["pointercancel", "lostpointercapture"]) {
    const { canvas, state } = setup();
    canvas.send("pointerdown", 1, 0);
    canvas.send("pointerdown", 2, 100);
    canvas.send(type, 1, 0);
    canvas.send("pointerup", 2, 100);
    assert.deepEqual(state.taps, []);
    assert.equal(canvas.captured.size, 0);
  }
});
test("pause cancels captures and a subsequent pinch starts from current zoom", () => {
  const { canvas, state, gestures } = setup();
  canvas.send("pointerdown", 1, 0);
  canvas.send("pointerdown", 2, 100);
  canvas.send("pointermove", 2, 120);
  gestures.cancel();
  canvas.send("pointermove", 2, 150);
  canvas.send("pointerup", 1, 0);
  canvas.send("pointerup", 2, 150);
  assert.equal(state.zoom, 20);
  assert.equal(canvas.captured.size, 0);
  assert.deepEqual(state.taps, []);
  canvas.send("pointerdown", 3, 0);
  canvas.send("pointerdown", 4, 100);
  canvas.send("pointermove", 4, 80);
  assert.equal(state.zoom, 25);
});
test("third finger suspends zoom; releasing it rebases without a jump", () => {
  const { canvas, state } = setup();
  canvas.send("pointerdown", 1, 0);
  canvas.send("pointerdown", 2, 100);
  canvas.send("pointerdown", 3, 200);
  canvas.send("pointermove", 2, 150);
  assert.equal(state.zoom, 24);
  canvas.send("pointerup", 3, 200);
  canvas.send("pointermove", 2, 150);
  assert.equal(state.zoom, 24);
  canvas.send("pointermove", 2, 180);
  assert.equal(state.zoom, 20);
});
test("coincident fingers do not produce infinity and dispose removes listeners", () => {
  const { canvas, state, gestures } = setup();
  canvas.send("pointerdown", 1, 10);
  canvas.send("pointerdown", 2, 10);
  canvas.send("pointermove", 2, 20);
  assert.equal(state.zoom, 24);
  canvas.send("pointermove", 2, 25);
  assert.equal(state.zoom, 16);
  gestures.dispose();
  canvas.send("pointerdown", 5, 0);
  canvas.send("pointerup", 5, 0);
  assert.deepEqual(state.taps, []);
});
