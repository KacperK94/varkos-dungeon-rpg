import { mixLevels } from "./settings.js";

// Original procedural soundscape: no downloads, external recordings or autoplay.
export function createAudio(
  initialSettings,
  createContext = () =>
    new (window.AudioContext || window.webkitAudioContext)(),
) {
  let settings = initialSettings,
    context,
    master,
    channels,
    timer,
    active = false,
    started = false,
    disposed = false,
    beat = 0;
  const sources = new Set();
  function update(next) {
    settings = next;
    if (!context) return;
    const levels = mixLevels(settings);
    master.gain.setTargetAtTime(
      active ? levels.master : 0,
      context.currentTime,
      0.04,
    );
    for (const key of ["music", "ambient", "effects"])
      channels[key].gain.setTargetAtTime(
        levels[key],
        context.currentTime,
        0.04,
      );
  }
  function tone(
    channel,
    frequency,
    duration,
    volume,
    delay = 0,
    type = "sine",
  ) {
    if (!context || context.state !== "running" || !active) return;
    const oscillator = context.createOscillator(),
      gain = context.createGain();
    const time = context.currentTime + delay;
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, time);
    gain.gain.setValueAtTime(0, time);
    gain.gain.linearRampToValueAtTime(volume, time + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + duration);
    oscillator.connect(gain);
    gain.connect(channels[channel]);
    sources.add(oscillator);
    oscillator.onended = () => {
      sources.delete(oscillator);
      oscillator.disconnect();
      gain.disconnect();
    };
    oscillator.start(time);
    oscillator.stop(time + duration + 0.05);
  }
  let weatherKind = "clear",
    weatherBeat = 0;
  function weatherSound() {
    if (!active) return;
    weatherBeat++;
    if (weatherKind === "storm" && weatherBeat % 5 === 0)
      tone("ambient", 45, 1.5, 0.2, 0, "triangle");
    if (weatherKind === "wind" || weatherKind === "storm")
      tone(
        "ambient",
        weatherKind === "wind" ? 100 : 170,
        1,
        0.06,
        0,
        "triangle",
      );
    if (weatherKind === "meteors" && weatherBeat % 3 === 0)
      tone("ambient", 740, 0.65, 0.06);
  }
  function musicBeat() {
    weatherSound();
    if (!active) return;
    const notes = [196, 246.94, 293.66, 369.99, 329.63, 293.66, 246.94, 220];
    tone("music", notes[beat++ % notes.length], 1.8, 0.09);
  }
  function ambientLoop() {
    const buffer = context.createBuffer(
      1,
      context.sampleRate * 4,
      context.sampleRate,
    );
    const data = buffer.getChannelData(0);
    let last = 0;
    for (let i = 0; i < data.length; i++) {
      last = (last + (Math.random() * 2 - 1) * 0.03) / 1.03;
      data[i] = last * 2;
    }
    const source = context.createBufferSource(),
      filter = context.createBiquadFilter(),
      gain = context.createGain();
    source.buffer = buffer;
    source.loop = true;
    filter.type = "lowpass";
    filter.frequency.value = 650;
    gain.gain.value = 0.45;
    source.connect(filter);
    filter.connect(gain);
    gain.connect(channels.ambient);
    source.start();
    sources.add(source);
  }
  async function unlock() {
    if (disposed) return false;
    try {
      if (!context) {
        context = createContext();
        master = context.createGain();
        master.gain.value = 0;
        master.connect(context.destination);
        channels = Object.fromEntries(
          ["music", "ambient", "effects"].map((key) => {
            const gain = context.createGain();
            gain.connect(master);
            return [key, gain];
          }),
        );
      }
      await context.resume();
      if (!started && !disposed) {
        started = true;
        ambientLoop();
        timer = setInterval(musicBeat, 1100);
        musicBeat();
      }
      update(settings);
      return context.state === "running";
    } catch {
      return false;
    }
  }
  return {
    unlock,
    setWeather(kind) {
      weatherKind = kind;
    },
    update,
    setActive(value) {
      if (active === value) return;
      active = value;
      update(settings);
      if (!value && context) void context.suspend().catch(() => {});
      // Resume is attempted only by an explicit user gesture through unlock().
    },
    effect(kind) {
      if (kind === "craft" || kind === "win")
        [261.63, 329.63, 392, ...(kind === "win" ? [523.25] : [])].forEach(
          (note, i) => tone("effects", note, 0.5, 0.17, i * 0.11),
        );
      else if (kind === "stone")
        tone("effects", 510, 0.09, 0.18, 0, "triangle");
      else if (kind === "crystal") tone("effects", 1046.5, 0.5, 0.14);
      else if (kind === "fiber")
        tone("effects", 650, 0.14, 0.06, 0, "triangle");
      else tone("effects", 155, 0.12, 0.22, 0, "triangle");
    },
    async dispose() {
      disposed = true;
      clearInterval(timer);
      sources.forEach((source) => {
        try {
          source.stop();
          source.disconnect();
        } catch {
          /* Already stopped. */
        }
      });
      sources.clear();
      if (context && context.state !== "closed") await context.close();
    },
  };
}
