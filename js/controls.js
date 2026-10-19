// Touch + keyboard input. Left zone = floating joystick, right zone = camera drag.
export class Controls {
  constructor(els) {
    this.joy = { x: 0, y: 0 };
    this.lookX = 0; this.lookY = 0;
    this.runToggle = false;
    this._interact = false; this._map = false; this._menu = false;
    this.sens = 1;
    this.keys = new Set();
    this.els = els;
    this._setupJoystick(els.stickZone, els.stickBase, els.stickKnob);
    this._setupLook(els.lookZone);
    els.btnRun.addEventListener('pointerdown', e => { e.preventDefault(); this.runToggle = !this.runToggle; els.btnRun.classList.toggle('on', this.runToggle); });
    els.btnAct.addEventListener('pointerdown', e => { e.preventDefault(); this._interact = true; });
    els.btnMap.addEventListener('pointerdown', e => { e.preventDefault(); this._map = true; });
    els.btnMenu.addEventListener('pointerdown', e => { e.preventDefault(); this._menu = true; });
    els.mini.addEventListener('pointerdown', e => { e.preventDefault(); this._map = true; });
    window.addEventListener('keydown', e => {
      const k = e.key.toLowerCase();
      if (!e.repeat) {
        if (k === 'e') this._interact = true;
        if (k === 'm') this._map = true;
        if (k === 'escape') this._menu = true;
      }
      this.keys.add(k);
    });
    window.addEventListener('keyup', e => this.keys.delete(e.key.toLowerCase()));
    window.addEventListener('blur', () => this.reset());
    // Block page scrolling/zooming gestures during play.
    document.addEventListener('touchmove', e => { if (!e.target.closest('#panelBody,.panelCard')) e.preventDefault(); }, { passive: false });
    document.addEventListener('contextmenu', e => e.preventDefault());
  }

  _setupJoystick(zone, base, knob) {
    let id = null, ox = 0, oy = 0;
    const R = 50;
    zone.addEventListener('pointerdown', e => {
      if (id !== null) return;
      id = e.pointerId; zone.setPointerCapture(id);
      const r = zone.getBoundingClientRect();
      ox = e.clientX; oy = e.clientY;
      base.style.display = 'block';
      base.style.left = (ox - r.left) + 'px'; base.style.top = (oy - r.top) + 'px';
      knob.style.transform = 'translate(0px,0px)';
      e.preventDefault();
    });
    zone.addEventListener('pointermove', e => {
      if (e.pointerId !== id) return;
      let dx = e.clientX - ox, dy = e.clientY - oy;
      const d = Math.hypot(dx, dy);
      if (d > R) { dx *= R / d; dy *= R / d; }
      knob.style.transform = 'translate(' + dx + 'px,' + dy + 'px)';
      this.joy.x = dx / R; this.joy.y = dy / R;
    });
    const end = e => {
      if (e.pointerId !== id) return;
      id = null; this.joy.x = 0; this.joy.y = 0; base.style.display = 'none';
    };
    zone.addEventListener('pointerup', end);
    zone.addEventListener('pointercancel', end);
    zone.addEventListener('lostpointercapture', end);
  }

  _setupLook(zone) {
    let id = null, lx = 0, ly = 0;
    zone.addEventListener('pointerdown', e => {
      if (id !== null) return;
      id = e.pointerId; zone.setPointerCapture(id); lx = e.clientX; ly = e.clientY; e.preventDefault();
    });
    zone.addEventListener('pointermove', e => {
      if (e.pointerId !== id) return;
      this.lookX += e.clientX - lx; this.lookY += e.clientY - ly; lx = e.clientX; ly = e.clientY;
    });
    const end = e => { if (e.pointerId === id) id = null; };
    zone.addEventListener('pointerup', end);
    zone.addEventListener('pointercancel', end);
    zone.addEventListener('lostpointercapture', end);
  }

  // Combined movement vector (screen space: x right, y down), length <= 1.
  getMove() {
    let x = this.joy.x, y = this.joy.y;
    const k = this.keys;
    if (k.has('a') || k.has('arrowleft')) x -= 1;
    if (k.has('d') || k.has('arrowright')) x += 1;
    if (k.has('w') || k.has('arrowup')) y -= 1;
    if (k.has('s') || k.has('arrowdown')) y += 1;
    const len = Math.hypot(x, y);
    if (len < 0.12) return { x: 0, y: 0 };
    if (len > 1) { x /= len; y /= len; }
    return { x, y };
  }
  get run() { return this.runToggle || this.keys.has('shift'); }
  consumeLook() { const r = { x: this.lookX * this.sens, y: this.lookY * this.sens }; this.lookX = 0; this.lookY = 0; return r; }
  consumeInteract() { const v = this._interact; this._interact = false; return v; }
  consumeMap() { const v = this._map; this._map = false; return v; }
  consumeMenu() { const v = this._menu; this._menu = false; return v; }
  reset() { this.joy.x = this.joy.y = 0; this.lookX = this.lookY = 0; this.keys.clear(); this._interact = this._map = this._menu = false; this.els.stickBase.style.display = 'none'; }
}
