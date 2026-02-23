import * as THREE from 'three';

const MAX_PARTICLES = 500;

// Scales world-space particle size to screen-space gl_PointSize.
// Tuned so a 0.1-unit radius particle at ~10 m appears ~8 px tall.
const SIZE_ATTENUATION = 800.0;

export class Particles {
  constructor(scene) {
    this.scene = scene;
    this.activePopups = [];

    // Per-particle CPU state
    this._data = [];
    for (let i = 0; i < MAX_PARTICLES; i++) {
      this._data.push({
        active: false,
        life: 0,
        maxLife: 0,
        vx: 0, vy: 0, vz: 0,
        gravity: 0,
      });
    }

    // GPU buffers – marked dynamic for frequent updates
    this._positions = new Float32Array(MAX_PARTICLES * 3);
    this._colors    = new Float32Array(MAX_PARTICLES * 3);
    this._sizes     = new Float32Array(MAX_PARTICLES);
    this._opacities = new Float32Array(MAX_PARTICLES);

    const geo = new THREE.BufferGeometry();
    this._posAttr  = new THREE.BufferAttribute(this._positions, 3);
    this._colAttr  = new THREE.BufferAttribute(this._colors,    3);
    this._sizeAttr = new THREE.BufferAttribute(this._sizes,     1);
    this._opacAttr = new THREE.BufferAttribute(this._opacities, 1);

    this._posAttr.setUsage(THREE.DynamicDrawUsage);
    this._colAttr.setUsage(THREE.DynamicDrawUsage);
    this._sizeAttr.setUsage(THREE.DynamicDrawUsage);
    this._opacAttr.setUsage(THREE.DynamicDrawUsage);

    geo.setAttribute('position', this._posAttr);
    geo.setAttribute('aColor',   this._colAttr);
    geo.setAttribute('aSize',    this._sizeAttr);
    geo.setAttribute('aOpacity', this._opacAttr);

    // Custom shader: per-particle size, opacity and circular clipping
    const mat = new THREE.ShaderMaterial({
      vertexShader: `
        attribute vec3  aColor;
        attribute float aSize;
        attribute float aOpacity;
        varying vec3  vColor;
        varying float vOpacity;
        uniform float uSizeAttenuation;
        void main() {
          vColor   = aColor;
          vOpacity = aOpacity;
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = aSize * (uSizeAttenuation / -mvPosition.z);
          gl_Position  = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        varying vec3  vColor;
        varying float vOpacity;
        void main() {
          vec2  cxy = 2.0 * gl_PointCoord - 1.0;
          float r   = dot(cxy, cxy);
          if (r > 1.0) discard;
          gl_FragColor = vec4(vColor, vOpacity * (1.0 - r * 0.5));
        }
      `,
      transparent: true,
      depthWrite:  false,
      uniforms: { uSizeAttenuation: { value: SIZE_ATTENUATION } },
    });

    this._points = new THREE.Points(geo, mat);
    scene.add(this._points);

    // Reusable Color to avoid per-spawn allocation
    this._tmpColor = new THREE.Color();
  }

  // ── Internal helpers ──────────────────────────────────────────────────────

  _getSlot() {
    for (let i = 0; i < MAX_PARTICLES; i++) {
      if (!this._data[i].active) return i;
    }
    return -1;
  }

  _spawn({ position, velocity, color, size, life, gravity }) {
    const i = this._getSlot();
    if (i === -1) return;

    const d = this._data[i];
    d.active  = true;
    d.life    = life;
    d.maxLife = life;
    d.vx      = velocity.x;
    d.vy      = velocity.y;
    d.vz      = velocity.z;
    d.gravity = gravity || 0;

    // Values are copied into typed arrays immediately; no reference is kept.
    this._positions[i * 3]     = position.x;
    this._positions[i * 3 + 1] = position.y;
    this._positions[i * 3 + 2] = position.z;

    this._tmpColor.set(color);
    this._colors[i * 3]     = this._tmpColor.r;
    this._colors[i * 3 + 1] = this._tmpColor.g;
    this._colors[i * 3 + 2] = this._tmpColor.b;

    this._sizes[i]    = size;
    this._opacities[i] = 1.0;
  }

  // ── Public spawn API (matches original interface) ─────────────────────────

  spawnHitEffect(position, color = 0x00ddff) {
    for (let i = 0; i < 6; i++) {
      const dir = new THREE.Vector3(
        (Math.random() - 0.5) * 2,
        (Math.random() - 0.5) * 2,
        (Math.random() - 0.5) * 2,
      ).normalize();

      this._spawn({
        position,
        velocity: dir.multiplyScalar(3 + Math.random() * 3),
        color,
        size: 0.05 + Math.random() * 0.08,
        life: 0.2 + Math.random() * 0.2,
        gravity: -2,
      });
    }
  }

  spawnExplosion(position, color = 0xff8800) {
    const count = 20;
    for (let i = 0; i < count; i++) {
      const dir = new THREE.Vector3(
        (Math.random() - 0.5) * 2,
        Math.random(),
        (Math.random() - 0.5) * 2,
      ).normalize();

      const speed  = 2 + Math.random() * 6;
      const isCore = i < 5;

      this._spawn({
        position: position.clone().add(new THREE.Vector3(
          (Math.random() - 0.5) * 0.3,
          (Math.random() - 0.5) * 0.3,
          (Math.random() - 0.5) * 0.3,
        )),
        velocity: dir.multiplyScalar(speed),
        color: isCore ? 0xffffff : color,
        size: isCore ? 0.15 : 0.05 + Math.random() * 0.1,
        life: 0.3 + Math.random() * 0.4,
        gravity: -3,
      });
    }
  }

  spawnMuzzleFlash(position, direction) {
    for (let i = 0; i < 3; i++) {
      const spread = new THREE.Vector3(
        direction.x + (Math.random() - 0.5) * 0.3,
        direction.y + (Math.random() - 0.5) * 0.3,
        direction.z + (Math.random() - 0.5) * 0.3,
      ).normalize();

      this._spawn({
        position,
        velocity: spread.multiplyScalar(8 + Math.random() * 4),
        color: 0x00ccff,
        size: 0.03 + Math.random() * 0.04,
        life: 0.08 + Math.random() * 0.08,
        gravity: 0,
      });
    }
  }

  spawnScorePopup(position, points) {
    // Using a sprite for floating score text
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    ctx.font = 'bold 32px Courier New';
    ctx.fillStyle = '#ffff00';
    ctx.textAlign = 'center';
    ctx.fillText(`+${points}`, 64, 40);

    const texture = new THREE.CanvasTexture(canvas);
    const mat = new THREE.SpriteMaterial({ map: texture, transparent: true });
    const sprite = new THREE.Sprite(mat);
    sprite.position.copy(position);
    sprite.position.y += 0.5;
    sprite.scale.set(1.5, 0.75, 1);
    this.scene.add(sprite);

    this.activePopups.push({ sprite, mat, texture, elapsed: 0 });
  }

  // ── Update ────────────────────────────────────────────────────────────────

  update(dt) {
    let posChanged  = false;
    let opacChanged = false;

    for (let i = 0; i < MAX_PARTICLES; i++) {
      const d = this._data[i];
      if (!d.active) continue;

      d.life -= dt;
      if (d.life <= 0) {
        d.active = false;
        this._opacities[i] = 0;
        this._sizes[i]     = 0;
        opacChanged = true;
        continue;
      }

      // Drag
      const drag = 1 - dt * 2;
      d.vx *= drag;
      d.vy *= drag;
      d.vz *= drag;
      d.vy += d.gravity * dt;

      // Position
      this._positions[i * 3]     += d.vx * dt;
      this._positions[i * 3 + 1] += d.vy * dt;
      this._positions[i * 3 + 2] += d.vz * dt;

      // Fade
      this._opacities[i] = d.life / d.maxLife;

      posChanged  = true;
      opacChanged = true;
    }

    if (posChanged)  this._posAttr.needsUpdate  = true;
    if (opacChanged) this._opacAttr.needsUpdate = true;

    // Animate score popups in the main game loop
    for (let i = this.activePopups.length - 1; i >= 0; i--) {
      const popup = this.activePopups[i];
      popup.elapsed += dt;
      if (popup.elapsed >= 1) {
        this.scene.remove(popup.sprite);
        popup.texture.dispose();
        popup.mat.dispose();
        this.activePopups.splice(i, 1);
      } else {
        popup.sprite.position.y += 0.02 * dt * 60;
        popup.mat.opacity = 1 - popup.elapsed;
      }
    }
  }

  // ── Reset ─────────────────────────────────────────────────────────────────

  reset() {
    for (let i = 0; i < MAX_PARTICLES; i++) {
      if (this._data[i].active) {
        this._data[i].active = false;
        this._opacities[i]   = 0;
        this._sizes[i]       = 0;
      }
    }
    this._opacAttr.needsUpdate = true;
    this._sizeAttr.needsUpdate = true;

    for (const popup of this.activePopups) {
      this.scene.remove(popup.sprite);
      popup.texture.dispose();
      popup.mat.dispose();
    }
    this.activePopups.length = 0;
  }
}

