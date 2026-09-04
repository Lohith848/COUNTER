/**
 * Fight3D — Coordinates Three.js WebGL renderer, Championship Ring, Fighters,
 * Camera effects (shake, zoom), and 90s Arcade visual particle FX (comic sparks, shockwaves).
 */

import * as THREE from 'three';
import Ring3D from './Ring3D.js';
import Boxer3D, { BOXER } from './Boxer3D.js';

export const VIEW = {
  width: 1280,
  height: 720,
  fov: 46,
  camPos: new THREE.Vector3(0, 380, 850),
  lookAt: new THREE.Vector3(0, 250, -60)
};

export { BOXER };

export default class Fight3D {
  constructor(container) {
    this.container = container;

    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: false,
      preserveDrawingBuffer: true,
      powerPreference: 'high-performance'
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.setSize(VIEW.width, VIEW.height, false);
    this.renderer.setClearColor(0x0a0d14, 1);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(this.renderer.domElement);

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(VIEW.fov, VIEW.width / VIEW.height, 1, 5000);
    this.camHome = VIEW.camPos.clone();
    this.lookTarget = VIEW.lookAt.clone();
    this.camera.position.copy(this.camHome);
    this.camera.lookAt(this.lookTarget);

    this.ring = new Ring3D(this.scene);

    // Camera dynamics
    this.shakeMag = 0;
    this._shakeSeed = Math.random() * 100;
    this.zoomFactor = 1.0;
    this.targetZoom = 1.0;

    // --- 90s ARCADE SPARK FX POOL ---
    this.sparks = [];
    const sparkGeo = new THREE.OctahedronGeometry(12, 0);
    for (let i = 0; i < 64; i++) {
      const m = new THREE.Mesh(
        sparkGeo,
        new THREE.MeshBasicMaterial({
          color: 0xffffff,
          transparent: true,
          opacity: 0,
          blending: THREE.AdditiveBlending,
          depthWrite: false
        })
      );
      m.visible = false;
      this.scene.add(m);
      this.sparks.push({ mesh: m, vel: new THREE.Vector3(), life: 0, maxLife: 0, spin: 0 });
    }

    // --- SHOCKWAVE EXPANSION RINGS ---
    this.shockwaves = [];
    const shockGeo = new THREE.RingGeometry(15, 24, 32);
    for (let i = 0; i < 8; i++) {
      const m = new THREE.Mesh(
        shockGeo,
        new THREE.MeshBasicMaterial({
          color: 0x00ffff,
          transparent: true,
          opacity: 0,
          side: THREE.DoubleSide,
          blending: THREE.AdditiveBlending,
          depthWrite: false
        })
      );
      m.visible = false;
      this.scene.add(m);
      this.shockwaves.push({ mesh: m, life: 0, maxLife: 0, growth: 0 });
    }

    // --- BLOB SHADOWS UNDER FIGHTERS ---
    this._blobGeo = new THREE.CircleGeometry(60, 32);
    this._blobs = [];

    this._v = new THREE.Vector3();
    this._v2 = new THREE.Vector3();
    this.active = true;
  }

  makeBlobShadow() {
    const m = new THREE.Mesh(
      this._blobGeo,
      new THREE.MeshBasicMaterial({
        color: 0x000000,
        transparent: true,
        opacity: 0.58,
        depthWrite: false
      })
    );
    m.rotation.x = -Math.PI / 2;
    m.position.y = 0.8;
    m.renderOrder = 1;
    this.scene.add(m);
    this._blobs.push(m);
    return m;
  }

  removeBlobShadow(m) {
    const i = this._blobs.indexOf(m);
    if (i >= 0) this._blobs.splice(i, 1);
    this.scene.remove(m);
  }

  // ---------------------------------------------------------------
  // PER-FRAME UPDATE
  // ---------------------------------------------------------------
  update(dt) {
    if (!this.active) return;

    // Update Championship Ring environment (spotlights + flashbulbs)
    if (this.ring && this.ring.update) {
      this.ring.update(dt);
    }

    // Camera Zoom lerp
    this.zoomFactor += (this.targetZoom - this.zoomFactor) * Math.min(1, dt * 10);

    // Camera Shake
    if (this.shakeMag > 0.01) {
      this._shakeSeed += dt * 42;
      const s = this.shakeMag;
      this.camera.position.x = this.camHome.x + Math.sin(this._shakeSeed * 1.8) * s * 28;
      this.camera.position.y = this.camHome.y + Math.cos(this._shakeSeed * 2.4) * s * 16;
      this.camera.position.z = this.camHome.z / this.zoomFactor;
      this.shakeMag *= 0.85;
    } else {
      if (this.shakeMag !== 0) this.shakeMag = 0;
      this.camera.position.set(this.camHome.x, this.camHome.y, this.camHome.z / this.zoomFactor);
    }
    this.camera.lookAt(this.lookTarget);

    // Update Spark Particles
    for (let i = 0; i < this.sparks.length; i++) {
      const sp = this.sparks[i];
      if (sp.life <= 0) continue;
      sp.life -= dt;
      if (sp.life <= 0) {
        sp.mesh.visible = false;
        sp.mesh.material.opacity = 0;
        continue;
      }
      const f = sp.life / sp.maxLife;
      sp.mesh.position.addScaledVector(sp.vel, dt);
      sp.mesh.rotation.x += sp.spin * dt;
      sp.mesh.rotation.y += sp.spin * 1.4 * dt;
      const sc = (1 - f) * 1.8 + 0.3;
      sp.mesh.scale.setScalar(sc);
      sp.mesh.material.opacity = Math.min(1, f * 2.2);
      sp.mesh.position.y -= dt * 420; // Gravity drop
    }

    // Update Shockwave Rings
    for (let i = 0; i < this.shockwaves.length; i++) {
      const sw = this.shockwaves[i];
      if (sw.life <= 0) continue;
      sw.life -= dt;
      if (sw.life <= 0) {
        sw.mesh.visible = false;
        sw.mesh.material.opacity = 0;
        continue;
      }
      const f = sw.life / sw.maxLife;
      const sc = 1 + (1 - f) * sw.growth;
      sw.mesh.scale.set(sc, sc, sc);
      sw.mesh.material.opacity = f * 0.9;
    }

    this.renderer.render(this.scene, this.camera);
  }

  shake(intensity) {
    this.shakeMag = Math.min(3.5, Math.max(this.shakeMag, intensity));
  }

  setZoom(z) {
    this.targetZoom = z;
  }

  setActive(v) {
    this.active = v;
  }

  // ---------------------------------------------------------------
  // 90s RETRO ARCADE IMPACT FX
  // ---------------------------------------------------------------
  hitSpark(worldPos, color = 0xffe600, power = 1, count = 10) {
    let used = 0;
    for (let i = 0; i < this.sparks.length && used < count; i++) {
      const sp = this.sparks[i];
      if (sp.life > 0) continue;
      used++;
      sp.mesh.visible = true;
      sp.mesh.material.color.setHex(color);
      sp.mesh.position.copy(worldPos);
      sp.mesh.position.y += 35;
      sp.maxLife = 0.36 + Math.random() * 0.22;
      sp.life = sp.maxLife;
      const a = Math.random() * Math.PI * 2;
      sp.vel.set(
        Math.cos(a) * 290 * power,
        340 * power * (0.6 + Math.random() * 0.7),
        Math.sin(a) * 290 * power
      );
      sp.spin = 5 + Math.random() * 12;
    }
  }

  shockwave(worldPos, color = 0x00ffff, growth = 8) {
    for (let i = 0; i < this.shockwaves.length; i++) {
      const sw = this.shockwaves[i];
      if (sw.life > 0) continue;
      sw.mesh.visible = true;
      sw.mesh.material.color.setHex(color);
      sw.mesh.position.copy(worldPos);
      sw.mesh.position.y += 40;
      sw.mesh.rotation.y = Math.random() * Math.PI;
      sw.maxLife = 0.45;
      sw.life = 0.45;
      sw.growth = growth;
      sw.mesh.scale.set(1, 1, 1);
      break;
    }
  }

  impactGlow(worldPos, color = 0xffddaa, radius = 280) {
    const light = new THREE.PointLight(color, 950, radius, 1.8);
    light.position.copy(worldPos);
    light.position.y += 60;
    this.scene.add(light);
    const t0 = performance.now();
    const kill = () => {
      const t = (performance.now() - t0) / 1000;
      light.intensity = Math.max(0, 950 * (1 - t * 2.5));
      if (t > 0.4) {
        this.scene.remove(light);
        light.dispose();
        return;
      }
      requestAnimationFrame(kill);
    };
    kill();
  }

  // ---------------------------------------------------------------
  // COORDINATE HELPERS (World <-> Screen)
  // ---------------------------------------------------------------
  toScreen(world) {
    this._v.copy(world);
    this._v.project(this.camera);
    return {
      x: (this._v.x * 0.5 + 0.5) * VIEW.width,
      y: (-this._v.y * 0.5 + 0.5) * VIEW.height
    };
  }

  toWorld(x2d, y2d, h = 0) {
    this._v2.set(x2d - 640, h, y2d - 560);
    return this._v2;
  }

  destroy() {
    this.renderer.dispose();
    if (this.renderer.domElement.parentNode === this.container) {
      this.container.removeChild(this.renderer.domElement);
    }
    this._blobs.forEach((b) => {
      b.material.dispose();
      this.scene.remove(b);
    });
    this._blobs = [];
    this._blobGeo.dispose();

    this.scene.traverse((o) => {
      if (o.geometry) o.geometry.dispose();
      if (o.material) {
        const mats = Array.isArray(o.material) ? o.material : [o.material];
        mats.forEach((m) => {
          if (m.map) m.map.dispose();
          m.dispose();
        });
      }
    });
  }
}
