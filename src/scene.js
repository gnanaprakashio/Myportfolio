import * as THREE from 'three';

/* ---------- Background / hero 3D scene ---------- */
export function initScene(onProgress) {
  const canvas = document.getElementById('bg');
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);

  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x05060f, 0.045);

  const camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 100);
  camera.position.set(0, 0, 9);

  const isMobile = window.innerWidth < 800;

  /* lights */
  scene.add(new THREE.AmbientLight(0x6670ff, 0.6));
  const l1 = new THREE.PointLight(0x00e0ff, 60, 30); l1.position.set(5, 4, 5); scene.add(l1);
  const l2 = new THREE.PointLight(0x7c5cff, 70, 30); l2.position.set(-6, -3, 4); scene.add(l2);
  const l3 = new THREE.PointLight(0xff5cc8, 40, 30); l3.position.set(0, 6, -4); scene.add(l3);

  /* hero object group (sits right of the text on desktop) */
  const hero = new THREE.Group();
  hero.position.set(isMobile ? 0 : 3.6, isMobile ? 2.2 : 0, 0);
  hero.scale.setScalar(isMobile ? 0.7 : 1);
  scene.add(hero);

  // core: distorted icosahedron wireframe + glossy inner
  const coreGeo = new THREE.IcosahedronGeometry(1.5, 1);
  const core = new THREE.Mesh(coreGeo, new THREE.MeshStandardMaterial({
    color: 0x1a1f4a, metalness: 0.9, roughness: 0.25, flatShading: true, emissive: 0x2a1d7a, emissiveIntensity: 0.6
  }));
  hero.add(core);
  const wire = new THREE.Mesh(new THREE.IcosahedronGeometry(1.75, 1), new THREE.MeshBasicMaterial({
    color: 0x00e0ff, wireframe: true, transparent: true, opacity: 0.35
  }));
  hero.add(wire);

  // orbit rings
  const rings = [];
  const ringCfg = [
    { r: 2.5, c: 0x7c5cff, rx: 1.2, ry: 0.2 },
    { r: 3.1, c: 0x00e0ff, rx: 0.4, ry: 0.9 },
    { r: 3.7, c: 0xff5cc8, rx: 1.9, ry: 0.5 }
  ];
  ringCfg.forEach((cfg, i) => {
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(cfg.r, 0.012, 8, 160),
      new THREE.MeshBasicMaterial({ color: cfg.c, transparent: true, opacity: 0.7 })
    );
    ring.rotation.set(cfg.rx, cfg.ry, 0);
    const sat = new THREE.Mesh(
      new THREE.SphereGeometry(0.09 + i * 0.02, 16, 16),
      new THREE.MeshBasicMaterial({ color: cfg.c })
    );
    ring.add(sat);
    ring.userData = { sat, r: cfg.r, speed: 0.5 + i * 0.25, phase: i * 2 };
    hero.add(ring);
    rings.push(ring);
  });

  // floating cubes ("containers")
  const cubes = [];
  const cubeGeo = new THREE.BoxGeometry(0.38, 0.38, 0.38);
  for (let i = 0; i < 14; i++) {
    const m = new THREE.Mesh(cubeGeo, new THREE.MeshStandardMaterial({
      color: i % 3 === 0 ? 0x00e0ff : i % 3 === 1 ? 0x7c5cff : 0xff5cc8,
      metalness: 0.7, roughness: 0.3, transparent: true, opacity: 0.85
    }));
    const a = Math.random() * Math.PI * 2, rad = 4.5 + Math.random() * 7;
    m.position.set(Math.cos(a) * rad, (Math.random() - 0.5) * 12, -Math.random() * 8 - 1);
    m.userData = { rx: Math.random() * 0.01 + 0.002, ry: Math.random() * 0.01 + 0.002, fy: Math.random() * 1.5 + 0.5, oy: m.position.y };
    m.scale.setScalar(0.6 + Math.random() * 1.1);
    scene.add(m);
    cubes.push(m);
  }

  // particle field
  const count = isMobile ? 900 : 2200;
  const pos = new Float32Array(count * 3);
  const col = new Float32Array(count * 3);
  const palette = [new THREE.Color(0x7c5cff), new THREE.Color(0x00e0ff), new THREE.Color(0xff5cc8), new THREE.Color(0xffffff)];
  for (let i = 0; i < count; i++) {
    pos[i * 3] = (Math.random() - 0.5) * 40;
    pos[i * 3 + 1] = (Math.random() - 0.5) * 60;
    pos[i * 3 + 2] = (Math.random() - 0.5) * 30 - 5;
    const c = palette[Math.floor(Math.random() * palette.length)];
    col.set([c.r, c.g, c.b], i * 3);
  }
  const pg = new THREE.BufferGeometry();
  pg.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  pg.setAttribute('color', new THREE.BufferAttribute(col, 3));
  const points = new THREE.Points(pg, new THREE.PointsMaterial({
    size: 0.05, vertexColors: true, transparent: true, opacity: 0.8, sizeAttenuation: true, depthWrite: false
  }));
  scene.add(points);

  // interaction state
  const mouse = { x: 0, y: 0, tx: 0, ty: 0 };
  window.addEventListener('pointermove', (e) => {
    mouse.tx = (e.clientX / window.innerWidth - 0.5) * 2;
    mouse.ty = (e.clientY / window.innerHeight - 0.5) * 2;
  });

  let scrollY = 0;
  window.addEventListener('scroll', () => { scrollY = window.scrollY; }, { passive: true });

  window.addEventListener('resize', () => {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
  });

  const clock = new THREE.Clock();
  let visible = true;
  document.addEventListener('visibilitychange', () => { visible = !document.hidden; });

  function tick() {
    requestAnimationFrame(tick);
    if (!visible) return;
    const t = clock.getElapsedTime();

    mouse.x += (mouse.tx - mouse.x) * 0.05;
    mouse.y += (mouse.ty - mouse.y) * 0.05;

    // hero object
    core.rotation.x = t * 0.25;
    core.rotation.y = t * 0.35;
    wire.rotation.x = -t * 0.18;
    wire.rotation.y = -t * 0.28;
    const pulse = 1 + Math.sin(t * 1.6) * 0.03;
    core.scale.setScalar(pulse);

    rings.forEach((ring) => {
      const d = ring.userData;
      const a = t * d.speed + d.phase;
      d.sat.position.set(Math.cos(a) * d.r, Math.sin(a) * d.r, 0);
      ring.rotation.z += 0.0015;
    });

    // parallax on hero group
    hero.rotation.y = mouse.x * 0.35;
    hero.rotation.x = mouse.y * 0.2;

    // scroll-driven: hero drifts up & fades back, camera travels down
    const sp = Math.min(scrollY / window.innerHeight, 3);
    hero.position.y = (isMobile ? 2.2 : 0) + sp * 3.2;
    hero.position.x = (isMobile ? 0 : 3.6) - sp * 1.2;
    camera.position.y = -scrollY * 0.0035;
    camera.position.x = mouse.x * 0.5;
    camera.lookAt(camera.position.x * 0.3, camera.position.y, 0);

    cubes.forEach((c, i) => {
      c.rotation.x += c.userData.rx;
      c.rotation.y += c.userData.ry;
      c.position.y = c.userData.oy + Math.sin(t * 0.6 * c.userData.fy + i) * 0.5;
    });

    points.rotation.y = t * 0.012;

    l1.position.x = Math.sin(t * 0.5) * 6;
    l2.position.y = Math.cos(t * 0.4) * 5;

    renderer.render(scene, camera);
  }
  tick();

  onProgress && onProgress(1);
}

/* ---------- Interactive skills sphere ---------- */
export function initSkillSphere() {
  const canvas = document.getElementById('sphere');
  if (!canvas) return;

  const skills = [
    'AWS', 'EC2', 'S3', 'VPC', 'IAM', 'RDS', 'CloudWatch', 'Terraform', 'Docker', 'Kubernetes',
    'Ansible', 'Jenkins', 'Helm', 'Argo CD', 'CI/CD', 'Linux', 'Bash', 'Git', 'GitHub',
    'Python', 'Java', 'C++', 'C', 'MySQL', 'SQL', 'Oracle', 'LangChain', 'RAG', 'LLMs',
    'AI Agents', 'MCP', 'NLP', 'GenAI', 'Prompting', 'DSA', 'OOP',
    'HTML5', 'CSS3', 'JavaScript', 'React.js', 'Node.js', 'Express.js'
  ];

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
  camera.position.z = 7.2;

  const group = new THREE.Group();
  scene.add(group);

  // faint sphere guide
  group.add(new THREE.Mesh(
    new THREE.SphereGeometry(2.55, 32, 24),
    new THREE.MeshBasicMaterial({ color: 0x7c5cff, wireframe: true, transparent: true, opacity: 0.07 })
  ));
  group.add(new THREE.Mesh(
    new THREE.SphereGeometry(1.2, 32, 32),
    new THREE.MeshBasicMaterial({ color: 0x00e0ff, transparent: true, opacity: 0.05 })
  ));

  function makeLabel(text, color) {
    const c = document.createElement('canvas');
    const ctx = c.getContext('2d');
    const fs = 54;
    ctx.font = `600 ${fs}px "Space Grotesk", sans-serif`;
    const w = Math.ceil(ctx.measureText(text).width) + 40;
    c.width = w; c.height = fs + 36;
    ctx.font = `600 ${fs}px "Space Grotesk", sans-serif`;
    ctx.textBaseline = 'middle'; ctx.textAlign = 'center';
    ctx.fillStyle = color;
    ctx.shadowColor = color; ctx.shadowBlur = 14;
    ctx.fillText(text, w / 2, c.height / 2 + 2);
    const tex = new THREE.CanvasTexture(c);
    tex.anisotropy = 4;
    const spr = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false }));
    const s = 0.0065;
    spr.scale.set(w * s, c.height * s, 1);
    spr.userData.base = new THREE.Vector3(w * s, c.height * s, 1);
    return spr;
  }

  const colors = ['#9b86ff', '#4fe8ff', '#ff8ad8', '#e8ebff'];
  const sprites = [];
  const n = skills.length;
  const golden = Math.PI * (3 - Math.sqrt(5));
  skills.forEach((s, i) => {
    const y = 1 - (i / (n - 1)) * 2;
    const r = Math.sqrt(1 - y * y);
    const th = golden * i;
    const R = 2.6;
    const spr = makeLabel(s, colors[i % colors.length]);
    spr.position.set(Math.cos(th) * r * R, y * R, Math.sin(th) * r * R);
    group.add(spr);
    sprites.push(spr);
  });

  // interaction
  let dragging = false, px = 0, py = 0, vx = 0.004, vy = 0.0025;
  const down = (x, y) => { dragging = true; px = x; py = y; };
  const move = (x, y) => {
    if (!dragging) return;
    vy = (x - px) * 0.006; vx = (y - py) * 0.006;
    px = x; py = y;
  };
  const up = () => { dragging = false; };
  canvas.addEventListener('pointerdown', (e) => { down(e.clientX, e.clientY); canvas.setPointerCapture(e.pointerId); });
  canvas.addEventListener('pointermove', (e) => move(e.clientX, e.clientY));
  canvas.addEventListener('pointerup', up);
  canvas.addEventListener('pointercancel', up);

  const ray = new THREE.Raycaster();
  const m = new THREE.Vector2(-9, -9);
  canvas.addEventListener('pointermove', (e) => {
    const r = canvas.getBoundingClientRect();
    m.x = ((e.clientX - r.left) / r.width) * 2 - 1;
    m.y = -((e.clientY - r.top) / r.height) * 2 + 1;
  });
  canvas.addEventListener('pointerleave', () => m.set(-9, -9));

  function resize() {
    const r = canvas.getBoundingClientRect();
    if (!r.width) return;
    renderer.setSize(r.width, r.height, false);
    camera.aspect = r.width / r.height;
    camera.updateProjectionMatrix();
  }
  resize();
  window.addEventListener('resize', resize);

  let inView = true;
  new IntersectionObserver((en) => { inView = en[0].isIntersecting; }).observe(canvas);

  const tmp = new THREE.Vector3();
  function tick() {
    requestAnimationFrame(tick);
    if (!inView) return;

    group.rotation.y += vy;
    group.rotation.x += vx;
    group.rotation.x = Math.max(-1.2, Math.min(1.2, group.rotation.x));
    if (!dragging) {
      vy += (0.004 - vy) * 0.03;
      vx += (0.0015 - vx) * 0.03;
    }

    ray.setFromCamera(m, camera);
    const hits = ray.intersectObjects(sprites);
    const hovered = hits.length ? hits[0].object : null;

    sprites.forEach((s) => {
      s.getWorldPosition(tmp);
      const depth = (tmp.z + 2.6) / 5.2; // 0 back → 1 front
      s.material.opacity = 0.25 + depth * 0.75;
      const k = s === hovered ? 1.5 : 0.8 + depth * 0.4;
      s.scale.lerp(tmp.set(s.userData.base.x * k, s.userData.base.y * k, 1), 0.2);
    });
    canvas.style.cursor = hovered ? 'pointer' : dragging ? 'grabbing' : 'grab';

    renderer.render(scene, camera);
  }
  tick();
}
