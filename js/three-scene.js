/* ==========================================================================
   WILD & ALIVE — Hero 3D scene
   Low-poly floating forest: particle dust, fireflies, drifting rock/tree
   geometry, soft fog, mouse-parallax camera. Never covers hero copy —
   canvas sits behind text via z-index/CSS, geometry kept subtle/dark.
   ========================================================================== */

import * as THREE from 'https://unpkg.com/three@0.160.0/build/three.module.js';

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export function initHeroScene(canvasSelector = '#hero-canvas') {
  const canvas = document.querySelector(canvasSelector);
  if (!canvas || !window.WebGLRenderingContext) return;

  let width = canvas.clientWidth, height = canvas.clientHeight;

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(width, height);

  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x07130e, 0.045);

  const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 100);
  camera.position.set(0, 0.6, 9);

  scene.add(new THREE.AmbientLight(0x4caf50, 0.6));
  const key = new THREE.DirectionalLight(0xffc857, 1.1);
  key.position.set(4, 6, 5);
  scene.add(key);
  const rim = new THREE.PointLight(0x145c44, 1.4, 20);
  rim.position.set(-6, 2, -4);
  scene.add(rim);

  /* ---- dust / spore particle field ---- */
  const PARTICLE_COUNT = 260;
  const positions = new Float32Array(PARTICLE_COUNT * 3);
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    positions[i * 3] = (Math.random() - 0.5) * 22;
    positions[i * 3 + 1] = (Math.random() - 0.5) * 12;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 18;
  }
  const particleGeo = new THREE.BufferGeometry();
  particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const particleMat = new THREE.PointsMaterial({ color: 0xdfe9df, size: 0.028, transparent: true, opacity: 0.55 });
  const particles = new THREE.Points(particleGeo, particleMat);
  scene.add(particles);

  /* ---- fireflies: emissive points that drift + pulse ---- */
  const FIREFLY_COUNT = 22;
  const fireflyGeo = new THREE.BufferGeometry();
  const fireflyPos = new Float32Array(FIREFLY_COUNT * 3);
  for (let i = 0; i < FIREFLY_COUNT; i++) {
    fireflyPos[i * 3] = (Math.random() - 0.5) * 14;
    fireflyPos[i * 3 + 1] = (Math.random() - 0.5) * 6 - 1;
    fireflyPos[i * 3 + 2] = (Math.random() - 0.5) * 10 + 2;
  }
  fireflyGeo.setAttribute('position', new THREE.BufferAttribute(fireflyPos, 3));
  const fireflyMat = new THREE.PointsMaterial({ color: 0xffc857, size: 0.09, transparent: true, opacity: 0.9 });
  const fireflies = new THREE.Points(fireflyGeo, fireflyMat);
  scene.add(fireflies);

  /* ---- low-poly floating rocks + trees ---- */
  const drifters = new THREE.Group();
  const rockMat = new THREE.MeshStandardMaterial({ color: 0x5c4033, roughness: 0.9, flatShading: true });
  const leafMat = new THREE.MeshStandardMaterial({ color: 0x0b3d2e, roughness: 0.75, flatShading: true });
  const trunkMat = new THREE.MeshStandardMaterial({ color: 0x3a2a1f, roughness: 0.9, flatShading: true });

  for (let i = 0; i < 6; i++) {
    const rock = new THREE.Mesh(new THREE.IcosahedronGeometry(0.4 + Math.random() * 0.5, 0), rockMat);
    rock.position.set((Math.random() - 0.5) * 12, (Math.random() - 0.5) * 5 - 1, (Math.random() - 0.5) * 8 - 2);
    rock.rotation.set(Math.random(), Math.random(), Math.random());
    rock.userData.spin = (Math.random() - 0.5) * 0.15;
    drifters.add(rock);
  }
  for (let i = 0; i < 5; i++) {
    const tree = new THREE.Group();
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.09, 0.6, 6), trunkMat);
    const canopy = new THREE.Mesh(new THREE.ConeGeometry(0.5, 1.1, 7), leafMat);
    canopy.position.y = 0.75;
    tree.add(trunk, canopy);
    tree.position.set((Math.random() - 0.5) * 14, (Math.random() - 0.5) * 5 - 2, (Math.random() - 0.5) * 9 - 3);
    tree.userData.spin = (Math.random() - 0.5) * 0.08;
    drifters.add(tree);
  }
  scene.add(drifters);

  /* ---- mouse parallax ---- */
  let targetX = 0, targetY = 0;
  window.addEventListener('mousemove', (e) => {
    targetX = (e.clientX / window.innerWidth - 0.5) * 2;
    targetY = (e.clientY / window.innerHeight - 0.5) * 2;
  });

  function resize() {
    width = canvas.clientWidth; height = canvas.clientHeight;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height, false);
  }
  window.addEventListener('resize', resize);

  let running = true;
  const io = new IntersectionObserver(([entry]) => { running = entry.isIntersecting; }, { threshold: 0.05 });
  io.observe(canvas);
  document.addEventListener('visibilitychange', () => { if (document.hidden) running = false; else if (!io.takeRecords) running = true; });

  const clock = new THREE.Clock();
  function animate() {
    requestAnimationFrame(animate);
    if (!running) return;
    const t = clock.getElapsedTime();

    camera.position.x += (targetX * 1.4 - camera.position.x) * 0.04;
    camera.position.y += (0.6 - targetY * 0.8 - camera.position.y) * 0.04;
    camera.lookAt(0, 0, -2);

    if (!reducedMotion) {
      particles.rotation.y = t * 0.015;
      fireflies.rotation.y = -t * 0.02;
      fireflyMat.opacity = 0.6 + Math.sin(t * 2) * 0.3;
      drifters.children.forEach((d, i) => {
        d.rotation.y += d.userData.spin * 0.01;
        d.position.y += Math.sin(t * 0.5 + i) * 0.0009;
      });
    }
    renderer.render(scene, camera);
  }
  animate();

  if (reducedMotion) renderer.render(scene, camera);
}
