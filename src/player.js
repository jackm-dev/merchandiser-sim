import * as THREE from 'three';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';

export class Player {
  constructor(camera, domElement) {
    this.camera = camera;
    this.controls = new PointerLockControls(camera, domElement);

    this.velocity = new THREE.Vector3();
    this.keys = { forward: false, backward: false, left: false, right: false };

    // Collision boxes for shelf gondolas [minX, maxX, minZ, maxZ]
    this.colliders = [
      // Left gondola run (inner + outer back-to-back) + end caps
      [-1.82, -0.70, -4.58, 4.58],
      // Right gondola run (inner + outer back-to-back) + end caps
      [ 0.70,  1.82, -4.58, 4.58],
    ];

    this._initKeyEvents();
  }

  _initKeyEvents() {
    const map = {
      KeyW: 'forward', ArrowUp: 'forward',
      KeyS: 'backward', ArrowDown: 'backward',
      KeyA: 'left', ArrowLeft: 'left',
      KeyD: 'right', ArrowRight: 'right',
    };
    document.addEventListener('keydown', (e) => { if (map[e.code]) this.keys[map[e.code]] = true; });
    document.addEventListener('keyup',   (e) => { if (map[e.code]) this.keys[map[e.code]] = false; });
  }

  update(delta) {
    if (!this.controls.isLocked) return;

    const SPEED = 50;
    const DAMP  = 12;

    this.velocity.x -= this.velocity.x * DAMP * delta;
    this.velocity.z -= this.velocity.z * DAMP * delta;

    if (this.keys.forward)   this.velocity.z -= SPEED * delta;
    if (this.keys.backward)  this.velocity.z += SPEED * delta;
    if (this.keys.left)      this.velocity.x -= SPEED * delta;
    if (this.keys.right)     this.velocity.x += SPEED * delta;

    this.controls.moveForward(-this.velocity.z * delta);
    this.controls.moveRight(this.velocity.x * delta);

    // Lock to floor
    this.camera.position.y = 1.7;

    // Store boundary walls
    const p = this.camera.position;
    p.x = Math.max(-9.5, Math.min(9.5, p.x));
    p.z = Math.max(-11.5, Math.min(11.5, p.z));

    // Shelf collisions — push player out of any collider box
    for (const [minX, maxX, minZ, maxZ] of this.colliders) {
      if (p.x > minX && p.x < maxX && p.z > minZ && p.z < maxZ) {
        // Find closest exit direction
        const dLeft  = Math.abs(p.x - minX);
        const dRight = Math.abs(p.x - maxX);
        const dFront = Math.abs(p.z - minZ);
        const dBack  = Math.abs(p.z - maxZ);
        const minDist = Math.min(dLeft, dRight, dFront, dBack);
        if (minDist === dLeft)  p.x = minX;
        if (minDist === dRight) p.x = maxX;
        if (minDist === dFront) p.z = minZ;
        if (minDist === dBack)  p.z = maxZ;
      }
    }
  }
}
