import test from "node:test";
import assert from "node:assert/strict";
import { renderQuality, applyRenderQuality } from "../src/render-quality.js";
const mobile = { width: 390, height: 780, deviceRatio: 3, touchDevice: true };
test("zoom increases phone sharpness and shadow resolution without changing zoom bounds", () => {
  assert.deepEqual(renderQuality({ ...mobile, zoom: 24 }), {
    pixelRatio: 1.25,
    shadowSize: 1024,
  });
  assert.deepEqual(renderQuality({ ...mobile, zoom: 16 }), {
    pixelRatio: 2,
    shadowSize: 2048,
  });
  assert.deepEqual(renderQuality({ ...mobile, zoom: 36 }), {
    pixelRatio: 1.25,
    shadowSize: 1024,
  });
});
test("quality tiers increase monotonically and are reversible", () => {
  let previous = 0;
  for (let zoom = 36; zoom >= 16; zoom -= 0.25) {
    const value = renderQuality({ ...mobile, zoom }).pixelRatio;
    assert.ok(value >= previous);
    previous = value;
  }
  assert.equal(renderQuality({ ...mobile, zoom: 24 }).pixelRatio, 1.25);
});
test("retina desktop detail rises but native resolution is never exceeded", () => {
  assert.equal(
    renderQuality({ ...mobile, touchDevice: false, zoom: 16 }).pixelRatio,
    2.5,
  );
  for (const touchDevice of [true, false]) {
    assert.equal(
      renderQuality({ ...mobile, deviceRatio: 1, touchDevice, zoom: 16 })
        .pixelRatio,
      1,
    );
    assert.equal(
      renderQuality({ ...mobile, deviceRatio: 1.5, touchDevice, zoom: 16 })
        .pixelRatio,
      1.5,
    );
  }
});
test("portrait, landscape and large tablet buffers stay within pixel budgets", () => {
  for (const touchDevice of [true, false])
    for (const [width, height] of [
      [390, 780],
      [844, 338],
      [2560, 1600],
      [3840, 2160],
    ]) {
      const { pixelRatio } = renderQuality({
        ...mobile,
        touchDevice,
        width,
        height,
        zoom: 16,
      });
      assert.ok(
        width * height * pixelRatio ** 2 <= (touchDevice ? 3e6 : 5e6) + 0.01,
      );
    }
});
test("applying unchanged quality does not reallocate framebuffer or shadows", () => {
  const renderer = {
    getPixelRatio: () => 2,
    setPixelRatio() {
      assert.fail("unchanged pixel ratio");
    },
  };
  const map = {
    dispose() {
      assert.fail("unchanged shadow target");
    },
  };
  const light = { shadow: { mapSize: { x: 2048 }, map } };
  applyRenderQuality(renderer, light, { pixelRatio: 2, shadowSize: 2048 });
  assert.equal(light.shadow.map, map);
});
test("quality changes release old shadow resources once for the next render", () => {
  let ratio = 1.25,
    depthDisposals = 0,
    targetDisposals = 0;
  const renderer = {
    getPixelRatio: () => ratio,
    setPixelRatio(value) {
      ratio = value;
    },
  };
  const light = {
    shadow: {
      map: {
        depthTexture: {
          dispose() {
            depthDisposals++;
          },
        },
        dispose() {
          targetDisposals++;
        },
      },
      mapSize: {
        x: 1024,
        set(x, y) {
          this.x = x;
          this.y = y;
        },
      },
    },
  };
  applyRenderQuality(renderer, light, { pixelRatio: 2, shadowSize: 2048 });
  applyRenderQuality(renderer, light, { pixelRatio: 2, shadowSize: 2048 });
  assert.equal(ratio, 2);
  assert.equal(light.shadow.map, null);
  assert.equal(light.shadow.mapSize.y, 2048);
  assert.equal(light.shadow.needsUpdate, true);
  assert.equal(depthDisposals, 1);
  assert.equal(targetDisposals, 1);
});
