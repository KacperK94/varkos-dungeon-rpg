export const SETTINGS_KEY = "ember-island-settings-v1";
export function normalizeSettings(value = {}) {
  const data = value && typeof value === "object" ? value : {};
  const volume = (key, fallback) =>
    typeof data[key] === "number" && Number.isFinite(data[key])
      ? Math.max(0, Math.min(1, data[key]))
      : fallback;
  return {
    controls: data.controls === "arrows" ? "arrows" : "tap",
    graphics: ["auto", "medium", "low"].includes(data.graphics)
      ? data.graphics
      : "auto",
    muted: data.muted === true,
    master: volume("master", 0.65),
    music: volume("music", 0.35),
    ambient: volume("ambient", 0.45),
    effects: volume("effects", 0.7),
  };
}
export function loadSettings(storage) {
  try {
    return normalizeSettings(JSON.parse(storage.getItem(SETTINGS_KEY)));
  } catch {
    return normalizeSettings();
  }
}
export function saveSettings(storage, settings) {
  try {
    storage.setItem(SETTINGS_KEY, JSON.stringify(normalizeSettings(settings)));
    return true;
  } catch {
    return false;
  }
}
export function canTapMove(settings) {
  return settings.controls === "tap";
}
export function mixLevels(settings) {
  const s = normalizeSettings(settings);
  return {
    master: s.muted ? 0 : s.master,
    music: s.music,
    ambient: s.ambient,
    effects: s.effects,
  };
}
