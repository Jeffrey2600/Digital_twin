// Stylised 3D village built with Three.js primitives
const Twin = (() => {
  let scene, camera, renderer, controls, raycaster, mouse, clickables = [], farmMeshes = [], beacons = [], drone, water;
  const COLORS = { health: 0xf5566c, school: 0xf5b041, gov: 0x38bdf8, water: 0x5dade2, lake: 0x2e86c1, solar: 0x1f3a5f, market: 0xaf7ac5, tower: 0xd0d3d4 };
  const STATUS = { ok: 0x2dd4a7, warn: 0xf5b041, alert: 0xf5566c };

  function mat(color, opts = {}) { return new THREE.MeshStandardMaterial({ color, roughness: 0.8, metalness: 0.05, ...opts }); }

  function house(x, z, s = 1, color = 0xe8dcc8) {
    const g = new THREE.Group();
    const body = new THREE.Mesh(new THREE.BoxGeometry(3 * s, 2.2 * s, 3 * s), mat(color));
    body.position.y = 1.1 * s; body.castShadow = body.receiveShadow = true;
    const roof = new THREE.Mesh(new THREE.ConeGeometry(2.5 * s, 1.6 * s, 4), mat(0xb5523b));
    roof.position.y = 3 * s; roof.rotation.y = Math.PI / 4; roof.castShadow = true;
    g.add(body, roof); g.position.set(x, 0, z); return g;
  }

  function tree(x, z) {
    const g = new THREE.Group();
    const t = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.3, 1.6), mat(0x6e4b2a)); t.position.y = 0.8;
    const h = 1.4 + Math.random() * 0.9;
    const c = new THREE.Mesh(new THREE.SphereGeometry(h, 7, 6), mat(0x2f8a4a)); c.position.y = 1.6 + h * 0.7; c.castShadow = true;
    g.add(t, c); g.position.set(x, 0, z); return g;
  }

  function coconut(x, z) {
    const g = new THREE.Group();
    const t = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.22, 5), mat(0x8b6b45)); t.position.y = 2.5; t.rotation.z = 0.08;
    g.add(t);
    for (let i = 0; i < 6; i++) {
      const l = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.05, 0.5), mat(0x3f9b52));
      l.position.set(Math.cos(i) * 1, 4.9, Math.sin(i) * 1); l.rotation.y = -i; l.rotation.z = -0.35;
      g.add(l);
    }
    g.position.set(x, 0, z); return g;
  }

  function asset(a) {
    const g = new THREE.Group();
    const c = COLORS[a.type];
    if (a.type === "lake") {
      water = new THREE.Mesh(new THREE.CircleGeometry(11, 40), mat(c, { roughness: 0.15, metalness: 0.4, transparent: true, opacity: 0.9 }));
      water.rotation.x = -Math.PI / 2; water.position.y = 0.06; water.scale.set(1.3, 0.8, 1); g.add(water);
    } else if (a.type === "solar") {
      for (let i = 0; i < 4; i++) for (let j = 0; j < 3; j++) {
        const p = new THREE.Mesh(new THREE.BoxGeometry(3.4, 0.15, 2), mat(c, { metalness: 0.7, roughness: 0.25, emissive: 0x0a2540 }));
        p.position.set(i * 4 - 6, 1, j * 3 - 3); p.rotation.x = -0.45; p.castShadow = true; g.add(p);
      }
    } else if (a.type === "tower") {
      const m = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.6, 14, 6), mat(c, { metalness: 0.6 })); m.position.y = 7; g.add(m);
      const d = new THREE.Mesh(new THREE.SphereGeometry(0.7), mat(0x38bdf8, { emissive: 0x38bdf8, emissiveIntensity: 0.8 })); d.position.y = 14.4; g.add(d);
    } else if (a.id === "TANK") {
      const legs = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 1.2, 8, 8), mat(0x9aa5ad)); legs.position.y = 4; g.add(legs);
      const t = new THREE.Mesh(new THREE.CylinderGeometry(3, 3, 3.2, 20), mat(0xdfe6e9)); t.position.y = 9.6; t.castShadow = true; g.add(t);
    } else if (a.id === "WELL") {
      for (let i = 0; i < 3; i++) { const w = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 0.9, 1.4, 12), mat(0x7f8c8d)); w.position.set(i * 3 - 3, 0.7, 0); g.add(w); }
    } else {
      const big = { health: [7, 4, 6], school: [10, 4, 6], gov: [8, 5, 8], market: [9, 2.6, 7] }[a.type];
      const b = new THREE.Mesh(new THREE.BoxGeometry(...big), mat(0xf2ede4)); b.position.y = big[1] / 2; b.castShadow = b.receiveShadow = true; g.add(b);
      const r = new THREE.Mesh(new THREE.BoxGeometry(big[0] + 0.6, 0.5, big[2] + 0.6), mat(c)); r.position.y = big[1] + 0.25; g.add(r);
      if (a.type === "gov") { const f = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 5), mat(0xffffff)); f.position.set(0, big[1] + 2.5, 0); g.add(f);
        const fl = new THREE.Mesh(new THREE.BoxGeometry(1.8, 1.1, 0.05), mat(0xff9933)); fl.position.set(0.9, big[1] + 4.4, 0); g.add(fl); }
    }
    // status beacon
    const bc = new THREE.Mesh(new THREE.SphereGeometry(0.55, 16, 16), new THREE.MeshBasicMaterial({ color: STATUS[a.status] }));
    const top = { tower: 16, lake: 4, water: a.id === "TANK" ? 13 : 3.5 }[a.type] || 7.5;
    bc.position.y = top; g.add(bc);
    const ring = new THREE.Mesh(new THREE.RingGeometry(0.8, 1, 32), new THREE.MeshBasicMaterial({ color: STATUS[a.status], transparent: true, side: THREE.DoubleSide }));
    ring.position.y = top; g.add(ring);
    beacons.push({ bc, ring, status: a.status });

    g.position.set(a.x, 0, a.z);
    g.traverse(o => { if (o.isMesh) { o.userData = { kind: "asset", data: a }; clickables.push(o); } });
    return g;
  }

  function farm(f) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(f.w, 0.3, f.d), mat(0x6aa84f));
    m.position.set(f.x, 0.15, f.z); m.receiveShadow = true;
    m.userData = { kind: "farm", data: f }; clickables.push(m); farmMeshes.push(m);
    // crop rows
    const rows = new THREE.Group();
    for (let i = -f.w / 2 + 1; i < f.w / 2; i += 1.4) {
      const r = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.6, f.d - 1.5), mat(0x3d7d2c));
      r.position.set(f.x + i, 0.5, f.z); rows.add(r);
    }
    return [m, rows];
  }

  function road(x, z, w, d) {
    const r = new THREE.Mesh(new THREE.BoxGeometry(w, 0.1, d), mat(0x3b3f45)); r.position.set(x, 0.05, z); r.receiveShadow = true; return r;
  }

  function init(el, onPick) {
    scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0x0b1e2e, 110, 220);
    camera = new THREE.PerspectiveCamera(45, el.clientWidth / el.clientHeight, 0.1, 500);
    camera.position.set(70, 62, 78);
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    renderer.setSize(el.clientWidth, el.clientHeight);
    renderer.shadowMap.enabled = true;
    el.appendChild(renderer.domElement);

    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true; controls.maxPolarAngle = Math.PI / 2.2; controls.minDistance = 30; controls.maxDistance = 170;
    controls.autoRotate = true; controls.autoRotateSpeed = 0.4;
    renderer.domElement.addEventListener("pointerdown", () => (controls.autoRotate = false));

    scene.add(new THREE.HemisphereLight(0xcfe8ff, 0x1d3b2a, 0.7));
    const sun = new THREE.DirectionalLight(0xfff1d6, 1.0);
    sun.position.set(60, 90, 30); sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    Object.assign(sun.shadow.camera, { left: -80, right: 80, top: 80, bottom: -80 });
    scene.add(sun);

    const ground = new THREE.Mesh(new THREE.CylinderGeometry(72, 74, 3, 64), mat(0x4e7a3a));
    ground.position.y = -1.5; ground.receiveShadow = true; scene.add(ground);
    const edge = new THREE.Mesh(new THREE.CylinderGeometry(74, 70, 6, 64), mat(0x5a3f2b)); edge.position.y = -6; scene.add(edge);

    scene.add(road(0, 0, 130, 4), road(0, 0, 4, 130), road(-18, 0, 3, 50));
    DATA.assets.forEach(a => scene.add(asset(a)));
    DATA.farms.forEach(f => scene.add(...farm(f)));

    const rand = seeded(7);
    const occupied = (x, z) => DATA.assets.some(a => Math.hypot(a.x - x, a.z - z) < 11) || DATA.farms.some(f => Math.abs(f.x - x) < f.w / 2 + 3 && Math.abs(f.z - z) < f.d / 2 + 3) || Math.abs(x) < 4 || Math.abs(z) < 4;
    let placed = 0;
    for (let i = 0; i < 400 && placed < 46; i++) {
      const x = (rand() - 0.5) * 70, z = (rand() - 0.5) * 70;
      if (occupied(x, z)) continue;
      const cols = [0xe8dcc8, 0xf3e5ab, 0xd6e4f0, 0xf6d7c3];
      const h = house(x, z, 0.8 + rand() * 0.4, cols[i % 4]); h.rotation.y = rand() * Math.PI; scene.add(h); placed++;
    }
    for (let i = 0; i < 260; i++) {
      const a = rand() * Math.PI * 2, r = 20 + rand() * 50, x = Math.cos(a) * r, z = Math.sin(a) * r;
      if (Math.hypot(x, z) > 68 || occupied(x, z)) continue;
      scene.add(rand() > 0.5 ? tree(x, z) : coconut(x, z));
    }

    // Survey drone
    drone = new THREE.Group();
    const body = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.4, 1.6), mat(0x222831, { metalness: 0.6 }));
    drone.add(body);
    [[1, 1], [1, -1], [-1, 1], [-1, -1]].forEach(([a, b]) => { const p = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.8, 0.05, 16), new THREE.MeshBasicMaterial({ color: 0x9ad1ff, transparent: true, opacity: 0.5 })); p.position.set(a, 0.3, b); drone.add(p); });
    const light = new THREE.Mesh(new THREE.SphereGeometry(0.2), new THREE.MeshBasicMaterial({ color: 0xff3355 })); light.position.y = -0.3; drone.add(light);
    const cone = new THREE.Mesh(new THREE.ConeGeometry(5, 18, 24, 1, true), new THREE.MeshBasicMaterial({ color: 0x2dd4a7, transparent: true, opacity: 0.08, side: THREE.DoubleSide }));
    cone.position.y = -9; drone.add(cone);
    scene.add(drone);

    raycaster = new THREE.Raycaster(); mouse = new THREE.Vector2();
    renderer.domElement.addEventListener("click", e => {
      const r = renderer.domElement.getBoundingClientRect();
      mouse.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
      raycaster.setFromCamera(mouse, camera);
      const hit = raycaster.intersectObjects(clickables)[0];
      if (hit) onPick(hit.object.userData);
    });
    new ResizeObserver(() => { camera.aspect = el.clientWidth / el.clientHeight; camera.updateProjectionMatrix(); renderer.setSize(el.clientWidth, el.clientHeight); }).observe(el);
    animate();
  }

  function animate(t = 0) {
    requestAnimationFrame(animate);
    const s = t / 1000;
    beacons.forEach((b, i) => {
      const k = 1 + ((s * (b.status === "alert" ? 1.6 : 0.8) + i * 0.3) % 1) * 3;
      b.ring.scale.set(k, k, k); b.ring.material.opacity = 1 - (k - 1) / 3;
      b.ring.lookAt(camera.position);
    });
    drone.position.set(Math.cos(s * 0.25) * 42, 20 + Math.sin(s * 1.3) * 0.6, Math.sin(s * 0.25) * 42);
    drone.rotation.y = -s * 0.25;
    if (water) water.material.emissive = new THREE.Color(0x0a3a5a).multiplyScalar(0.5 + Math.sin(s * 2) * 0.2);
    controls.update(); renderer.render(scene, camera);
  }

  function setLayer(layer) {
    farmMeshes.forEach(m => {
      const f = m.userData.data;
      let c = 0x6aa84f;
      if (layer === "ndvi") c = new THREE.Color().setHSL(f.health * 0.33, 0.8, 0.45).getHex();
      if (layer === "alerts") c = f.moisture < 40 ? 0xf5566c : f.moisture < 50 ? 0xf5b041 : 0x3d6b4a;
      m.material.color.setHex(c);
    });
    beacons.forEach(b => (b.bc.visible = b.ring.visible = layer !== "ndvi"));
  }

  return { init, setLayer };
})();
