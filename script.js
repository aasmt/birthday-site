// Main website behavior. Search for PHASE names to find each celebration step.
// =========================================================
//  UTILS
// =========================================================
const $ = id => document.getElementById(id);
const rand = (a, b) => Math.random() * (b - a) + a;
const randInt = (a, b) => Math.floor(rand(a, b));
const phaseStorageKey = 'birthday-current-phase';
const heartStorageKey = 'birthday-heart-unlocked';
const audioEnabledStorageKey = 'birthday-audio-enabled';
const activeAudioStorageKey = 'birthday-active-audio';
const restorablePhases = ['landing', 'decorate-phase', 'music-phase', 'cake-phase', 'balloon-phase', 'msg-phase', 'end-phase'];

function saveLocal(key, value) {
  try { localStorage.setItem(key, value); } catch {}
}

function readLocal(key) {
  try { return localStorage.getItem(key); } catch { return null; }
}

function clearSavedProgress() {
  try {
    [
      phaseStorageKey,
      heartStorageKey,
      audioEnabledStorageKey,
      activeAudioStorageKey
    ].forEach(key => localStorage.removeItem(key));
  } catch {}
}

const celebrationUnlockAt = Date.UTC(2026, 4, 15, 18, 30, 0); // 16 May 2026, 12:00 AM IST
// Testing bypass: comment the line above and uncomment this line to open the site instantly.
// const celebrationUnlockAt = Date.now() - 1000;
let celebrationGateTimer = null;

const isLowMotionDevice = window.matchMedia('(max-width: 640px)').matches || navigator.hardwareConcurrency <= 4;
const motion = {
  touchTrailDelay: isLowMotionDevice ? 180 : 85,
  heartSparkles: isLowMotionDevice ? 10 : 26,
  maxBackgroundDecorations: isLowMotionDevice ? 18 : 42,
  backgroundDecorInterval: isLowMotionDevice ? 2600 : 1800,
  confettiBurst: isLowMotionDevice ? 18 : 36,
  confettiInterval: isLowMotionDevice ? 420 : 260,
  confettiDuration: isLowMotionDevice ? 3600 : 5600,
  musicNoteInterval: isLowMotionDevice ? 360 : 220,
  balloonCount: isLowMotionDevice ? 9 : 13,
  popBurstParticles: isLowMotionDevice ? 6 : 10,
  finalConfettiInterval: isLowMotionDevice ? 220 : 130,
  finalConfettiDuration: isLowMotionDevice ? 6500 : 10000
};

function formatLockCountdown(ms) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (days > 0) return `${days}d ${hours}h ${minutes}m ${seconds}s`;
  return `${hours}h ${minutes}m ${seconds}s`;
}

function updateCelebrationGate() {
  const countdown = $('lockCountdown');
  const remaining = celebrationUnlockAt - Date.now();
  if (remaining > 0) {
    if (countdown) countdown.textContent = formatLockCountdown(remaining);
    return;
  }
  if (celebrationGateTimer) clearInterval(celebrationGateTimer);
  restoreSavedPhase();
}

function initCelebrationGate() {
  updateCelebrationGate();
  if (celebrationUnlockAt > Date.now()) {
    celebrationGateTimer = setInterval(updateCelebrationGate, 1000);
  }
}

// Cute touch / click effects
const trailEmojis = ['✨','💖','💫','💕','🎉'];
let lastTrail = 0;

function spawnTouchSparkle(x, y) {
  const el = document.createElement('div');
  el.className = 'touch-sparkle';
  el.textContent = trailEmojis[randInt(0, trailEmojis.length)];
  el.style.cssText = `left:${x}px;top:${y}px;--tx:${rand(-34,34)}px;--ty:${rand(-52,-18)}px;--rot:${rand(-120,120)}deg;font-size:${rand(1,1.55)}rem`;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 900);
}

function spawnTapRing(x, y) {
  const el = document.createElement('div');
  el.className = 'tap-ring';
  el.style.left = `${x}px`;
  el.style.top = `${y}px`;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 600);
}

document.addEventListener('pointermove', e => {
  const now = Date.now();
  if (now - lastTrail < motion.touchTrailDelay) return;
  lastTrail = now;
  spawnTouchSparkle(e.clientX, e.clientY);
});

document.addEventListener('pointerdown', e => {
  spawnTapRing(e.clientX, e.clientY);
});

document.querySelectorAll('.btn').forEach(btn => {
  btn.addEventListener('pointerdown', e => {
    btn.classList.add('pressed');
    const r = btn.getBoundingClientRect();
    const ripple = document.createElement('span');
    ripple.className = 'ripple';
    ripple.style.left = `${e.clientX - r.left}px`;
    ripple.style.top = `${e.clientY - r.top}px`;
    btn.appendChild(ripple);
    setTimeout(() => ripple.remove(), 700);
  });
  btn.addEventListener('pointerup', () => btn.classList.remove('pressed'));
  btn.addEventListener('pointerleave', () => btn.classList.remove('pressed'));
});

// Heart drawing gate for the landing screen
const heartCanvas = $('heartCanvas');
const heartDraw = $('heartDraw');
const drawHint = $('drawHint');
const startBtn = $('startBtn');
const heartCtx = heartCanvas.getContext('2d');
let drawingHeart = false;
let heartUnlocked = false;
let heartPoints = [];

function resizeHeartCanvas() {
  const rect = heartCanvas.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  heartCanvas.width = Math.max(1, Math.round(rect.width * dpr));
  heartCanvas.height = Math.max(1, Math.round(rect.height * dpr));
  heartCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
  heartCtx.lineCap = 'round';
  heartCtx.lineJoin = 'round';
}

function clearHeartCanvas() {
  heartCtx.clearRect(0, 0, heartCanvas.width, heartCanvas.height);
}

function drawHeartLine(point) {
  heartCtx.lineWidth = 8;
  heartCtx.strokeStyle = 'rgba(255, 105, 180, .95)';
  heartCtx.shadowColor = '#ff69b4';
  heartCtx.shadowBlur = 18;
  if (heartPoints.length === 1) {
    heartCtx.beginPath();
    heartCtx.moveTo(point.x, point.y);
  } else {
    heartCtx.lineTo(point.x, point.y);
    heartCtx.stroke();
  }
}

function heartDrawPoint(e) {
  const rect = heartCanvas.getBoundingClientRect();
  return { x: e.clientX - rect.left, y: e.clientY - rect.top };
}

function revealStartButton() {
  if (heartUnlocked) return;
  heartUnlocked = true;
  heartDraw.classList.add('complete');
  drawHint.textContent = 'Perfect! Now start the celebration 💖';
  startBtn.classList.remove('locked');
  startBtn.classList.add('ready');
  saveLocal(heartStorageKey, 'true');
  for (let i = 0; i < motion.heartSparkles; i++) setTimeout(() => spawnTouchSparkle(innerWidth / 2 + rand(-90, 90), innerHeight / 2 + rand(-90, 90)), i * 45);
  startConfetti();
}

function restoreHeartUnlockedState() {
  heartUnlocked = true;
  heartDraw.classList.add('complete');
  drawHint.textContent = 'Perfect! Now start the celebration 💖';
  startBtn.classList.remove('locked');
  startBtn.classList.add('ready');
}

function checkHeartDrawing() {
  if (heartUnlocked || heartPoints.length < 18) return;
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity, distance = 0;
  for (let i = 0; i < heartPoints.length; i++) {
    const p = heartPoints[i];
    minX = Math.min(minX, p.x); minY = Math.min(minY, p.y);
    maxX = Math.max(maxX, p.x); maxY = Math.max(maxY, p.y);
    if (i > 0) distance += Math.hypot(p.x - heartPoints[i - 1].x, p.y - heartPoints[i - 1].y);
  }
  const w = maxX - minX;
  const h = maxY - minY;
  const enoughShape = w > 90 && h > 80 && distance > 260;
  const notJustLine = distance > (w + h) * 1.45;
  if (enoughShape && notJustLine) revealStartButton();
  else {
    drawHint.textContent = 'Draw a bigger heart shape 💖';
    setTimeout(() => {
      if (!heartUnlocked) drawHint.textContent = 'Draw a heart to unlock...';
    }, 1300);
  }
}

resizeHeartCanvas();
window.addEventListener('resize', resizeHeartCanvas);

heartCanvas.addEventListener('pointerdown', e => {
  if (heartUnlocked) return;
  e.preventDefault();
  heartCanvas.setPointerCapture(e.pointerId);
  clearHeartCanvas();
  heartPoints = [heartDrawPoint(e)];
  drawingHeart = true;
  drawHint.textContent = 'Keep drawing the heart...';
  drawHeartLine(heartPoints[0]);
});

heartCanvas.addEventListener('pointermove', e => {
  if (!drawingHeart || heartUnlocked) return;
  e.preventDefault();
  const point = heartDrawPoint(e);
  heartPoints.push(point);
  drawHeartLine(point);
});

function finishHeartDrawing(e) {
  if (!drawingHeart) return;
  drawingHeart = false;
  try { heartCanvas.releasePointerCapture(e.pointerId); } catch {}
  checkHeartDrawing();
}

heartCanvas.addEventListener('pointerup', finishHeartDrawing);
heartCanvas.addEventListener('pointercancel', finishHeartDrawing);

// Stars
(function createStars() {
  const bg = $('stars-bg');
  for (let i = 0; i < 160; i++) {
    const s = document.createElement('div');
    s.className = 'star';
    const sz = rand(.5, 3);
    s.style.cssText = `width:${sz}px;height:${sz}px;top:${rand(0,100)}%;left:${rand(0,100)}%;--d:${rand(1,4)}s;animation-delay:${rand(0,4)}s`;
    bg.appendChild(s);
  }
})();

// =========================================================
//  AUDIO CONTEXT
// =========================================================
let audioCtx;
function getAudio() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  return audioCtx;
}

// Play a tone
function playTone(freq, start, duration, type = 'sine', vol = .3) {
  const ctx = getAudio();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain); gain.connect(ctx.destination);
  osc.type = type;
  osc.frequency.setValueAtTime(freq, ctx.currentTime + start);
  gain.gain.setValueAtTime(vol, ctx.currentTime + start);
  gain.gain.exponentialRampToValueAtTime(.001, ctx.currentTime + start + duration);
  osc.start(ctx.currentTime + start);
  osc.stop(ctx.currentTime + start + duration + .05);
}

// Pop sound
function playPop() {
  popTrack.currentTime = 0;
  popTrack.volume = .9;
  popTrack.muted = audioMuted;
  const popPromise = popTrack.play();
  if (popPromise) {
    popPromise.catch(playGeneratedPop);
    return;
  }
  playGeneratedPop();
}

function playGeneratedPop() {
  const ctx = getAudio();
  const buf = ctx.createBuffer(1, ctx.sampleRate * .15, ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / data.length, 2);
  const src = ctx.createBufferSource();
  src.buffer = buf;
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(.6, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(.001, ctx.currentTime + .15);
  src.connect(gain); gain.connect(ctx.destination);
  src.start();
}

// Happy Birthday melody  (simplified)
function playHappyBirthday() {
  const ctx = getAudio();
  // C D E F G A B C5
  const N = { C4:261.6, D4:293.7, E4:329.6, F4:349.2, G4:392, A4:440, Bb4:466.2, C5:523.3, F5:698.5, G5:784 };
  const melody = [
    [N.C4,.0,.35],[N.C4,.38,.15],[N.D4,.55,.5],
    [N.C4,1.15,.5],[N.F4,1.65,.5],[N.E4,2.15,1.0],
    [N.C4,3.3,.35],[N.C4,3.65,.15],[N.D4,3.85,.5],
    [N.C4,4.5,.5],[N.G4,5.0,.5],[N.F4,5.5,1.0],
    [N.C4,6.6,.35],[N.C4,6.95,.15],[N.C5,7.1,.5],
    [N.A4,7.7,.5],[N.F4,8.2,.35],[N.E4,8.55,.2],[N.D4,8.8,.5],
    [N.Bb4,9.3,.35],[N.Bb4,9.65,.15],[N.A4,9.85,.5],
    [N.F4,10.35,.5],[N.G4,10.85,.5],[N.F4,11.35,1.2],
  ];
  melody.forEach(([f, s, d]) => playTone(f, s, d, 'triangle', .28));
}

const musicTrack = new Audio('song1.mp3');
const finalMessageTrack = new Audio('song2.mp3');
const flashbackTrack = new Audio('song3.mp3');
const popTrack = new Audio('pop.mp3');
musicTrack.preload = 'auto';
finalMessageTrack.preload = 'auto';
flashbackTrack.preload = 'auto';
popTrack.preload = 'auto';
musicTrack.loop = true;
finalMessageTrack.loop = true;
flashbackTrack.loop = true;
let activeAudioTrack = null;
let audioMuted = false;
const audioFadeTimers = new WeakMap();
const audioTrackIds = new Map([
  [musicTrack, 'music'],
  [finalMessageTrack, 'final-message'],
  [flashbackTrack, 'flashback']
]);
const audioTracksById = {
  music: { track: musicTrack, volume: .85 },
  'final-message': { track: finalMessageTrack, volume: .78 },
  flashback: { track: flashbackTrack, volume: .82 }
};
let audioRestoreArmed = false;

function updateAudioToggle() {
  const btn = $('audioToggle');
  btn.textContent = audioMuted ? '🔇' : '🔊';
  btn.title = audioMuted ? 'Sound off' : 'Sound on';
  btn.setAttribute('aria-label', audioMuted ? 'Unmute sound' : 'Mute sound');
  btn.classList.toggle('muted', audioMuted);
}

function clearAudioFade(track) {
  const timer = audioFadeTimers.get(track);
  if (timer) clearInterval(timer);
  audioFadeTimers.delete(track);
}

function fadeTrackVolume(track, toVolume, duration = 900, onDone) {
  clearAudioFade(track);
  const fromVolume = track.volume || 0;
  const steps = Math.max(1, Math.round(duration / 50));
  let step = 0;
  const timer = setInterval(() => {
    step++;
    const progress = Math.min(1, step / steps);
    track.volume = fromVolume + (toVolume - fromVolume) * progress;
    if (progress >= 1) {
      clearAudioFade(track);
      if (onDone) onDone();
    }
  }, 50);
  audioFadeTimers.set(track, timer);
}

function stopAudioTrack(track, fade = true) {
  clearAudioFade(track);
  if (track.paused) return;
  const finish = () => {
    track.pause();
    track.currentTime = 0;
    if (activeAudioTrack === track) {
      activeAudioTrack = null;
      saveLocal(activeAudioStorageKey, '');
    }
  };
  if (fade) fadeTrackVolume(track, 0, 850, finish);
  else finish();
}

function playAudioTrack(track, volume = .85, options = {}) {
  const { fallback = true } = options;
  $('audioToggle').classList.remove('hidden');
  [musicTrack, finalMessageTrack, flashbackTrack].forEach(activeTrack => {
    if (activeTrack !== track) stopAudioTrack(activeTrack);
  });
  activeAudioTrack = track;
  saveLocal(audioEnabledStorageKey, 'true');
  saveLocal(activeAudioStorageKey, audioTrackIds.get(track) || '');
  track.currentTime = 0;
  track.volume = 0;
  track.muted = audioMuted;
  const playPromise = track.play();
  if (playPromise) {
    playPromise
      .then(() => {
        if (!audioMuted) fadeTrackVolume(track, volume, 1100);
      })
      .catch(() => {
        if (fallback) playHappyBirthday();
      });
  } else if (!audioMuted) {
    fadeTrackVolume(track, volume, 1100);
  }
}

function playOurSong() {
  playAudioTrack(musicTrack, .85);
}

function playFlashbackSong() {
  playAudioTrack(flashbackTrack, .82);
}

function playFinalMessageSong() {
  playAudioTrack(finalMessageTrack, .78);
}

$('audioToggle').addEventListener('click', () => {
  audioMuted = !audioMuted;
  [musicTrack, finalMessageTrack, flashbackTrack, popTrack].forEach(track => {
    track.muted = audioMuted;
  });
  updateAudioToggle();
  if (!audioMuted && readLocal(audioEnabledStorageKey) === 'true') restoreSavedAudioAfterRefresh();
});
updateAudioToggle();

function restoreSavedAudioAfterRefresh() {
  if (audioMuted || readLocal(audioEnabledStorageKey) !== 'true') return;
  const saved = readLocal(activeAudioStorageKey);
  const savedAudio = audioTracksById[saved];
  if (!savedAudio) return;
  if (activeAudioTrack === savedAudio.track && !savedAudio.track.paused) return;

  playAudioTrack(savedAudio.track, savedAudio.volume, { fallback: false });
}

function armAudioRestoreOnGesture() {
  if (audioRestoreArmed || readLocal(audioEnabledStorageKey) !== 'true') return;
  audioRestoreArmed = true;
  const restore = () => restoreSavedAudioAfterRefresh();
  ['pointerdown', 'click', 'touchstart', 'keydown'].forEach(eventName => {
    document.addEventListener(eventName, restore, { once: true, passive: true });
  });
  requestAnimationFrame(restore);
}

let scrollHintFrame = 0;

function getActivePhase() {
  return [...document.querySelectorAll('.phase')].find(phase => !phase.classList.contains('hidden'));
}

function updateScrollHint() {
  scrollHintFrame = 0;
  const hint = $('scrollHint');
  const activePhase = getActivePhase();
  if (!activePhase || activePhase.id !== 'msg-phase') {
    hint.classList.add('hidden');
    return;
  }

  const scrollAreas = [activePhase, ...activePhase.querySelectorAll('.phase-card')];
  const shouldShow = scrollAreas.some(area => {
    const maxScroll = area.scrollHeight - area.clientHeight;
    return maxScroll > 18 && area.scrollTop < maxScroll - 18;
  });
  hint.classList.toggle('hidden', !shouldShow);
}

function scheduleScrollHintUpdate() {
  if (scrollHintFrame) return;
  scrollHintFrame = requestAnimationFrame(updateScrollHint);
}

document.addEventListener('scroll', scheduleScrollHintUpdate, true);
window.addEventListener('resize', scheduleScrollHintUpdate);
new MutationObserver(scheduleScrollHintUpdate).observe(document.body, {
  childList: true,
  characterData: true,
  subtree: true
});

// =========================================================
//  PHASE MANAGEMENT
// =========================================================
function showPhase(id) {
  document.querySelectorAll('.phase').forEach(p => p.classList.add('hidden'));
  $(id).classList.remove('hidden');
  if (id !== 'balloon-phase') $('balloonHint').classList.remove('show');
  $('scrollHint').classList.add('hidden');
  scheduleScrollHintUpdate();
  if (id === 'balloon-phase') clearFloatingDecorations();
  if (id === 'countdown-phase' || id === 'cake-phase') removeDecorTitle();
}

function restoreSavedPhase() {
  clearSavedProgress();
  const phase = 'landing';
  showPhase(phase);

  if (phase === 'landing') {
    requestAnimationFrame(resizeHeartCanvas);
  }
}

function clearFloatingDecorations() {
  activeConfettiIntervals.splice(0).forEach(id => clearInterval(id));
  document.querySelectorAll('.float-item').forEach(el => el.remove());
  document.querySelectorAll('.birthday-decor').forEach(el => el.remove());
  document.querySelectorAll('.confetti').forEach(el => el.remove());
  persistentDecorations = 0;
}

function removeDecorTitle() {
  document.querySelectorAll('.decor-title').forEach(el => el.remove());
}

// =========================================================
//  PHASE 1 → 2: START
// =========================================================
$('startBtn').addEventListener('click', () => {
  showPhase('decorate-phase');
});

// =========================================================
//  PHASE 2: DECORATE
// =========================================================
const floatEmojis = ['🌸','🌺','💖','💕','🌷','💗','🌼','💝','🌹','✨','💫','🦋','🌻','💐'];
let decorateInterval;
let persistentDecorations = 0;

function spawnFloatItem(stay = false) {
  const el = document.createElement('div');
  el.className = stay ? 'float-item stay' : 'float-item';
  el.textContent = floatEmojis[randInt(0, floatEmojis.length)];
  if (stay) {
    el.style.cssText = `left:${rand(4,92)}%;top:${rand(8,88)}%;--dur:${rand(2.2,4.8)}s;--rot:${rand(-24,24)}deg;font-size:${rand(1.4,3)}rem`;
    persistentDecorations++;
  } else {
    el.style.cssText = `left:${rand(0,95)}%;bottom:-60px;--dur:${rand(4,8)}s;--rot:${rand(-40,40)}deg;font-size:${rand(1.5,3.5)}rem`;
  }
  document.body.appendChild(el);
  if (!stay) setTimeout(() => el.remove(), 9000);
}

function createBirthdayBackdrop() {
  clearFloatingDecorations();
  const decor = document.createElement('div');
  decor.className = 'birthday-decor';
  if (isLowMotionDevice) decor.classList.add('mobile-decor');

  const rope = document.createElement('div');
  rope.className = 'birthday-rope';
  decor.appendChild(rope);

  const colors = [
    ['#ff72bd', '#c70f75'],
    ['#ffc3df', '#f77db7'],
    ['#f8f5f6', '#c9c6c8'],
    ['#ef4c9a', '#a9085f'],
    ['#ffffff', '#d7d5d5'],
    ['#f2c2ce', '#bfb7bb']
  ];
  const desktopPoints = [
    [10, 36, 64, -12, 3.1], [15, 27, 52, 8, 2.8], [22, 20, 72, -7, 3.4],
    [31, 15, 56, 12, 3], [41, 12, 76, -5, 3.5], [51, 11, 58, 7, 2.9],
    [61, 12, 74, -2, 3.2], [71, 16, 56, 9, 3.5], [80, 23, 72, -10, 3],
    [87, 32, 58, 7, 3.3], [92, 43, 66, -8, 2.9], [7, 48, 54, 13, 3.5],
    [18, 42, 46, 8, 3.6], [83, 44, 48, -6, 3.1], [28, 13, 42, 11, 3.3],
    [74, 13, 44, -9, 3.2], [8, 62, 50, -8, 3.7], [15, 74, 42, 10, 3.9],
    [25, 86, 54, -13, 3.4], [75, 84, 52, 11, 3.6], [86, 72, 44, -9, 3.8],
    [94, 60, 56, 8, 3.5], [4, 83, 38, 7, 4.1], [96, 88, 40, -10, 4]
  ];
  const mobilePoints = [
    [10, 26, 42, -12, 3.2], [19, 15, 34, 8, 3.6], [30, 8, 46, -6, 3.4],
    [42, 5, 34, 5, 3.8], [54, 6, 48, -4, 3.3], [66, 9, 34, 8, 3.7],
    [78, 16, 44, -9, 3.2], [90, 28, 38, 11, 3.5], [12, 50, 32, 7, 3.9],
    [88, 52, 32, -7, 3.9], [50, 28, 30, 4, 4.1], [9, 66, 34, -8, 4],
    [20, 80, 30, 9, 4.2], [82, 78, 32, -10, 4.1], [92, 66, 34, 8, 4],
    [50, 84, 28, 5, 4.4]
  ];
  const points = isLowMotionDevice ? mobilePoints : desktopPoints;

  points.forEach(([x, y, s, r, dur], index) => {
    const b = document.createElement('span');
    const [c, d] = colors[index % colors.length];
    b.className = `decor-balloon${index === 0 || index === 4 || (!isLowMotionDevice && index === 11) ? ' heart' : ''}${s < 52 ? ' small' : ''}`;
    b.style.cssText = `--x:${x}%;--y:${y}%;--s:${s}px;--r:${r}deg;--dur:${dur}s;--delay:${index * .045}s;--c:${c};--d:${d}`;
    decor.appendChild(b);
  });

  const banner = document.createElement('div');
  banner.className = 'birthday-banner';
  const bannerText = isLowMotionDevice ? 'HAPPYBDAY' : 'HAPPYBIRTHDAY';
  bannerText.split('').forEach(letter => {
    const flag = document.createElement('span');
    flag.textContent = letter;
    flag.style.setProperty('--delay', `${.35 + banner.children.length * .035}s`);
    banner.appendChild(flag);
  });
  decor.appendChild(banner);

  const birthdayTitle = document.createElement('div');
  birthdayTitle.className = 'decor-title';
  birthdayTitle.innerHTML = '<span>Happy Birthday</span><strong>AaRzo E MeHak ShahZadi</strong>';
  decor.appendChild(birthdayTitle);

  const flowers = isLowMotionDevice ? [
    [13, 34, '🌸', 1.18], [24, 19, '💗', 1.08], [36, 12, '✨', 1],
    [50, 9, '🌺', 1.12], [64, 12, '✨', 1], [76, 20, '💗', 1.08],
    [87, 35, '🌸', 1.18], [20, 58, '💕', 1.05], [50, 48, '🌷', 1.08],
    [80, 60, '💕', 1.05]
  ] : [
    [17, 37, '🌸', 1.6], [24, 18, '🌺', 1.3], [36, 13, '🌷', 1.2],
    [48, 10, '🌸', 1.4], [63, 13, '🌺', 1.25], [76, 20, '🌷', 1.35],
    [84, 38, '🌸', 1.55], [12, 49, '🌺', 1.2], [90, 49, '🌺', 1.2]
  ];
  flowers.forEach(([x, y, flower, size], index) => {
    const el = document.createElement('span');
    el.className = 'decor-flower';
    el.textContent = flower;
    el.style.cssText = `--x:${x}%;--y:${y}%;--s:${size}rem;--dur:${rand(2.6, 3.6)}s;--delay:${.25 + index * .04}s`;
    decor.appendChild(el);
  });

  if (isLowMotionDevice) {
    ['♡', '✦', '♡', '✧', '♡', '✦', '♡', '✧'].forEach((petal, index) => {
      const el = document.createElement('span');
      el.className = 'mobile-petal';
      el.textContent = petal;
      el.style.cssText = `--x:${rand(12,88)}%;--delay:${index * .28}s;--dur:${rand(4.5,6.2)}s;--drift:${rand(-28,28)}px`;
      decor.appendChild(el);
    });
  }

  document.body.appendChild(decor);
}

$('decorateBtn').addEventListener('click', () => {
  $('decorateBtn').closest('.phase-card').classList.add('decor-card-done');
  createBirthdayBackdrop();
  startConfetti();
  setTimeout(() => {
    showPhase('music-phase');
  }, 3500);
});

// keep a few floating in background
function keepFloating() {
  setInterval(() => {
    if (!$('balloon-phase').classList.contains('hidden') || !$('msg-phase').classList.contains('hidden') || !$('end-phase').classList.contains('hidden')) return;
    if (persistentDecorations < motion.maxBackgroundDecorations) spawnFloatItem(true);
  }, motion.backgroundDecorInterval);
}

// =========================================================
//  CONFETTI
// =========================================================
const confettiColors = ['#ff69b4','#ff1493','#ffd700','#ff6347','#7b68ee','#00ced1','#adff2f','#fff'];
const activeConfettiIntervals = [];
function spawnConfetti() {
  const el = document.createElement('div');
  el.className = 'confetti';
  el.style.cssText = `left:${rand(0,100)}%;top:0;background:${confettiColors[randInt(0,confettiColors.length)]};--dur:${rand(2.5,5)}s;--rot:${rand(-360,360)}deg;--br:${Math.random()>.5?'50%':'3px'};animation-delay:${rand(0,.5)}s`;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 6000);
}
function startConfetti() {
  for (let i = 0; i < motion.confettiBurst; i++) setTimeout(spawnConfetti, i * 55);
  const ci = setInterval(spawnConfetti, motion.confettiInterval);
  activeConfettiIntervals.push(ci);
  setTimeout(() => clearInterval(ci), motion.confettiDuration);
}

// =========================================================
//  PHASE 3: MUSIC
// =========================================================
const musicNotes = ['🎵','🎶','🎼','♪','♫'];
let musicNoteInterval;

function spawnMusicNote() {
  const el = document.createElement('div');
  el.className = 'music-note';
  el.textContent = musicNotes[randInt(0, musicNotes.length)];
  const tx = rand(-200, 200);
  const ty = rand(-300, -100);
  el.style.cssText = `left:${rand(10,90)}%;bottom:${rand(10,50)}%;--tx:${tx}px;--ty:${ty}px;--dur:${rand(1.5,3)}s;--rot:${rand(-60,60)}deg;font-size:${rand(1.4,2.8)}rem`;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 3500);
}

$('musicBtn').addEventListener('click', () => {
  $('musicBtn').closest('.phase-card').classList.add('decor-card-done');
  $('soundTip').classList.remove('hidden');
  requestAnimationFrame(() => $('soundTip').classList.add('show'));
  setTimeout(() => $('soundTip').classList.remove('show'), 2500);
  setTimeout(() => $('soundTip').classList.add('hidden'), 3000);
  setTimeout(() => {
    playOurSong();
    musicNoteInterval = setInterval(spawnMusicNote, motion.musicNoteInterval);
    startConfetti();
  }, 1200);
  setTimeout(() => {
    startCountdown('cake-phase');
  }, 2000);
  setTimeout(() => {
    if (musicNoteInterval) clearInterval(musicNoteInterval);
  }, 4000);
});

// =========================================================
//  FINAL MESSAGE MEMORIES
// =========================================================
const flashbackPhotoFiles = Array.from({ length: 15 }, (_, index) => `photo${index + 1}.jpg`);
let flashbackPhotos = [];
let flashbackTimer;

function endWebsite() {
  stopAudioTrack(flashbackTrack);
  $('memoryNextBtn').classList.add('hidden');
  showPhase('end-phase');
  window.close();
}

function preloadFlashbackPhotos() {
  return Promise.all(flashbackPhotoFiles.map(src => new Promise(resolve => {
    const img = new Image();
    img.onload = () => resolve(src);
    img.onerror = () => resolve(null);
    img.src = src;
  }))).then(files => files.filter(Boolean));
}

function showFlashbackFrame(index) {
  const photo = $('flashbackPhoto');
  const card = $('flashbackCard');
  const counter = $('flashbackCounter');
  const src = flashbackPhotos[index];

  card.classList.remove('show');
  setTimeout(() => {
    photo.src = src;
    counter.textContent = `${index + 1} / ${flashbackPhotos.length}`;
    card.style.setProperty('--flash-rot', `${rand(-5, 5)}deg`);
    card.classList.add('show');
  }, 120);
}

async function startFlashback() {
  clearInterval(flashbackTimer);
  $('memoryStartBtn').classList.add('hidden');
  $('memoryNextBtn').classList.add('hidden');
  $('memoryStage').classList.remove('hidden');
  playFlashbackSong();

  if (!flashbackPhotos.length) flashbackPhotos = await preloadFlashbackPhotos();
  if (!flashbackPhotos.length) {
    $('flashbackCounter').textContent = 'Add photo1.jpg to photo15.jpg here';
    $('memoryNextBtn').classList.remove('hidden');
    return;
  }

  let index = 0;
  showFlashbackFrame(index);
  flashbackTimer = setInterval(() => {
    index++;
    if (index >= flashbackPhotos.length) {
      clearInterval(flashbackTimer);
      setTimeout(() => {
        stopAudioTrack(flashbackTrack);
        $('memoryNextBtn').classList.remove('hidden');
        $('memoryNextBtn').scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 900);
      return;
    }
    showFlashbackFrame(index);
  }, 1700);
}

$('memoryStartBtn').addEventListener('click', startFlashback);
$('memoryNextBtn').addEventListener('click', endWebsite);

// =========================================================
//  FLOATING WISHES AFTER CANDLES
// =========================================================
const wishes = [
'May Allah bless your life with endless barakah',
'May Allah accept all your duas',
'May Allah keep your heart close to Him',
'May Allah grant you righteous happiness',
'May Allah protect you from every hardship',
'May Allah guide you to what is best for you',
'May Allah grant you success in this life and the Hereafter',
'May Allah bless your family with peace and happiness',
'May Allah fill your heart with iman, sabr, and shukr',
'May Allah make every year of your life better than the last',
];

function launchFloatingWishes() {
  $('cakeNextBtn').textContent = 'Wishes floating...';
  $('cakeNextBtn').classList.add('locked');
  $('cakeNextBtn').classList.remove('ready');

  wishes.forEach((wish, index) => {
    setTimeout(() => {
      const note = document.createElement('div');
      note.className = 'floating-wish';
      note.textContent = wish;
      note.style.cssText = `--x:${rand(18,82)}%;--dur:${rand(4.8,6.2)}s;--rot:${rand(-8,8)}deg;--drift:${rand(-42,42)}px`;
      document.body.appendChild(note);
      setTimeout(() => note.remove(), 6800);
      if (!isLowMotionDevice || index % 2 === 0) {
        spawnTouchSparkle(rand(innerWidth * .22, innerWidth * .78), innerHeight - 70);
      }
    }, index * 650);
  });

  setTimeout(() => {
    $('cakeHint').textContent = 'All my wishes are flying to you.';
    $('cakeNextBtn').textContent = 'Balloons are coming...';
    startConfetti();
    setTimeout(() => showPhase('balloon-phase'), 1200);
  }, wishes.length * 650 + 2600);
}

// =========================================================
//  PHASE 4: CAKE
// =========================================================
let cakeBlown = false;
let cakeBreeze = 0;
let cakePointerActive = false;
let lastCakePoint = null;
let floatingWishesStarted = false;

function initCakePhase() {
  cakeBlown = false;
  cakeBreeze = 0;
  cakePointerActive = false;
  lastCakePoint = null;
  floatingWishesStarted = false;
  $('cake').classList.remove('blown', 'fanning');
  document.querySelectorAll('#cake .candle').forEach(candle => candle.classList.remove('out'));
  $('micMeter').style.width = '0%';
  $('cakeHint').textContent = 'Close your eyes and make a wish, then glide your finger over the candles. 🪄✨';
  $('cakeNextBtn').textContent = 'Swipe Candles';
  $('cakeNextBtn').classList.add('locked');
  $('cakeNextBtn').classList.remove('ready');
}

function blowOutCandles() {
  if (cakeBlown) return;
  cakeBlown = true;
  $('cake').classList.add('blown');
  document.querySelectorAll('#cake .candle').forEach(candle => candle.classList.add('out'));
  $('cakeHint').textContent = 'Look up... your wishes are floating in.';
  if (!floatingWishesStarted) {
    floatingWishesStarted = true;
    launchFloatingWishes();
  }
  startConfetti();
}

function addCakeBreeze(amount) {
  if (cakeBlown) return;
  cakeBreeze = Math.min(100, cakeBreeze + amount);
  $('micMeter').style.width = `${cakeBreeze}%`;
  $('cakeNextBtn').textContent = cakeBreeze < 100 ? 'Keep swiping...' : 'Final Countdown';
  if (cakeBreeze > 12 && cakeBreeze < 100) $('cakeHint').textContent = 'A little more... the candles are listening.';

  const candles = document.querySelectorAll('#cake .candle');
  const outCount = Math.floor(cakeBreeze / 34);
  candles.forEach((candle, index) => {
    if (index < outCount) candle.classList.add('out');
  });

  $('cake').classList.add('fanning');
  clearTimeout($('cake').fanTimer);
  $('cake').fanTimer = setTimeout(() => $('cake').classList.remove('fanning'), 220);

  if (cakeBreeze >= 100) blowOutCandles();
}

function handleCakeTap(e) {
  e.preventDefault();
  cakePointerActive = false;
  lastCakePoint = null;
  spawnTouchSparkle(e.clientX, e.clientY);
  addCakeBreeze(8);
}

$('cake').addEventListener('pointerdown', e => {
  e.preventDefault();
  cakePointerActive = true;
  lastCakePoint = { x: e.clientX, y: e.clientY };
  $('cake').setPointerCapture(e.pointerId);
  $('cakeNextBtn').textContent = 'Swipe over candles';
});

$('cake').addEventListener('pointermove', e => {
  if (!cakePointerActive || !lastCakePoint) return;
  const dx = e.clientX - lastCakePoint.x;
  const dy = e.clientY - lastCakePoint.y;
  const distance = Math.hypot(dx, dy);
  if (distance < 8) return;
  addCakeBreeze(Math.min(12, distance / 4));
  lastCakePoint = { x: e.clientX, y: e.clientY };
});

$('cake').addEventListener('pointerup', e => {
  try { $('cake').releasePointerCapture(e.pointerId); } catch {}
  handleCakeTap(e);
});

$('cake').addEventListener('pointercancel', () => {
  cakePointerActive = false;
  lastCakePoint = null;
});

$('cake').addEventListener('keydown', e => {
  if (e.key !== 'Enter' && e.key !== ' ') return;
  e.preventDefault();
  const r = $('cake').getBoundingClientRect();
  spawnTouchSparkle(r.left + r.width / 2, r.top + r.height / 2);
  addCakeBreeze(35);
});

$('cakeNextBtn').addEventListener('click', () => {
  if ($('cakeNextBtn').classList.contains('locked')) {
    addCakeBreeze(10);
    return;
  }
  startCountdown();
});

function startCountdown(nextPhase = 'balloon-phase') {
  if (nextPhase !== 'cake-phase') stopAudioTrack(musicTrack);
  showPhase('countdown-phase');
  const nums = ['3', '2', '1'];
  let index = 0;
  const tick = () => {
    $('countdownNumber').textContent = nums[index];
    $('countdownNumber').style.animation = 'none';
    void $('countdownNumber').offsetWidth;
    $('countdownNumber').style.animation = 'countdownPop .8s ease-out';
    index++;
    if (index < nums.length) setTimeout(tick, 1000);
    else setTimeout(() => {
      showPhase(nextPhase);
      if (nextPhase === 'cake-phase') initCakePhase();
    }, 650);
  };
  tick();
}

// =========================================================
//  PHASE 6: BALLOONS
// =========================================================
const balloonColors = [
  '#ff6b6b','#ff69b4','#ffd93d','#6bcbff','#a78bfa','#34d399','#fb923c','#f472b6'
];
let balloonsLeft = 0;
let balloonInterval;
const balloonEmojis = ['🎉'];

function spawnBalloon() {
  const wrap = document.createElement('div');
  wrap.className = 'balloon-wrap';
  const color = balloonColors[randInt(0, balloonColors.length)];
  const dur = rand(5, 10);
  wrap.style.cssText = `left:${rand(3,88)}%;--dur:${dur}s`;

  const b = document.createElement('div');
  b.className = 'balloon';
  b.style.background = `radial-gradient(circle at 35% 35%, ${color}ee, ${color}88)`;
  b.textContent = balloonEmojis[randInt(0, balloonEmojis.length)];
  wrap.appendChild(b);
  document.body.appendChild(wrap);
  balloonsLeft++;

  wrap.addEventListener('click', e => {
    if (wrap.dataset.popped === 'true') return;
    wrap.dataset.popped = 'true';
    wrap.style.pointerEvents = 'none';
    const rect = b.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    playPop();
    b.classList.add('pop');
    spawnTouchSparkle(cx, cy);
    spawnTapRing(cx, cy);
    const label = document.createElement('div');
    label.className = 'pop-label';
    label.textContent = 'Pop! 🎉';
    label.style.left = `${cx}px`;
    label.style.top = `${cy}px`;
    document.body.appendChild(label);
    setTimeout(() => label.remove(), 800);
    // burst particles
    for (let i = 0; i < motion.popBurstParticles; i++) {
      const burst = document.createElement('div');
      burst.className = 'pop-burst';
      burst.textContent = '🎉';
      const angle = (i / motion.popBurstParticles) * Math.PI * 2;
      const dist = rand(50, 100);
      burst.style.cssText = `left:${cx}px;top:${cy}px;--bx:${Math.cos(angle)*dist}px;--by:${Math.sin(angle)*dist}px`;
      document.body.appendChild(burst);
      setTimeout(() => burst.remove(), 600);
    }
    setTimeout(() => { wrap.remove(); balloonsLeft--; checkAllPopped(); }, 350);
  });

  // auto remove if not popped
  setTimeout(() => {
    if (wrap.parentNode) { wrap.remove(); balloonsLeft--; checkAllPopped(); }
  }, (dur + 1) * 1000);
}

let allLaunched = false;
let totalLaunched = 0;

function checkAllPopped() {
  if (allLaunched && balloonsLeft <= 0) {
    setTimeout(() => {
      startConfetti();
      showPhase('msg-phase');
      startTypewriterMessage();
      startFinalConfetti();
    }, 500);
  }
}

$('balloonBtn').addEventListener('click', () => {
  $('balloon-phase').querySelector('.phase-card').style.opacity = '0';
  $('balloon-phase').querySelector('.phase-card').style.pointerEvents = 'none';
  $('balloonHint').classList.add('show');

  const count = motion.balloonCount;
  totalLaunched = count;
  allLaunched = false;
  for (let i = 0; i < count; i++) {
    setTimeout(() => {
      spawnBalloon();
      if (i === count - 1) { allLaunched = true; checkAllPopped(); }
    }, i * 500);
  }
});

// =========================================================
//  PHASE 7: MESSAGE + final confetti
// =========================================================
const finalMessageText = `🎉🤍 سالگرہ مبارک ہو، گڈیا رانی

سالگرہ مبارک ہو اُس شخص کو، جس کی موجودگی نے میری زندگی کو ایک خوبصورت احساس سے بھر دیا۔ 🥳🥀

آج آپکی سالگرہ ہے، لیکن نہ جانے کیوں مجھے ایسا لگتا ہے جیسے سب سے خوبصورت تحفہ مجھے ملا ہو، وہ ایک خاص دن۔ ✨

مجھے نہیں معلوم کہ میں کبھی اپنے دل کی تمام باتیں لفظوں میں بیان کر پاؤں گا یا نہیں۔ مجھے آپ سے محبت کرتے ہوئے تین سال سے بھی زیادہ ہو گئے ہیں، ویسے تو محبت کے دن گنے نہیں جاتے مگر یہ دن انتظار کے ہیں اور اتنا وقت گزرنے کے باوجود میرا دل آج بھی آپکو اسی طرح چاہتا ہے جیسے پہلی بار چاہا تھا۔ 🥀

لوگ کہتے ہیں کہ یک طرفہ محبت وقت کے ساتھ ختم ہو جاتی ہے۔ شاید کچھ لوگوں کے لیے ایسا ہو، لیکن میرے لیے وہ پہلا احساس ایک ایسی کہانی کا آغاز تھا جس کا میں نے کبھی سوچا بھی نہیں تھا۔ تین سال گزرنے کے بعد بھی آپ وہی ہو جسے میرا دل بے اختیار ڈھونڈتا رہتا ہے۔ 💫

آپ میرے لیے صرف ایک پسندیدہ شخص نہیں ہو، آپ میرے لیے بہت خاص ہو۔ آپکی خوشی میرے لیے واقعی اہم ہے، آپکی مسکراہٹ میرے دن کو بدل سکتی ہے، اور میرے دل میں آپکی جو جگہ ہے، وہ شاید کوئی اور کبھی نہ لے پائے۔ 💯

آپکی سالگرہ پر میں صرف آپکو خوشیوں کی دعا نہیں دینا چاہتا، بلکہ یہ دعا کرنا چاہتا ہوں کہ اللہ آپکو وہ تمام خوبصورت چیزیں عطا کرے جن کی تم حقدار ہو۔ اللہ آپکی مسکراہٹ کو ہمیشہ قائم رکھے، آپکے خواب پورے کرے، آپکے دل کو سکون دے اور آپکی زندگی کو بے شمار خوشیوں سے بھر دے۔ 🤲

اور آج بس اتنا کہنا چاہتا ہوں کہ میں آپ سے بہت محبت کرتا ہوں۔ ❤️

اس لیے نہیں کہ تم کامل ہو، بلکہ اس لیے کہ تم جیسی بھی ہو، نہ جانے کیسے میرے لیے بے حد قیمتی بن گئی ہو، تم مجھے بے حد عزیز ہو، مجھے نہیں معلوم کہ ہمارے مستقبل میں کیا لکھا ہے، اور نہ ہی میں تم پر کسی قِسم کا دباؤ ڈالنا چاہتا ہوں۔ میں صرف اپنے دل کا حال آپکو بتا رہا ہوں۔

لیکن اگر کبھی زندگی نے مجھے یہ اختیار دیا کہ میں اپنے ساتھ کسی ایک شخص کو چن سکوں، تو میں جانتا ہوں کہ میں کس کو چنوں گا۔

آپ کو۔ ❤️

اس لیے آج آپ کو سالگرہ کی مبارکباد دینے کے ساتھ، میں اپنے دل کی ایک خواہش آپ کے سامنے رکھنا چاہتا ہوں۔

میں آپ سے کچھ مانگ نہیں رہا، بس اپنے دل کا ایک خواب آپ کو بتانا چاہتا ہوں۔ میرا خواب ہے کہ میں وہ شخص بنوں جو صرف آپ سے محبت کرے، آپ کی عزت کرے، آپ کا خیال رکھے اور زندگی کے ہر موڑ پر آپ کا ساتھ دے۔ ❤️

اور اگر کبھی آپ کو بھی میرے دل میں اپنے لیے وہی سچائی محسوس ہو، تو شاید یہ خواب ایک دن حقیقت بن جائے۔ ❤️

شاید یہ دنیا کی سب سے بہترین پروپوزل نہ ہو، شاید میرے الفاظ بھی ان تین سال کی محبت کو مکمل طور پر بیان نہ کر سکیں۔ 

لیکن میرے ہر لفظ میں سچائی ہے۔ 🥀

میری دعا ہے کہ اللہ پاک آپ کی زندگی کو ہمیشہ خوشیوں، سکون اور محبت سے بھر دے۔ آپ کی ہر جائز خواہش پوری فرمائے، آپ کے تمام خوابوں کو حقیقت بنائے، آپ کو ہر غم اور پریشانی سے محفوظ رکھے، اور آپ کی مسکراہٹ ہمیشہ قائم رکھے۔

اللہ آپ کو صحت، کامیابی، عزت اور بے شمار خوشیاں عطا فرمائے، اور آپ کی زندگی کا ہر آنے والا سال پہلے سے زیادہ خوبصورت بنائے۔ ✨

آمین یا رب العالمین۔ 🤲

سالگرہ مبارک ہو آپکو۔ 🎂✨

اُس شخص کی جانب سے، جو تین سال سے بھی زیادہ عرصے سے آپکو خاموشی سے چاہتا آیا ہے، اور آج بھی دل میں وہی محبت رکھتا ہے۔ 🤍

~ Your Saami`;

let typewriterTimer;
function restoreFinalMessagePhase() {
  clearInterval(typewriterTimer);
  stopAudioTrack(finalMessageTrack);
  $('finalMessage').textContent = finalMessageText;
  $('finalMessage').classList.remove('type-cursor');
  $('memoryStartBtn').classList.remove('hidden');
  $('memoryNextBtn').classList.add('hidden');
  $('memoryStage').classList.add('hidden');
}

function startTypewriterMessage() {
  const el = $('finalMessage');
  const memoryStartBtn = $('memoryStartBtn');
  clearInterval(typewriterTimer);
  playFinalMessageSong();
  el.textContent = '';
  el.classList.add('type-cursor');
  memoryStartBtn.classList.add('hidden');
  $('memoryNextBtn').classList.add('hidden');
  $('memoryStage').classList.add('hidden');
  let i = 0;
  typewriterTimer = setInterval(() => {
    el.textContent += finalMessageText[i] || '';
    i++;
    if (i >= finalMessageText.length) {
      clearInterval(typewriterTimer);
      setTimeout(() => el.classList.remove('type-cursor'), 700);
      setTimeout(() => memoryStartBtn.classList.remove('hidden'), 900);
    }
  }, 28);
}

function startFinalConfetti() {
  const ci = setInterval(spawnConfetti, motion.finalConfettiInterval);
  setTimeout(() => clearInterval(ci), motion.finalConfettiDuration);
}

initCelebrationGate();
