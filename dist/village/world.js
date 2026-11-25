import * as T from './vendor/three.module.min.js';
import { buildPuppet } from './puppet.js';
import { buildWelcome } from './welcome.js';
import { buildHouse } from './houses.js';
import { buildCharacter } from './characters.js';
import { batchPaper } from './batch.js';
import { contactShadow } from './shadows.js';
import { streetDetails } from './street.js';
import { makeWeather } from './weather.js';
import { createLandscape, COUNT, RADIUS, STEP, skies, position, wrap } from './landscape.js';
const clamp = T.MathUtils.clamp,
  sm = T.MathUtils.smoothstep;
export function createWorld(canvas, lang, events) {
  // High-DPI screens supply edge coverage. A single-sample buffer also keeps
  // software renderers and integrated GPUs from paying for four full scene passes.
  const renderer = new T.WebGLRenderer({
    canvas,
    alpha: false,
    antialias: false,
    powerPreference: 'high-performance',
  });
  const gl = renderer.getContext(),
    info = gl.getExtension('WEBGL_debug_renderer_info');
  const software =
    info && /swiftshader|llvmpipe|software/i.test(gl.getParameter(info.UNMASKED_RENDERER_WEBGL));
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = T.SRGBColorSpace;
  renderer.shadowMap.enabled = !software;
  renderer.shadowMap.autoUpdate = false;
  renderer.shadowMap.needsUpdate = true;
  renderer.shadowMap.type = T.PCFSoftShadowMap;
  const scene = new T.Scene(),
    camera = new T.PerspectiveCamera(30, 1, 0.15, 95);
  const skyLight = new T.HemisphereLight(0xf7f6ef, 0xc1cbd0, 1.75);
  scene.add(skyLight);
  const sun = new T.DirectionalLight(0xffe7d0, 2.1);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  sun.shadow.bias = -0.0007;
  sun.shadow.normalBias = 0.023;
  sun.shadow.radius = 2;
  Object.assign(sun.shadow.camera, { left: -14, right: 14, top: 13, bottom: -12, near: 0.5, far: 63 });
  scene.add(sun, sun.target);
  const scenery = createLandscape(scene),
    weather = makeWeather(scene),
    houses = new Map(),
    hitTargets = [...scenery.treeHits];
  const santa = buildCharacter('santa'),
    elf = buildPuppet(window.VillageCalendar.elf());
  scene.add(elf.root);
  santa.root.userData.kind = 'rules';
  santa.root.userData.stop = 0;
  elf.root.userData.kind = 'elf';
  hitTargets.push(santa.root, elf.root);
  const pad = document.querySelector('#v-stage'),
    tag = document.querySelector('#v-marker'),
    moonTap = document.querySelector('#square-moon'),
    reduce = matchMedia('(prefers-reduced-motion: reduce)');
  let returnAngle = 0,
    target = 0,
    loc = 0,
    lastStop = -1,
    lastTime,
    clock = 0,
    reaction = '',
    reactAt = -9,
    celebration = false;
  let width = 1,
    height = 1,
    small = false,
    quality = software ? 2 : 0,
    drag = null,
    inertia = 0,
    zoom = 0,
    visit = null,
    entryCalled = false,
    raf;
  let frames = 0,
    slow = 0,
    badTime = 0,
    qualityGrace = 3,
    lastSky = NaN,
    lastShadow = Infinity,
    propAction;
  let lastMovement = -2000;
  let dpr = software ? 0.72 : Math.min(devicePixelRatio || 1, 1.6);
  let settledFov = 32;
  const cameraAt = new T.Vector3(),
    lookAt = new T.Vector3(),
    doorAt = new T.Vector3(),
    raycaster = new T.Raycaster(),
    mouse = new T.Vector2();
  const anchorFromCamera = new T.Vector3(),
    projection = new T.Vector3();
  // Paint the sky in the opaque colour buffer to avoid blending the full
  // WebGL surface over a changing CSS gradient during every camera turn.
  const skyCanvas = document.createElement('canvas');
  skyCanvas.width = 2;
  skyCanvas.height = 64;
  const skyBrush = skyCanvas.getContext('2d');
  const skyTexture = new T.CanvasTexture(skyCanvas);
  skyTexture.colorSpace = T.SRGBColorSpace;
  skyTexture.generateMipmaps = false;
  skyTexture.minFilter = T.LinearFilter;
  scene.background = skyTexture;
  const colors = skies.map((c) => new T.Color(c));
  function ensure(n) {
    if (houses.has(n)) return houses.get(n);
    const data = n === 0 ? buildWelcome(lang) : buildHouse(n, lang);
    const street = streetDetails(n, lang);
    data.root.add(street.root);
    data.props.push(...street.props);
    const base = new T.Group();
    base.position.copy(position(n * STEP, RADIUS));
    base.rotation.y = -n * STEP;
    contactShadow(base, 0, 0.58, n ? 8.8 : 10, 6.4);
    if (!n) contactShadow(base, -2.23, 4.55, 2.2, 1.35);
    if (n) data.root.rotation.y = -0.13;
    base.add(data.root);
    scene.add(base);
    for (const p of data.props) {
      p.object.userData.kind = p.kind;
      p.object.userData.stop = n;
      hitTargets.push(p.object);
    }
    if (n) {
      data.root.userData.kind = 'door';
      data.root.userData.stop = n;
      hitTargets.push(data.root);
    }
    batchPaper(data.root, [
      data.door,
      data.handle,
      data.lock,
      data.star,
      data.festive,
      ...data.props.flatMap((p) => [p.object, p.object.getObjectByName('waving-arm')]),
    ]);
    if (!n) {
      santa.root.position.set(-2.23, 0.04, 4.55);
      santa.root.scale.setScalar(1.36);
      santa.root.rotation.y = 0.13;
      base.add(santa.root);
    }
    const model = { ...data, base };
    houses.set(n, model);
    syncOne(n, model);
    return model;
  }
  function syncOne(n, m) {
    if (!n) return;
    const s = window.VillageCalendar.status(n);
    m.lock.visible = !s.ready;
    m.star.visible = m.festive.visible = s.done;
  }
  function sync() {
    for (const [n, m] of houses) syncOne(n, m);
    renderer.shadowMap.needsUpdate = true;
  }
  function resize() {
    const r = canvas.getBoundingClientRect();
    width = Math.max(1, r.width);
    height = Math.max(1, r.height);
    small = innerWidth <= 700;
    renderer.setPixelRatio(dpr);
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    settledFov = small
      ? Math.max(42, (2 * Math.atan(9.0 / (RADIUS * camera.aspect)) * 180) / Math.PI)
      : Math.max(30, (2 * Math.atan(13.5 / (RADIUS * camera.aspect)) * 180) / Math.PI);
    camera.updateProjectionMatrix();
  }
  function animateReaction(kind) {
    reaction = kind;
    reactAt = clock;
    events.effect(kind);
  }
  function activate(n) {
    if (visit !== null || zoom > 0.025 || n < 1) return;
    const nearest = Math.round(loc) + ((n - wrap(Math.round(loc)) + 19.5) % 13) - 6.5;
    returnAngle = wrap(Math.round(loc)) === n ? loc : nearest;
    target = nearest;
    inertia = 0;
    const model = ensure(n),
      status = window.VillageCalendar.status(n);
    if (!status.ready) {
      animateReaction('locked');
      model.rattle = clock;
      const point = new T.Vector3(0, model.roofY - 0.2, 1.2);
      model.root.localToWorld(point);
      if (!reduce.matches) weather.burst(clock, point);
      events.locked(n);
      return;
    }
    if (events.needsWelcome()) return;
    visit = n;
    entryCalled = false;
    animateReaction('enter');
    model.root.localToWorld(doorAt.copy(model.doorPoint));
  }
  function leave() {
    if (visit === null) return;
    visit = null;
    target = returnAngle;
    entryCalled = false;
    if (celebration) {
      animateReaction('celebrate');
      celebration = false;
    }
  }
  function navigate(n, absolute = false) {
    if (visit !== null || zoom > 0.025) return;
    if (absolute) {
      const now = wrap(target);
      target += ((n - now + COUNT * 1.5) % COUNT) - COUNT * 0.5;
    } else target = Math.round(target) + n;
    inertia = 0;
    if (reduce.matches) loc = target;
  }
  function backdrop() {
    if (Math.abs(loc - lastSky) < 0.006) return;
    lastSky = loc;
    const f = wrap(loc),
      n = Math.floor(f),
      col = colors[n].clone().lerp(colors[(n + 1) % COUNT], sm(f - n, 0.18, 0.82));
    const top = col.clone().multiplyScalar(0.55).getStyle(),
      low = col.clone().lerp(new T.Color('#c8c7ac'), 0.32).getStyle();
    const gradient = skyBrush.createLinearGradient(0, 0, 0, 64);
    gradient.addColorStop(0, top);
    gradient.addColorStop(0.47, col.getStyle());
    gradient.addColorStop(1, low);
    skyBrush.fillStyle = gradient;
    skyBrush.fillRect(0, 0, 2, 64);
    skyTexture.needsUpdate = true;
  }
  function draw(now) {
    raf = requestAnimationFrame(draw);
    if (document.hidden) {
      lastTime = undefined;
      return;
    }
    const elapsed = lastTime === undefined ? 1 / 60 : (now - lastTime) / 1000;
    lastTime = now;
    const dt = Math.min(0.12, elapsed);
    clock += dt;
    const modal = !!document.querySelector('dialog[open]');
    if (modal && visit === null && frames > 1 && !celebration && zoom === 0) return;
    if (visit !== null && entryCalled && !modal && !window.VillageCalendar.status(visit).ready) leave();
    if (visit !== null && entryCalled && zoom > 0.999 && modal) return;
    if (!drag && Math.abs(inertia) > 0.018 && !reduce.matches) {
      target += inertia * dt;
      inertia *= Math.exp(-5.8 * dt);
    }
    const old = loc;
    loc += (target - loc) * (reduce.matches ? 1 : 1 - Math.exp(-dt * (drag ? 22 : 9)));
    if (Math.abs(target - loc) < 0.0001) loc = target;
    const speed = (loc - old) / Math.max(dt, 0.001),
      stop = wrap(Math.round(loc));
    const angle = loc * STEP;
    // A CPU-rendered desktop has many more pixels to shade than a phone. Limit
    // only the moving drawing buffer and restore the sharp resting composition.
    if (software) {
      if (drag || Math.abs(speed) > 0.008 || (zoom > 0.001 && zoom < 0.999)) lastMovement = now;
      const movingRatio = Math.min(dpr, Math.sqrt(125000 / (width * height)));
      const ratio = now - lastMovement < 450 ? movingRatio : dpr;
      if (Math.abs(renderer.getPixelRatio() - ratio) > 0.01) renderer.setPixelRatio(ratio);
    }
    if (lastStop !== stop) {
      ensure(stop);
      ensure(wrap(stop + 1));
      ensure(wrap(stop - 1));
      // A wide desktop sees the near edge of a second neighbouring sector.
      if (width / height > 1.7) {
        ensure(wrap(stop + 2));
        ensure(wrap(stop - 2));
      }
      for (const [n, m] of houses) {
        m.base.visible = Math.abs(((n - stop + 19.5) % 13) - 6.5) <= 2;
      }
      lastStop = stop;
      events.stop(stop);
    }
    zoom = T.MathUtils.damp(zoom, visit === null ? 0 : 1, reduce.matches ? 1000 : 4.7, dt);
    if (zoom < 0.001) zoom = 0;
    if (zoom > 0.999) zoom = 1;
    cameraAt.set(0, small ? 6.0 : 7.1, 0);
    lookAt.copy(position(angle, RADIUS, small ? 3.7 : 3.7));
    if (zoom > 0) {
      cameraAt.lerp(
        anchorFromCamera
          .copy(doorAt)
          .multiplyScalar(0.81)
          .setY(doorAt.y + 1.15),
        zoom,
      );
      lookAt.lerp(doorAt, zoom);
    }
    // Periodic at the wrap seam in either direction. Keep the origin fixed.
    const between = Math.sin(Math.PI * loc) ** 2;
    camera.fov = settledFov + (reduce.matches ? 0 : between * (small ? 13 : 8)) * (1 - zoom);
    camera.position.copy(cameraAt);
    camera.lookAt(lookAt);
    camera.setViewOffset(
      width,
      height,
      -width * (small ? 0.015 : 0.163) * (1 - zoom),
      -height * (small ? 0.14 : 0.005) * (1 - zoom),
      width,
      height,
    );
    camera.updateMatrixWorld();
    // Track the actual Welcome Square moon as the central camera rotates and zooms.
    scenery.ownerMoon.getWorldPosition(projection);
    projection.project(camera);
    moonTap.hidden = stop !== 0 || zoom !== 0 || Math.abs(projection.x) > 1 || Math.abs(projection.y) > 1 || projection.z < -1 || projection.z > 1;
    if (!moonTap.hidden) {
      moonTap.style.left = (projection.x + 1) * 50 + '%';
      moonTap.style.top = (1 - projection.y) * 50 + '%';
    }
    backdrop();
    const lightPivot = position(angle, RADIUS, 0);
    sun.target.position.copy(lightPivot);
    sun.position
      .copy(lightPivot)
      .add(new T.Vector3(-10, 17, 12).applyAxisAngle(new T.Vector3(0, 1, 0), -angle));
    const reactionAge = clock - reactAt;
    for (const [n, m] of houses) {
      if (n === 0 || !m.base.visible) continue;
      const shaking = clock - (m.rattle ?? -10),
        osc = shaking < 0.72 && !reduce.matches ? Math.sin(shaking * 48) * Math.exp(-shaking * 4) : 0;
      m.root.rotation.z = 0.018 * osc;
      m.lock.rotation.z = osc * 0.44;
      m.handle.rotation.z = osc * 0.44 - (visit === n || (n === stop && zoom > 0) ? 0.68 * zoom : 0);
      m.door.rotation.y = n === stop ? -1.45 * sm(zoom, 0.22, 0.85) : 0;
      m.star.scale.setScalar(
        1 +
          (reaction === 'celebrate' && n === stop && !reduce.matches && reactionAge < 1.6
            ? 0.28 * Math.abs(Math.sin(reactionAge * 8)) * (1 - reactionAge / 1.6)
            : 0),
      );
    }
    if (propAction) {
      const t = clock - propAction.time;
      propAction.object.rotation.z = propAction.z + (t < 0.8 ? Math.sin(t * 24) * 0.17 * (1 - t / 0.8) : 0);
      if (t >= 0.8) propAction = null;
    }
    const elfAngle = angle + (small ? 0.07 : 0.083);
    elf.root.position.copy(position(elfAngle, 22.6, 0.04));
    elf.root.rotation.y = -elfAngle - 0.18;
    elf.root.scale.setScalar(small ? 1.32 : 1.38);
    elf.animate(clock, speed, reaction, reactionAge, reduce.matches);
    if (houses.get(0)?.base.visible) santa.animate(clock, 0, '', 10, reduce.matches);
    const displayTag = stop === 0 && Math.abs(speed) < 0.8 && zoom === 0;
    tag.hidden = !displayTag;
    if (displayTag) {
      santa.root.getWorldPosition(projection);
      projection.y += 3;
      projection.project(camera);
      tag.style.left = (projection.x + 1) * 50 + '%';
      tag.style.top = (1 - projection.y) * 50 + '%';
    }
    scenery.lights.forEach((l, i) => {
      l.rotation.y = reduce.matches ? 0 : 0.27 * Math.sin(clock * 0.55 + i);
    });
    weather.frame(reduce.matches ? 0 : clock, wrap(loc));
    weather.flakes(clock);
    if (Math.abs(loc - lastShadow) > 0.055 || (reactionAge < 0.9 && !reduce.matches && frames % 4 === 0)) {
      renderer.shadowMap.needsUpdate = true;
      lastShadow = loc;
    }
    renderer.render(scene, camera);
    frames++;
    if (visit !== null && !entryCalled && (zoom > 0.92 || reduce.matches)) {
      entryCalled = true;
      events.enter(visit);
    }
    if (qualityGrace > 0) {
      qualityGrace -= Math.min(elapsed, 0.75);
      return;
    }
    // Only sustained slowness in the visible, interactive world lowers fidelity.
    if (!modal && !drag && elapsed < 4) {
      slow = elapsed > 0.048 ? slow + elapsed : Math.max(0, slow - dt * 0.7);
      badTime = elapsed > 0.085 ? badTime + elapsed : Math.max(0, badTime - dt);
    }
    if (slow > 1.25 && quality < 2) {
      quality++;
      dpr = Math.max(0.58, dpr * 0.73);
      renderer.shadowMap.enabled = quality < 2;
      resize();
      slow = 0;
      badTime = 0;
      qualityGrace = 1;
    }
    if (badTime > 8 && quality === 2) {
      events.slow();
      badTime = 0;
    }
  }
  function hit(e) {
    const b = canvas.getBoundingClientRect();
    mouse.set(((e.clientX - b.left) / width) * 2 - 1, 1 - ((e.clientY - b.top) / height) * 2);
    raycaster.setFromCamera(mouse, camera);
    const visible = hitTargets.filter((o) => {
      for (let p = o; p; p = p.parent) if (!p.visible) return false;
      return true;
    });
    for (const h of raycaster.intersectObjects(visible, true)) {
      let o = h.object;
      while (o && !o.userData.kind) o = o.parent;
      if (o) return { object: o, point: h.point, kind: o.userData.kind, stop: o.userData.stop };
    }
    return null;
  }
  canvas.addEventListener('pointerdown', (e) => {
    if (visit !== null || e.button !== 0) return;
    drag = {
      id: e.pointerId,
      x: e.clientX,
      y: e.clientY,
      lastX: e.clientX,
      lastTime: e.timeStamp,
      v: 0,
      moved: false,
    };
    inertia = 0;
    canvas.setPointerCapture(e.pointerId);
  });
  canvas.addEventListener('pointermove', (e) => {
    if (!drag || drag.id !== e.pointerId) return;
    if (!drag.moved && Math.hypot(e.clientX - drag.x, e.clientY - drag.y) < 6) return;
    drag.moved = true;
    const delta = (drag.lastX - e.clientX) / Math.max(160, width * 0.43);
    drag.v = clamp(delta / Math.max(0.012, (e.timeStamp - drag.lastTime) / 1000), -4, 4);
    drag.lastTime = e.timeStamp;
    drag.lastX = e.clientX;
    target += delta;
  });
  canvas.addEventListener('pointercancel', () => {
    drag = null;
    inertia = 0;
  });
  canvas.addEventListener('pointerup', (e) => {
    if (!drag || drag.id !== e.pointerId) return;
    const d = drag;
    drag = null;
    if (d.moved) {
      inertia = e.timeStamp - d.lastTime < 85 ? d.v : 0;
      return;
    }
    const h = hit(e);
    if (!h) return;
    if (h.kind === 'door') {
      activate(h.stop);
    } else if (['story', 'rules', 'help', 'install'].includes(h.kind)) events.action(h.kind);
    else {
      animateReaction('curious');
      if (h.kind === 'lantern') {
        const bulb = h.object.userData.bulb;
        bulb.emissiveIntensity = bulb.emissiveIntensity > 0.7 ? 0.2 : 1.65;
        return;
      }
      if (!reduce.matches) {
        if (h.kind === 'tree') weather.burst(clock, h.point, 1.4);
        else if (h.kind !== 'elf') {
          if (propAction) propAction.object.rotation.z = propAction.z;
          const part = h.object.getObjectByName('waving-arm') || h.object;
          propAction = { object: part, z: part.rotation.z, time: clock };
        }
      }
    }
  });
  let wheelEnd;
  canvas.addEventListener(
    'wheel',
    (e) => {
      if (visit !== null || e.ctrlKey) return;
      e.preventDefault();
      const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
      target += clamp((delta * (e.deltaMode === 1 ? 15 : e.deltaMode === 2 ? height : 1)) / 450, -0.7, 0.7);
      inertia = 0;
      clearTimeout(wheelEnd);
      wheelEnd = setTimeout(() => {
        if (!drag && visit === null && Math.abs(target - Math.round(target)) < 0.19)
          target = Math.round(target);
      }, 160);
    },
    { passive: false },
  );
  canvas.addEventListener('webglcontextlost', (e) => {
    e.preventDefault();
    cancelAnimationFrame(raf);
    events.fallback();
  });
  new ResizeObserver(resize).observe(pad);
  resize();
  raf = requestAnimationFrame(draw);
  return {
    setVariant: elf.setVariant,
    navigate,
    activate,
    leave,
    sync,
    get stop() {
      return wrap(Math.round(loc));
    },
    celebrate() {
      celebration = true;
      animateReaction('celebrate');
    },
  };
}
