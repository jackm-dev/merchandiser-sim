import * as THREE from 'three';
import { createStore } from './store.js';
import { Player } from './player.js';

// ── Scene ─────────────────────────────────────────────────────────────────────
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xD8D8D0);
scene.fog = new THREE.FogExp2(0xD8D8D0, 0.022);

// ── Camera ────────────────────────────────────────────────────────────────────
const camera = new THREE.PerspectiveCamera(72, window.innerWidth / window.innerHeight, 0.05, 60);
camera.position.set(0, 1.7, 11);   // start near front of OTC aisle, eye height

// ── Renderer ──────────────────────────────────────────────────────────────────
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = false; // off for perf; products are well-lit by ambient
renderer.outputColorSpace = THREE.SRGBColorSpace;
document.body.appendChild(renderer.domElement);

// ── Build World ───────────────────────────────────────────────────────────────
createStore(scene);

// ── Player ────────────────────────────────────────────────────────────────────
const player = new Player(camera, renderer.domElement);

// ── UI ────────────────────────────────────────────────────────────────────────
const startOverlay = document.getElementById('start-overlay');
const hud          = document.getElementById('hud');
const startBtn     = document.getElementById('start-btn');

startBtn.addEventListener('click', () => player.controls.lock());

player.controls.addEventListener('lock', () => {
  startOverlay.classList.add('hidden');
  hud.classList.remove('hidden');
});

player.controls.addEventListener('unlock', () => {
  startOverlay.classList.remove('hidden');
  hud.classList.add('hidden');
});

// ── Loop ──────────────────────────────────────────────────────────────────────
const clock = new THREE.Clock();
function animate() {
  requestAnimationFrame(animate);
  const delta = Math.min(clock.getDelta(), 0.05);
  player.update(delta);
  renderer.render(scene, camera);
}
animate();

// ── Resize ────────────────────────────────────────────────────────────────────
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
