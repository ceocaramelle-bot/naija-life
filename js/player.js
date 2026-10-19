import * as THREE from 'three';

// Blocky procedural character. It has a simple swing animation, NOT a rigged skeleton.
export class Player {
  constructor(appearance) {
    this.group = new THREE.Group();
    this.pos = this.group.position;
    this.heading = 0;           // radians, 0 = facing +z
    this.phase = 0;
    this.speed = 0;
    this.radius = 0.4;
    this._build(appearance);
  }

  _box(w, h, d, color) {
    return new THREE.Mesh(new THREE.BoxGeometry(w, h, d), new THREE.MeshLambertMaterial({ color }));
  }

  _limb(w, h, d, color, x, topY) {
    const pivot = new THREE.Group(); pivot.position.set(x, topY, 0);
    const m = this._box(w, h, d, color); m.position.y = -h / 2; pivot.add(m);
    this.group.add(pivot); return pivot;
  }

  _build(a) {
    this.legL = this._limb(0.28, 0.8, 0.28, a.pants, -0.15, 0.8);
    this.legR = this._limb(0.28, 0.8, 0.28, a.pants, 0.15, 0.8);
    const torso = this._box(0.62, 0.7, 0.32, a.shirt); torso.position.y = 1.15; this.group.add(torso);
    this.armL = this._limb(0.2, 0.7, 0.2, a.skin, -0.42, 1.5);
    this.armR = this._limb(0.2, 0.7, 0.2, a.skin, 0.42, 1.5);
    const head = this._box(0.42, 0.42, 0.42, a.skin); head.position.y = 1.71; this.group.add(head);
    const hair = this._box(0.45, 0.12, 0.45, a.hair); hair.position.y = 1.96; this.group.add(hair);
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0x111111 });
    for (const x of [-0.1, 0.1]) {
      const e = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.06, 0.02), eyeMat); e.position.set(x, 1.74, 0.22); this.group.add(e);
    }
    const sh = new THREE.Mesh(new THREE.CircleGeometry(0.55, 16), new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.28, depthWrite: false }));
    sh.rotation.x = -Math.PI / 2; sh.position.y = 0.09; this.group.add(sh);
  }

  setPosition(x, z) { this.pos.set(x, 0, z); }

  // dirX/dirZ: desired world-space direction (length 0..1).
  update(dt, dirX, dirZ, run, world) {
    const len = Math.hypot(dirX, dirZ);
    let moving = 0;
    if (len > 0.01) {
      const sp = (run ? 6.5 : 3.4) * Math.min(1, len);
      this.pos.x += (dirX / len) * sp * dt;
      this.pos.z += (dirZ / len) * sp * dt;
      const target = Math.atan2(dirX, dirZ);
      let diff = target - this.heading;
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;
      this.heading += diff * Math.min(1, dt * 14);
      this.speed = sp; moving = Math.min(1, sp / 3.4);
      this.phase += sp * dt * 2.2;
    } else { this.speed = 0; }
    world.resolve(this.pos, this.radius);
    this.group.rotation.y = this.heading;
    const sw = Math.sin(this.phase) * 0.8 * moving;
    this.legL.rotation.x = sw; this.legR.rotation.x = -sw;
    this.armL.rotation.x = -sw; this.armR.rotation.x = sw;
    if (!moving) { this.legL.rotation.x *= 0.8; this.legR.rotation.x *= 0.8; }
  }
}
