import test from "node:test";
import assert from "node:assert/strict";
import { bindPress } from "../src/press.js";
class Button extends EventTarget {
  disabled = false;
  captured = new Set();
  classes = new Set();
  classList = {
    add: (name) => this.classes.add(name),
    remove: (name) => this.classes.delete(name),
  };
  setPointerCapture(id) {
    this.captured.add(id);
  }
  hasPointerCapture(id) {
    return this.captured.has(id);
  }
  releasePointerCapture(id) {
    this.captured.delete(id);
  }
  send(type, props = {}) {
    const event = new Event(type, { cancelable: true });
    Object.assign(event, { pointerId: 1, button: 0, detail: 1 }, props);
    this.dispatchEvent(event);
  }
}
test("a held pointer releases once and its synthetic click does not activate again", () => {
  const button = new Button();
  let starts = 0,
    ends = [],
    activations = 0;
  bindPress(button, {
    start() {
      starts++;
    },
    end: (event) => ends.push(event),
    activate() {
      activations++;
    },
  });
  button.send("pointerdown");
  assert.equal(button.classes.has("pressed"), true);
  button.send("pointerup");
  button.send("lostpointercapture");
  button.send("click");
  assert.equal(starts, 1);
  assert.equal(ends.length, 1);
  assert.equal(ends[0].cancelled, false);
  assert.equal(button.classes.has("pressed"), false);
  assert.equal(activations, 0);
});
test("cancellation never reports a successful tap and clears capture", () => {
  const button = new Button();
  let release;
  bindPress(button, { end: (event) => (release = event) });
  button.send("pointerdown");
  button.send("pointercancel");
  assert.equal(release.cancelled, true);
  assert.equal(button.captured.size, 0);
});
test("a second finger cannot release or steal an active button", () => {
  const button = new Button();
  let starts = 0,
    ends = 0;
  bindPress(button, {
    start() {
      starts++;
    },
    end() {
      ends++;
    },
  });
  button.send("pointerdown");
  button.send("pointerdown", { pointerId: 2 });
  button.send("pointerup", { pointerId: 2 });
  assert.equal(ends, 0);
  button.send("pointerup");
  assert.equal(starts, 1);
  assert.equal(ends, 1);
});
test("UI transitions cancel held input idempotently", () => {
  const button = new Button();
  let ends = 0;
  const cancel = bindPress(button, {
    end(event) {
      assert.equal(event.cancelled, true);
      ends++;
    },
  });
  button.send("pointerdown");
  cancel();
  cancel();
  button.send("pointerup");
  assert.equal(ends, 1);
});
test("keyboard activation works without pointer capture", () => {
  const button = new Button();
  let activations = 0;
  bindPress(button, {
    activate() {
      activations++;
    },
  });
  button.send("click", { detail: 0 });
  assert.equal(activations, 1);
});
test("disabled, non-primary buttons and rejected input cannot start a press", () => {
  const button = new Button();
  let starts = 0;
  bindPress(button, {
    start() {
      starts++;
      return false;
    },
  });
  button.disabled = true;
  button.send("pointerdown");
  button.disabled = false;
  button.send("pointerdown", { button: 2 });
  assert.equal(starts, 0);
  button.send("pointerdown");
  assert.equal(starts, 1);
  assert.equal(button.captured.size, 0);
});
