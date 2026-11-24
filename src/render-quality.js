import { clampZoom } from "./camera-gestures.js";

export function renderQuality({
  zoom,
  width,
  height,
  deviceRatio,
  touchDevice,
  graphics = "auto",
  maxDimension = 8192,
}) {
  if (graphics === "fullhd" || graphics === "4k") {
    const target = graphics === "4k" ? 3840 : 1920;
    const ratio = Math.min(target, maxDimension) / Math.max(1, width, height);
    return { pixelRatio: ratio, shadowSize: 2048 };
  }
  if (graphics === "low" || graphics === "medium") {
    const budget = graphics === "low" ? 1_000_000 : 2_000_000;
    return {
      pixelRatio: Math.min(
        deviceRatio,
        graphics === "low" ? 1 : 1.25,
        Math.sqrt(budget / Math.max(1, width * height)),
      ),
      shadowSize: 1024,
    };
  }
  const close = Math.max(0, Math.min(1, (24 - clampZoom(zoom)) / 8));
  // Four discrete tiers avoid reallocating the framebuffer on every pinch move.
  const tier = Math.floor(close * 3 + 1e-6);
  const base = touchDevice ? 1.25 : 1.75;
  const target = base + tier * 0.25;
  const pixelBudget = touchDevice ? 3_000_000 : 5_000_000;
  const budgetRatio = Math.sqrt(pixelBudget / Math.max(1, width * height));
  return {
    pixelRatio: Math.min(deviceRatio, target, budgetRatio),
    shadowSize: touchDevice && close < 0.5 ? 1024 : 2048,
  };
}

export function applyRenderQuality(renderer, light, quality) {
  if (Math.abs(renderer.getPixelRatio() - quality.pixelRatio) > 0.001) {
    renderer.setPixelRatio(quality.pixelRatio);
  }
  if (light.shadow.mapSize.x !== quality.shadowSize) {
    // Three.js does not resize an existing shadow target from mapSize alone.
    light.shadow.map?.depthTexture?.dispose();
    light.shadow.map?.dispose();
    light.shadow.map = null;
    light.shadow.mapSize.set(quality.shadowSize, quality.shadowSize);
    light.shadow.needsUpdate = true;
  }
}
