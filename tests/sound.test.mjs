import assert from 'node:assert/strict';
import { test } from 'node:test';

const intervals = new Map();
const visibility = new Map();
let nextTimer = 0;
globalThis.setInterval = fn => { intervals.set(++nextTimer, fn); return nextTimer; };
globalThis.clearInterval = id => intervals.delete(id);
globalThis.setTimeout = fn => { fn(); return 1; };
class Param {
  constructor() { this.value = 0; }
  setValueAtTime(value, time) { assert.ok(Number.isFinite(value) && time >= 0); this.value = value; }
  linearRampToValueAtTime(value, time) { this.setValueAtTime(value,time); }
  exponentialRampToValueAtTime(value, time) { assert.ok(value > 0); this.setValueAtTime(value,time); }
  cancelScheduledValues() {}
}
class AudioNode {
  constructor(ctx) {
    this.ctx = ctx;
    for (const key of ['gain','frequency','Q','threshold','knee','ratio','attack','release','delayTime']) this[key] = new Param();
  }
  connect(target) { assert.ok(target); }
  disconnect() {}
  start(time) { assert.ok(time >= this.ctx.currentTime); this.started = time; this.ctx.voices++; }
  stop(time) { assert.ok(time > this.started); this.onended?.(); }
}
class Context {
  constructor() { this.currentTime=0; this.sampleRate=8000; this.state='running'; this.voices=0; this.destination={}; }
  createGain() { return new AudioNode(this); }
  createOscillator() { return new AudioNode(this); }
  createBufferSource() { return new AudioNode(this); }
  createBiquadFilter() { return new AudioNode(this); }
  createDelay() { return new AudioNode(this); }
  createDynamicsCompressor() { return new AudioNode(this); }
  createBuffer(channels, length) { const data=new Float32Array(length); return {getChannelData:()=>data}; }
  resume() { return Promise.resolve(); }
}
globalThis.window = {AudioContext:Context,addEventListener(){},removeEventListener(){}};
globalThis.document = {hidden:false,addEventListener:(name,callback)=>visibility.set(name,callback)};
const {SoundSystem,SCORE} = await import('../src/game/Sound.js');

test('16 bars and every effect schedule valid, bounded audio envelopes',()=>{
  assert.equal(SCORE.length,16);
  const s=new SoundSystem(); s.init(); s.bgmBus=s.ctx.createGain();
  for(let i=0;i<128;i++) s.scheduleStep(i,i*0.4);
  for(const name of ['playCoin','playPour','playNoodleBoil','playDrain','playCatch','playTopping','playServeSuccess','playChiliSpicy','playFanfare','playGinjiDefeat','playGinjiAlert','playTrash','playAngry','playNekoMeow']) s[name]();
  assert.ok(s.ctx.voices>500);
});
test('mute silences effects and resumes only an active game; start is idempotent',()=>{
  intervals.clear(); const s=new SoundSystem();
  s.toggleMute(); s.toggleMute(); assert.equal(intervals.size,0);
  s.startBGM(); s.startBGM(); assert.equal(intervals.size,1);
  s.toggleMute(); assert.equal(intervals.size,0);
  const count=s.ctx.voices; s.playCoin(); assert.equal(s.ctx.voices,count);
  s.toggleMute(); assert.equal(intervals.size,1);
  s.stopBGM(); assert.equal(intervals.size,0);
  s.toggleMute(); s.toggleMute(); assert.equal(intervals.size,0);
});
test('backgrounding pauses, foreground resumes, ended game stays silent',()=>{
  intervals.clear();const s=new SoundSystem();s.startBGM();
  document.hidden=true;visibility.get('visibilitychange')();assert.equal(intervals.size,0);
  document.hidden=false;visibility.get('visibilitychange')();assert.equal(intervals.size,1);
  s.stopBGM();visibility.get('visibilitychange')();assert.equal(intervals.size,0);
});
test('clock interruption does not schedule a backlog of notes',()=>{
  intervals.clear();const s=new SoundSystem();s.startBGM();
  const count=s.ctx.voices;s.ctx.currentTime=60;intervals.get(s.bgmInterval)();
  assert.ok(s.ctx.voices-count<40);assert.ok(s.nextNoteTime>60);s.stopBGM();
});

test('stages 2-4 have original scores; endless reuses stage 1', async()=>{
  const {STAGE_MUSIC,musicForStage,SCORE,AGEHA_SCORE,GONZO_SCORE,GEORGE_SCORE}=await import('../src/game/Sound.js');
  assert.equal(STAGE_MUSIC.length,4);
  assert.equal(new Set(STAGE_MUSIC.map(m=>JSON.stringify(m.score))).size,4);
  assert.equal(musicForStage(1).score,SCORE);
  assert.equal(musicForStage(2).score,AGEHA_SCORE);
  assert.equal(musicForStage(3).score,GONZO_SCORE);
  assert.equal(musicForStage(4).score,GEORGE_SCORE);
  assert.equal(musicForStage(5),STAGE_MUSIC[0]);
  assert.equal(musicForStage(2).bpm,82);
  assert.equal(musicForStage(3).style,'brute');
  assert.ok(musicForStage(4).bpm>=140);
  const s=new SoundSystem();
  for(let stage=1;stage<=5;stage++) {
    s.startBGM(stage);
    for(let i=0;i<128;i++) s.scheduleStep(i,1+i*0.4);
    assert.equal(s.stage,stage);
    assert.equal(s.music,musicForStage(stage));
    s.stopBGM();
  }
});
test('stage changes replace the old loop and survive mute and tab suspension',()=>{
  intervals.clear();const s=new SoundSystem();s.startBGM(1);
  const oldBus=s.bgmBus;s.startBGM(4);
  assert.notEqual(s.bgmBus,oldBus);assert.equal(intervals.size,1);
  assert.equal(s.step,1);
  s.toggleMute();s.startBGM(5);assert.equal(intervals.size,0);
  s.toggleMute();assert.equal(s.stage,5);assert.equal(s.music.name,'暖簾の向こう');assert.equal(intervals.size,1);
  document.hidden=true;visibility.get('visibilitychange')();
  document.hidden=false;visibility.get('visibilitychange')();
  assert.equal(s.stage,5);assert.equal(intervals.size,1);
  s.stopBGM();s.startBGM(1);assert.equal(s.stage,1);s.stopBGM();
});
test('saved stages and stage progression reach the audio system through session start', async()=>{
  const {SobaGame}=await import('../src/game/Game.js');
  const {sound,musicForStage}=await import('../src/game/Sound.js');
  const game=new SobaGame({onGameStateChange(){}});
  game.spawnCustomer=()=>{};
  for (const stage of [1,2,3,4,5]) {
    game.stage=stage;game._startSession();assert.equal(sound.stage,stage);
    assert.equal(sound.music,musicForStage(stage));
    game.isPlaying=false;sound.stopBGM();intervals.clear();
  }
});
