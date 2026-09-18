// Original 16-bar tea-house jazz, synthesized locally with Web Audio.
// 92 BPM, lightly swung eighths, pentatonic melody over extended jazz chords.
export const SCORE = [
  { chord:[60,64,67,71,74], bass:36, melody:[76,null,79,81,null,79,76,null] },
  { chord:[57,60,64,67,71], bass:33, melody:[74,null,72,null,76,74,72,null] },
  { chord:[53,57,60,64,67], bass:38, melody:[69,null,72,74,null,76,74,null] },
  { chord:[55,59,64,65,69], bass:43, melody:[71,null,74,null,72,null,null,null] },
  { chord:[60,64,67,71,74], bass:36, melody:[76,null,79,84,null,81,79,null] },
  { chord:[57,60,64,67,71], bass:33, melody:[76,null,74,null,72,69,null,null] },
  { chord:[53,57,60,64,67], bass:38, melody:[72,null,74,76,null,74,69,null] },
  { chord:[55,59,64,65,69], bass:43, melody:[71,null,74,null,79,null,null,null] },
  { chord:[53,57,60,64,67], bass:41, melody:[81,null,79,null,76,74,72,null] },
  { chord:[55,59,64,65,69], bass:43, melody:[74,null,76,79,null,74,null,null] },
  { chord:[55,59,62,66,69], bass:40, melody:[79,null,76,null,74,71,null,null] },
  { chord:[55,58,61,64,69], bass:45, melody:[76,null,73,76,null,79,null,null] },
  { chord:[53,57,60,64,67], bass:38, melody:[77,null,76,74,null,72,69,null] },
  { chord:[55,59,64,65,69], bass:43, melody:[71,null,74,79,null,76,74,null] },
  { chord:[55,60,64,69,74], bass:36, melody:[72,null,76,79,null,76,72,null] },
  { chord:[55,59,64,65,69], bass:43, melody:[74,null,71,null,67,null,null,null] }
];
const hz = midi => 440 * 2 ** ((midi - 69) / 12);

// Stage 2: Ageha. Miyako-bushi on D (D Eb G A Bb) — languid, slightly seductive wa-style.
export const AGEHA_SCORE = [
  { chord:[50,57,62,65], bass:38, melody:[69,null,70,null,74,null,77,null] },
  { chord:[51,58,62,65], bass:39, melody:[70,null,69,null,65,null,null,null] },
  { chord:[55,58,62,67], bass:43, melody:[74,null,75,77,null,75,74,null] },
  { chord:[57,62,65,69], bass:45, melody:[77,null,74,null,70,null,null,null] },
  { chord:[46,53,58,62], bass:34, melody:[82,null,77,null,75,74,70,null] },
  { chord:[50,57,62,69], bass:38, melody:[74,null,69,null,70,65,null,null] },
  { chord:[51,55,58,63], bass:39, melody:[75,null,74,70,null,69,65,null] },
  { chord:[50,57,62,65], bass:38, melody:[69,null,62,null,65,null,null,null] }
];

// Stage 3: Gonzo. Heavy In-sen scale on F# (F# G B C# E) with driving shamisen rock and taiko pulse.
export const GONZO_SCORE = [
  { chord:[54,61,66], bass:42, melody:[66,null,67,66,null,64,61,null] },
  { chord:[55,62,67], bass:43, melody:[67,null,66,null,62,null,61,null] },
  { chord:[57,64,69], bass:45, melody:[69,66,null,64,null,66,61,null] },
  { chord:[52,59,64], bass:40, melody:[64,null,66,null,61,null,null,null] },
  { chord:[54,61,66], bass:42, melody:[73,null,71,69,null,66,64,null] },
  { chord:[50,57,62], bass:38, melody:[66,null,62,null,59,null,61,null] },
  { chord:[49,56,61], bass:37, melody:[67,66,null,64,null,61,59,null] },
  { chord:[54,60,66], bass:42, melody:[66,null,54,null,61,null,null,null] }
];

// Stage 4: George. Diminished/whole-tone jumps — eerie, high BPM ostinato.
export const GEORGE_SCORE = [
  { chord:[60,63,66,69], bass:36, melody:[72,75,72,66,78,75,72,null] },
  { chord:[61,64,67,70], bass:37, melody:[73,76,73,null,70,67,64,null] },
  { chord:[63,66,69,72], bass:39, melody:[75,72,78,75,72,66,63,null] },
  { chord:[59,62,65,68], bass:35, melody:[71,null,68,65,62,65,59,null] },
  { chord:[60,66,70,73], bass:36, melody:[82,78,75,72,78,75,72,66] },
  { chord:[58,61,64,67], bass:34, melody:[70,73,70,null,76,73,67,null] },
  { chord:[60,63,66,72], bass:36, melody:[72,75,78,81,78,75,72,null] },
  { chord:[61,63,66,69], bass:37, melody:[75,null,73,66,63,66,61,null] }
];

export const STAGE_MUSIC = [
  { name:'暖簾の向こう', score:SCORE, style:'jazz', bpm:92, swing:0.56, darkness:0, delay:0.135, wet:0.16 },
  { name:'揚げ羽の宵', score:AGEHA_SCORE, style:'koto', bpm:82, swing:0.62, darkness:1, delay:0.22, wet:0.23 },
  { name:'権蔵の仁義', score:GONZO_SCORE, style:'brute', bpm:96, swing:0.5, darkness:1, delay:0.11, wet:0.14 },
  { name:'跳ねる残像', score:GEORGE_SCORE, style:'chase', bpm:152, swing:0.5, darkness:1, delay:0.08, wet:0.18 }
];

export function musicForStage(stage) {
  const next = Number.isFinite(stage) ? Math.max(1, Math.floor(stage)) : 1;
  return STAGE_MUSIC[next >= 5 ? 0 : Math.min(3, next - 1)];
}

export class SoundSystem {
  constructor() {
    this.ctx = null;
    this.isMuted = false;
    this.bgmWanted = false;
    this.bgmInterval = null;
    this.bgmBus = null;
    this.step = 0;
    this.stage = 1;
    this.music = STAGE_MUSIC[0];
    this.setupUnlockListener();
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) this.pauseBGM();
      else if (this.bgmWanted && !this.isMuted) this.startBGM();
    });
  }

  setupUnlockListener() {
    const unlock = () => {
      if (this.init() && this.bgmWanted && !this.isMuted && !document.hidden) this.startBGM();
      if (this.ctx?.state === 'running') {
        ['pointerdown','touchstart','keydown'].forEach(type => window.removeEventListener(type, unlock));
      }
    };
    ['pointerdown','touchstart','keydown'].forEach(type => window.addEventListener(type, unlock, {passive:true}));
  }

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return false;
      this.ctx = new AudioCtx();
      this.master = this.ctx.createGain();
      this.master.gain.value = this.isMuted ? 0 : 0.72;
      const compressor = this.ctx.createDynamicsCompressor();
      compressor.threshold.value = -16;
      compressor.knee.value = 16;
      compressor.ratio.value = 4;
      compressor.attack.value = 0.006;
      compressor.release.value = 0.18;
      this.master.connect(compressor);
      compressor.connect(this.ctx.destination);
      this.sfx = this.ctx.createGain();
      this.sfx.gain.value = 0.7;
      this.sfx.connect(this.master);
      this.noiseBuffer = this.ctx.createBuffer(1, this.ctx.sampleRate, this.ctx.sampleRate);
      const data = this.noiseBuffer.getChannelData(0);
      // Reusable deterministic noise avoids allocating a buffer for every splash.
      let seed = 813;
      for (let i = 0; i < data.length; i++) {
        seed = (1664525 * seed + 1013904223) >>> 0;
        data[i] = seed / 2147483648 - 1;
      }
    }
    if (this.ctx.state === 'suspended') this.ctx.resume().catch(() => {});
    return true;
  }

  tone(freq, time, duration, volume, bus, type = 'sine', endFreq = freq) {
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, time);
    osc.frequency.exponentialRampToValueAtTime(Math.max(20, endFreq), time + duration);
    gain.gain.setValueAtTime(0, time);
    gain.gain.linearRampToValueAtTime(volume, time + 0.006);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + duration);
    osc.connect(gain);
    gain.connect(bus);
    osc.onended = () => { osc.disconnect(); gain.disconnect(); };
    osc.start(time);
    osc.stop(time + duration + 0.02);
  }

  noise(time, duration, volume, freq, bus, endFreq = freq, type = 'bandpass') {
    const source = this.ctx.createBufferSource();
    source.buffer = this.noiseBuffer;
    const filter = this.ctx.createBiquadFilter();
    filter.type = type;
    filter.Q.value = 0.7;
    filter.frequency.setValueAtTime(freq, time);
    filter.frequency.exponentialRampToValueAtTime(endFreq, time + duration);
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0, time);
    gain.gain.linearRampToValueAtTime(volume, time + Math.min(0.03, duration / 4));
    gain.gain.exponentialRampToValueAtTime(0.0001, time + duration);
    source.connect(filter);
    filter.connect(gain);
    gain.connect(bus);
    source.onended = () => { source.disconnect(); filter.disconnect(); gain.disconnect(); };
    source.start(time);
    source.stop(time + duration + 0.02);
  }

  // Soft tine piano: fundamental, octave, and a quiet bell-like upper partial.
  piano(note, time, duration, volume, bus) {
    const f = hz(note);
    this.tone(f, time, duration, volume, bus);
    this.tone(f * 2.002, time, duration * 0.5, volume * 0.22, bus);
    this.tone(f * 3, time, duration * 0.22, volume * 0.055, bus);
  }

  bell(freq, time, volume, duration = 0.42) {
    [1, 2.71, 4.09].forEach((ratio, i) =>
      this.tone(freq * ratio, time, duration / (1 + i), volume / (1 + i * 4), this.sfx));
  }

  effect(play) {
    if (this.isMuted || !this.init()) return;
    play(this.ctx.currentTime + 0.008);
  }

  // Ceramic bowl touching the wooden counter.
  playTopping() { this.effect(t => {
    this.tone(390, t, 0.075, 0.11, this.sfx, 'sine', 270);
    this.bell(1180, t + 0.005, 0.028, 0.14);
    this.noise(t, 0.035, 0.035, 1200, this.sfx);
  }); }

  playCoin() { this.effect(t => {
    [0,0.075,0.14].forEach((offset,i) => this.bell(1750 + i * 210, t + offset, 0.055 - i * 0.012, 0.3));
  }); }

  // A flowing ladle of broth, with small rising water bubbles.
  playPour() { this.effect(t => {
    this.noise(t, 0.48, 0.2, 700, this.sfx, 1850);
    [0.05,0.14,0.23,0.32].forEach((offset,i) =>
      this.tone(320 + i * 55, t + offset, 0.09, 0.027, this.sfx, 'sine', 480 + i * 70));
  }); }

  playNoodleBoil() { this.effect(t => {
    this.noise(t, 0.5, 0.15, 430, this.sfx, 1000, 'lowpass');
    [0,0.1,0.23,0.35].forEach((offset,i) =>
      this.tone(125 + i * 22, t + offset, 0.085, 0.04, this.sfx, 'sine', 240 + i * 20));
  }); }

  playDrain() { this.effect(t => {
    [0,0.14].forEach(offset => {
      this.noise(t + offset, 0.13, 0.23, 2300, this.sfx, 600);
      this.bell(920, t + offset, 0.023, 0.1);
    });
  }); }

  // Brief wooden clapper feedback for catching a fleeing customer.
  playCatch() { this.effect(t => {
    this.tone(820, t, 0.055, 0.07, this.sfx, 'sine', 510);
    this.noise(t, 0.035, 0.085, 1600, this.sfx);
  }); }

  playServeSuccess() { this.effect(t => {
    this.bell(1260, t, 0.035, 0.18);
    [72,76,79,81].forEach((n,i) => this.piano(n,t + i * 0.075,0.45,0.07,this.sfx));
  }); }

  playChiliSpicy() { this.effect(t => {
    this.noise(t, 0.42, 0.24, 600, this.sfx, 3300);
    this.tone(135, t, 0.35, 0.16, this.sfx, 'sine', 52);
    this.tone(660, t + 0.05, 0.23, 0.055, this.sfx, 'triangle', 1320);
  }); }

  playFanfare() { this.effect(t => {
    [67,72,76,79,81,84].forEach((n,i) => this.piano(n,t + i * 0.13,0.8,0.085,this.sfx));
    [48,55,60,64,69,74].forEach((n,i) => this.piano(n,t + 0.78 + i * 0.014,1.45,0.045,this.sfx));
  }); }

  playGinjiAlert() { this.effect(t => {
    // Shop entrance wind chime, followed by a restrained suspense chord.
    this.bell(1320,t,0.055,0.85);
    this.bell(1760,t + 0.12,0.035,0.7);
    [57,64,70].forEach(n => this.piano(n,t + 0.16,0.7,0.05,this.sfx));
  }); }

  playGinjiDefeat() { this.effect(t => {
    [76,74,69,64].forEach((n,i) => this.piano(n,t + i * 0.09,0.22,0.075,this.sfx));
    this.tone(190,t + 0.32,0.18,0.08,this.sfx,'sine',90);
  }); }

  playTrash() { this.effect(t => {
    this.noise(t,0.2,0.15,1000,this.sfx,280);
    this.tone(180,t + 0.1,0.09,0.07,this.sfx,'sine',95);
  }); }

  playAngry() { this.effect(t => {
    [64,61,57].forEach((n,i) => this.piano(n,t + i * 0.1,0.3,0.075,this.sfx));
  }); }

  playNekoMeow() { this.effect(t => {
    this.tone(580, t, 0.18, 0.16, this.sfx, 'triangle', 860);
    this.tone(860, t + 0.16, 0.28, 0.15, this.sfx, 'triangle', 510);
    this.tone(1160, t + 0.02, 0.15, 0.04, this.sfx, 'sine', 1720);
    this.tone(1720, t + 0.17, 0.22, 0.035, this.sfx, 'sine', 1020);
    this.noise(t + 0.08, 0.12, 0.02, 1800, this.sfx, 900);
  }); }

  barAt(step) {
    const score = this.music.score;
    return score[Math.floor(step / 8) % score.length];
  }

  scheduleJazz(step, time) {
    const { bpm } = this.music;
    const bar = this.barAt(step);
    const slot = step % 8;
    const beat = 60 / bpm;
    const bus = this.bgmBus;
    if ([0,3,6].includes(slot)) bar.chord.forEach((n,i) =>
      this.piano(n,time + i * 0.012,beat * 1.25,(slot === 0 ? 0.034 : 0.025),bus));
    if (slot === 0 || slot === 4 || slot === 7) {
      const n = bar.bass + (slot === 4 ? 7 : slot === 7 ? 11 : 0);
      this.tone(hz(n),time,beat * 0.82,0.12,bus);
      this.tone(hz(n)*2,time,0.11,0.024,bus,'triangle');
    }
    const note = bar.melody[slot];
    if (note !== null) {
      this.piano(note,time,beat * 1.45,0.068,bus);
      if (slot === 0) this.tone(hz(note)*2,time,0.18,0.011,bus,'triangle');
    }
    if (slot % 2 === 1) this.noise(time,0.16,slot === 3 || slot === 7 ? 0.04 : 0.022,3800,bus,2400,'highpass');
    if (slot === 2 || slot === 6) {
      this.noise(time,0.11,0.045,1500,bus,900);
      this.tone(730,time,0.04,0.014,bus,'sine',490);
    }
  }

  scheduleKoto(step, time) {
    const { bpm } = this.music;
    const bar = this.barAt(step);
    const slot = step % 8;
    const beat = 60 / bpm;
    const bus = this.bgmBus;
    if (slot === 0) bar.chord.forEach((n,i) => {
      const f = hz(n);
      this.tone(f,time + i * 0.05,beat * 2.1,0.03,bus,'triangle');
      this.tone(f * 2.01,time + i * 0.05,0.28,0.012,bus,'sine');
    });
    if (slot === 0 || slot === 4) {
      this.tone(hz(bar.bass),time,beat * 1.7,0.11,bus);
      this.noise(time,0.22,0.032,160,bus,70,'lowpass');
    }
    const note = bar.melody[slot];
    if (note !== null) {
      const f = hz(note);
      this.tone(f * 0.97,time,beat * 1.35,0.072,bus,'triangle',f);
      this.tone(f * 2,time,0.2,0.02,bus,'sine');
      this.tone(f * 3.02,time,0.1,0.008,bus,'sine');
    }
    if (slot === 2 || slot === 6) this.noise(time,0.08,0.026,2400,bus,1500,'highpass');
  }

  scheduleBrute(step, time) {
    const { bpm } = this.music;
    const bar = this.barAt(step);
    const slot = step % 8;
    const beat = 60 / bpm;
    const bus = this.bgmBus;

    // Driving rock/taiko beat: heavy kick on 0 and 4, hyoshigi clapper on 2 and 6
    if (slot === 0 || slot === 4) {
      this.tone(140, time, 0.22, 0.16, bus, 'sine', 48);
      this.noise(time, 0.06, 0.08, 400, bus, 100, 'lowpass');
    }
    if (slot === 2 || slot === 6) {
      this.tone(1150, time, 0.045, 0.075, bus, 'triangle', 720);
      this.noise(time, 0.05, 0.055, 2200, bus, 1200);
    }
    if (slot % 2 === 1) {
      this.noise(time, 0.05, 0.025, 4200, bus, 2800, 'highpass');
    }

    // Heavy bass line (sawtooth + sine punch)
    if (slot % 2 === 0) {
      const n = bar.bass + (slot === 2 || slot === 6 ? 7 : 0);
      const f = hz(n);
      this.tone(f, time, beat * 0.88, 0.14, bus, 'sawtooth');
      this.tone(f, time, beat * 0.92, 0.16, bus, 'sine');
      this.tone(f * 2, time, 0.12, 0.045, bus, 'triangle');
    }

    // Heavy power chords on 0 and 3
    if (slot === 0 || slot === 3) {
      bar.chord.forEach((n, i) => {
        const f = hz(n);
        this.tone(f, time + i * 0.012, beat * 1.25, 0.038, bus, 'sawtooth');
        this.tone(f, time + i * 0.012, beat * 1.1, 0.032, bus, 'triangle');
      });
    }

    // Shamisen / rock lead melody
    const note = bar.melody[slot];
    if (note !== null) {
      const f = hz(note);
      this.tone(f, time, beat * 0.72, 0.085, bus, 'sawtooth');
      this.tone(f * 2, time, beat * 0.45, 0.032, bus, 'triangle');
      this.tone(f * 0.5, time, beat * 0.6, 0.028, bus, 'sine');
    }
  }

  scheduleChase(step, time) {
    const { bpm } = this.music;
    const bar = this.barAt(step);
    const slot = step % 8;
    const beat = 60 / bpm;
    const bus = this.bgmBus;
    this.noise(time,0.05,slot % 2 === 0 ? 0.03 : 0.018,4200,bus,2600,'highpass');
    if (slot === 0 || slot === 4) bar.chord.forEach((n,i) =>
      this.tone(hz(n),time + i * 0.008,beat * 0.55,0.028,bus,'triangle'));
    if (slot === 0 || slot === 2 || slot === 4 || slot === 6) {
      const n = bar.bass + (slot === 2 || slot === 6 ? 6 : 0);
      this.tone(hz(n),time,beat * 0.42,0.13,bus);
      this.tone(hz(n) * 2.01,time,0.08,0.02,bus,'triangle');
    }
    const note = bar.melody[slot];
    if (note !== null) {
      this.tone(hz(note),time,beat * 0.45,0.06,bus,'triangle');
      this.tone(hz(note) * 2.007,time + 0.015,0.35,0.012,bus);
      this.tone(hz(note) * 3.05,time,0.18,0.007,bus);
    }
    if (slot === 3 || slot === 7) this.noise(time,0.07,0.04,1800,bus,900);
  }

  scheduleStep(step, time) {
    const style = this.music.style || 'jazz';
    if (style === 'koto') this.scheduleKoto(step, time);
    else if (style === 'brute') this.scheduleBrute(step, time);
    else if (style === 'chase') this.scheduleChase(step, time);
    else this.scheduleJazz(step, time);
  }

  startBGM(stage = this.stage) {
    const nextStage = Number.isFinite(stage) ? Math.max(1,Math.floor(stage)) : 1;
    const nextMusic = musicForStage(nextStage);
    if (nextStage !== this.stage || nextMusic !== this.music) {
      this.pauseBGM();
      this.step = 0;
      this.stage = nextStage;
      this.music = nextMusic;
    }
    this.bgmWanted = true;
    if (this.bgmInterval !== null || this.isMuted || document.hidden || !this.init()) return;
    const now = this.ctx.currentTime;
    this.bgmBus = this.ctx.createGain();
    this.bgmBus.gain.setValueAtTime(0,now);
    this.bgmBus.gain.linearRampToValueAtTime(0.65,now + 0.4);
    // Small, dark room reflection (no feedback loop or endless tail).
    const delay = this.ctx.createDelay(0.5);
    delay.delayTime.value = this.music.delay;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass'; filter.frequency.value = 2100 - this.music.darkness * 200;
    const wet = this.ctx.createGain(); wet.gain.value = this.music.wet;
    this.bgmBus.connect(this.master);
    this.bgmBus.connect(delay); delay.connect(filter); filter.connect(wet); wet.connect(this.master);
    this.roomNodes = [delay,filter,wet];
    this.nextNoteTime = now + 0.04;
    const schedule = () => {
      if (this.ctx.state !== 'running') return;
      // Skip missed wall time after interruption instead of playing a burst.
      if (this.nextNoteTime < this.ctx.currentTime) this.nextNoteTime = this.ctx.currentTime + 0.02;
      while (this.nextNoteTime < this.ctx.currentTime + 0.12) {
        this.scheduleStep(this.step,this.nextNoteTime);
        this.nextNoteTime += (60 / this.music.bpm) *
          (this.step % 2 === 0 ? this.music.swing : 1 - this.music.swing);
        this.step = (this.step + 1) % (this.music.score.length * 8);
      }
    };
    this.bgmInterval = setInterval(schedule,25);
    schedule();
  }

  pauseBGM() {
    if (this.bgmInterval !== null) clearInterval(this.bgmInterval);
    this.bgmInterval = null;
    if (!this.bgmBus) return;
    const bus = this.bgmBus;
    const nodes = this.roomNodes;
    const now = this.ctx.currentTime;
    bus.gain.cancelScheduledValues(now);
    bus.gain.setValueAtTime(bus.gain.value,now);
    bus.gain.linearRampToValueAtTime(0,now + 0.08);
    setTimeout(() => { bus.disconnect(); nodes.forEach(node => node.disconnect()); },300);
    this.bgmBus = null;
  }

  stopBGM() {
    this.bgmWanted = false;
    this.pauseBGM();
    this.step = 0;
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    if (this.init()) {
      const now = this.ctx.currentTime;
      this.master.gain.cancelScheduledValues(now);
      this.master.gain.setValueAtTime(this.master.gain.value,now);
      this.master.gain.linearRampToValueAtTime(this.isMuted ? 0 : 0.72,now + 0.025);
    }
    if (this.isMuted) this.pauseBGM();
    else if (this.bgmWanted) this.startBGM();
    return this.isMuted;
  }
}

export const sound = new SoundSystem();
