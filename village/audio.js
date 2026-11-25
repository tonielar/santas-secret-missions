// A quiet original celesta waltz, synthesized locally after an explicit tap.
export function createAudio(onChange) {
  let ctx,
    master,
    timer,
    enabled = false,
    beat = 0;
  const tune = [76, 0, 79, 74, 0, 71, 72, 76, 79, 0, 76, 0, 74, 0, 77, 71, 74, 0, 72, 0, 67, 0, 0, 0];
  function note(midi, start, length, gain, type = 'sine') {
    const oscillator = ctx.createOscillator(),
      envelope = ctx.createGain();
    oscillator.type = type;
    oscillator.frequency.value = 440 * 2 ** ((midi - 69) / 12);
    envelope.gain.setValueAtTime(0.0001, start);
    envelope.gain.exponentialRampToValueAtTime(gain, start + 0.018);
    envelope.gain.exponentialRampToValueAtTime(0.0001, start + length);
    oscillator.connect(envelope);
    envelope.connect(master);
    oscillator.start(start);
    oscillator.stop(start + length + 0.03);
    oscillator.onended = () => {
      oscillator.disconnect();
      envelope.disconnect();
    };
  }
  function tick() {
    if (!enabled || document.hidden) return;
    const n = tune[beat % tune.length],
      at = ctx.currentTime + 0.02;
    if (n) {
      note(n, at, 1.1, 0.12);
      note(n + 12, at, 0.32, 0.018);
    }
    if (beat % 3 === 0)
      note([48, 43, 45, 43, 50, 43, 48, 43][Math.floor(beat / 3) % 8], at, 1.5, 0.075, 'triangle');
    beat++;
  }
  async function toggle() {
    enabled = !enabled;
    onChange(enabled);
    clearInterval(timer);
    if (!enabled) {
      if (ctx) await ctx.suspend().catch(() => {});
      return;
    }
    try {
      if (!ctx) {
        ctx = new (window.AudioContext || window.webkitAudioContext)();
        master = ctx.createGain();
        master.gain.value = 0.46;
        master.connect(ctx.destination);
      }
      await ctx.resume();
      if (!enabled) return;
      tick();
      timer = setInterval(tick, 445);
    } catch {
      enabled = false;
      onChange(false);
    }
  }
  function effect(kind) {
    if (!enabled || !ctx) return;
    (kind === 'locked' ? [55, 53] : kind === 'celebrate' ? [72, 76, 79, 84] : [76, 83]).forEach((n, i) =>
      note(n, ctx.currentTime + 0.1 * i, 0.52, 0.17),
    );
  }
  return { toggle, effect };
}
