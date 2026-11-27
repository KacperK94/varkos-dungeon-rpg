import * as THREE from "three";
import { weatherAt } from "./weather.js";
import { createWeatherRenderer } from "./weather-renderer.js";
import { addFlora } from "./flora-renderer.js";
import { bindCameraGestures, clampZoom } from "./camera-gestures.js";
import { renderQuality, applyRenderQuality } from "./render-quality.js";
import {
  generateNodes,
  seededRandom,
  obstaclesFor,
  moveWithCollisions,
  findPath,
  canStand,
} from "./world-map.js";
import { createWildlife } from "./wildlife.js";
import { canTapMove } from "./settings.js";

export function createWorld(canvas, state, initialSettings) {
  let settings = initialSettings;
  const generated = generateNodes(state.world);
  let obstacles = obstaclesFor(generated, state);
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: false,
    powerPreference: "high-performance",
  });
  const touchDevice = matchMedia("(pointer: coarse)").matches;
  renderer.setPixelRatio(Math.min(devicePixelRatio, touchDevice ? 1.25 : 1.75));
  renderer.shadowMap.enabled = settings.graphics !== "low";
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.setClearColor("#79b9bb");
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog("#79b9bb", 65, 155);
  const weatherRenderer = createWeatherRenderer(scene);
  const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const camera = new THREE.OrthographicCamera(-25, 25, 25, -25, 0.1, 180);
  let zoom = 24;
  const light = new THREE.DirectionalLight("#fff0cf", 3.1);
  light.position.set(-18, 30, 15);
  light.castShadow = true;
  const shadowSize = touchDevice ? 1024 : 2048;
  light.shadow.mapSize.set(shadowSize, shadowSize);
  Object.assign(light.shadow.camera, {
    left: -32,
    right: 32,
    top: 32,
    bottom: -32,
    near: 1,
    far: 130,
  });
  light.shadow.normalBias = 0.045;
  scene.add(light, new THREE.HemisphereLight("#c3e8e1", "#757b46", 2.3));
  const materials = {};
  function mat(color, extra = {}) {
    const key = color + JSON.stringify(extra);
    return (materials[key] ||= new THREE.MeshStandardMaterial({
      color,
      flatShading: true,
      roughness: 0.95,
      ...extra,
    }));
  }
  function mesh(geometry, color, parent, x = 0, y = 0, z = 0, extra = {}) {
    const object = new THREE.Mesh(geometry, mat(color, extra));
    object.position.set(x, y, z);
    object.castShadow = true;
    object.receiveShadow = true;
    parent.add(object);
    return object;
  }
  const cylinder = (top, bottom, height, sides = 7) =>
    new THREE.CylinderGeometry(top, bottom, height, sides);
  const box = (x, y, z) => new THREE.BoxGeometry(x, y, z);
  const random = seededRandom(state.world?.seed ?? 741);

  const sea = mesh(
    new THREE.PlaneGeometry(240, 240),
    "#71b9bb",
    scene,
    0,
    -1.35,
    0,
    { metalness: 0.13, roughness: 0.4 },
  );
  sea.rotation.x = -Math.PI / 2;
  sea.castShadow = false;
  const ripples = [];
  for (let i = 0; i < 95; i++) {
    const x = (random() - 0.5) * 105,
      z = (random() - 0.5) * 105;
    if (
      state.world ? Math.abs(x) < 52 && Math.abs(z) < 52 : Math.hypot(x, z) < 19
    )
      continue;
    const ripple = mesh(
      box(0.5 + random() * 2.4, 0.018, 0.07),
      i % 3 ? "#9bcfca" : "#c1e0cf",
      scene,
      x,
      -1.31,
      z,
    );
    ripple.castShadow = false;
    ripples.push(ripple);
  }
  const groundColor =
    state.world?.terrain === "rocky"
      ? "#adb09a"
      : state.world?.terrain === "forest"
        ? "#829d69"
        : "#9da96e";
  if (state.world) {
    mesh(box(104, 2.8, 104), "#a29a7b", scene, 0, -2.5, 0);
    mesh(box(102, 0.7, 102), "#e1c999", scene, 0, -0.84, 0);
    const ground = mesh(box(100, 0.18, 100), groundColor, scene, 0, 0.15, 0);
    const textureCanvas = document.createElement("canvas");
    textureCanvas.width = textureCanvas.height = 128;
    const ctx = textureCanvas.getContext("2d");
    if (ctx) {
      ctx.fillStyle = groundColor;
      ctx.fillRect(0, 0, 128, 128);
      for (let i = 0; i < 900; i++) {
        ctx.fillStyle = i % 2 ? "#ffffff10" : "#263b3410";
        ctx.fillRect(
          random() * 128,
          random() * 128,
          1 + random() * 2,
          1 + random() * 2,
        );
      }
      const texture = new THREE.CanvasTexture(textureCanvas);
      texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
      texture.repeat.set(32, 32);
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.anisotropy = Math.min(
        8,
        renderer.capabilities.getMaxAnisotropy(),
      );
      ground.material = ground.material.clone();
      ground.material.map = texture;
    }
  } else {
    mesh(cylinder(18.2, 14, 2.8, 48), "#a29a7b", scene, 0, -2.5, 0);
    mesh(cylinder(18.25, 17.9, 0.7, 64), "#e1c999", scene, 0, -0.84, 0);
    mesh(cylinder(16.55, 17.2, 0.8, 48), "#9ba36a", scene, 0, -0.28, 0);
    mesh(cylinder(16.1, 16.55, 0.18, 48), "#9da96e", scene, 0, 0.15, 0);
  }
  // A meandering path leads to the signal platform on the northern ridge.
  for (let i = 0; i < 16; i++) {
    const z = 8 - i * 1.1;
    const x = Math.sin(i * 0.5) * 0.8;
    const patch = mesh(
      cylinder(1.3, 1.4, 0.035, 7),
      "#c0b789",
      scene,
      x,
      0.26,
      z,
    );
    patch.rotation.y = i * 0.7;
  }
  // Batched decorative vegetation keeps draw calls low on phones.
  addFlora(scene, state.world, generated);
  for (let i = 0; i < 18; i++) {
    const a = random() * Math.PI * 2;
    const stone = mesh(
      new THREE.IcosahedronGeometry(0.6 + random() * 0.7),
      "#a6a48e",
      scene,
      Math.cos(a) * (state.world ? 52 : 17.1),
      -0.2,
      Math.sin(a) * (state.world ? 52 : 17.1),
    );
    stone.scale.set(1, 0.7, 0.7);
  }
  const nodes = [];
  function addNode(type, x, z, scale = 1) {
    const group = new THREE.Group();
    group.position.set(x, 0.26, z);
    group.rotation.y = random() * 6;
    if (type === "wood") {
      mesh(cylinder(0.14, 0.27, 1.8), "#785b41", group, 0, 0.9, 0);
      mesh(new THREE.ConeGeometry(1.2, 2.6, 7), "#456b51", group, 0, 2.7, 0);
      mesh(new THREE.ConeGeometry(0.98, 2.2, 7), "#547c58", group, 0, 3.65, 0);
      mesh(new THREE.ConeGeometry(0.67, 1.7, 7), "#73925c", group, 0, 4.55, 0);
      group.scale.setScalar(scale);
    } else if (type === "stone") {
      const rock = mesh(
        new THREE.DodecahedronGeometry(0.85, 0),
        "#899895",
        group,
        0,
        0.58,
        0,
      );
      rock.scale.set(1.2, 0.95, 0.85);
      mesh(
        new THREE.DodecahedronGeometry(0.4),
        "#acb5a6",
        group,
        0.7,
        0.3,
        0.3,
      );
    } else if (type === "fiber") {
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2;
        const leaf = mesh(
          new THREE.ConeGeometry(0.24, 1.2, 4),
          "#668b55",
          group,
          Math.cos(a) * 0.23,
          0.55,
          Math.sin(a) * 0.23,
        );
        leaf.rotation.z = Math.cos(a) * 0.45;
        leaf.rotation.x = Math.sin(a) * 0.45;
        mesh(
          new THREE.IcosahedronGeometry(0.12),
          "#e6c391",
          group,
          Math.cos(a) * 0.3,
          1.05,
          Math.sin(a) * 0.3,
        );
      }
    } else {
      mesh(new THREE.DodecahedronGeometry(0.65), "#647e78", group, 0, 0.3, 0);
      for (let i = 0; i < 3; i++) {
        const crystal = mesh(
          new THREE.OctahedronGeometry(0.42),
          "#a0ead9",
          group,
          (i - 1) * 0.4,
          0.9 + i * 0.12,
          (i % 2) * 0.3,
          { emissive: "#277d75", emissiveIntensity: 0.45, roughness: 0.2 },
        );
        crystal.scale.y = 1.8;
        crystal.rotation.z = (i - 1) * 0.3;
      }
    }
    const id = `node-${nodes.length}`;
    const node = {
      id,
      type,
      x,
      z,
      group,
      hits: type === "fiber" ? 3 : 5,
      shake: 0,
    };
    if ((state.depleted[id] || 0) >= node.hits) group.visible = false;
    scene.add(group);
    nodes.push(node);
  }
  for (const node of generated)
    addNode(node.type, node.x, node.z, 0.85 + random() * 0.3);
  const wildlife = createWildlife(
    scene,
    random,
    state.world?.wildlife !== false,
  );

  // Ancient foundation: the crafted beacon appears here.
  const platform = new THREE.Group();
  platform.position.set(0, 0.27, -11.5);
  mesh(cylinder(2.1, 2.25, 0.35, 8), "#a6ab96", platform, 0, 0.1, 0);
  mesh(cylinder(1.7, 1.85, 0.15, 8), "#c3c7ae", platform, 0, 0.35, 0);
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2;
    mesh(
      box(0.5, 1.1 + (i % 2) * 0.6, 0.5),
      "#889789",
      platform,
      Math.cos(a) * 2,
      0.65,
      Math.sin(a) * 2,
    );
  }
  scene.add(platform);
  const fire = new THREE.Group();
  fire.position.set(-2.6, 0.3, 1.2);
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    mesh(
      new THREE.DodecahedronGeometry(0.26),
      "#7b8580",
      fire,
      Math.cos(a) * 0.75,
      0.15,
      Math.sin(a) * 0.75,
    );
  }
  for (let i = 0; i < 3; i++) {
    const log = mesh(
      cylinder(0.14, 0.14, 1.3),
      "#765443",
      fire,
      0,
      0.22 + i * 0.06,
      0,
    );
    log.rotation.z = Math.PI / 2;
    log.rotation.y = i * 2;
  }
  const flame = mesh(
    new THREE.ConeGeometry(0.45, 1.35, 5),
    "#ffbf66",
    fire,
    0,
    0.95,
    0,
    { emissive: "#ff7c2a", emissiveIntensity: 1.5 },
  );
  const fireLight = new THREE.PointLight("#ffb66f", 12, 7);
  fireLight.position.y = 1.6;
  fire.add(fireLight);
  scene.add(fire);
  const beacon = new THREE.Group();
  beacon.position.set(0, 0.7, -11.5);
  for (const x of [-0.65, 0.65])
    for (const z of [-0.65, 0.65])
      mesh(box(0.17, 3, 0.17), "#715842", beacon, x, 1.5, z);
  mesh(box(1.7, 0.2, 1.7), "#ad9165", beacon, 0, 2.9, 0);
  const gem = mesh(
    new THREE.OctahedronGeometry(0.65),
    "#bdfff0",
    beacon,
    0,
    3.8,
    0,
    { emissive: "#76ebc5", emissiveIntensity: 1.5 },
  );
  const beam = mesh(cylinder(0.18, 0.6, 24, 12), "#d1ffe5", beacon, 0, 16, 0, {
    transparent: true,
    opacity: 0.24,
    emissive: "#c0ffe8",
    emissiveIntensity: 1,
    depthWrite: false,
  });
  beam.castShadow = false;
  scene.add(beacon);

  const player = new THREE.Group();
  mesh(cylinder(0.27, 0.3, 0.72, 6), "#cf8054", player, 0, 0.94, 0);
  mesh(box(0.36, 0.53, 0.23), "#536b65", player, 0, 0.95, 0.33);
  mesh(new THREE.IcosahedronGeometry(0.29, 1), "#e8bc8b", player, 0, 1.52, 0);
  mesh(cylinder(0.33, 0.35, 0.14, 8), "#536957", player, 0, 1.73, 0);
  mesh(cylinder(0.5, 0.5, 0.05, 9), "#536957", player, 0, 1.65, 0);
  const limbs = [];
  for (const side of [-1, 1]) {
    const leg = mesh(
      box(0.18, 0.52, 0.22),
      "#394c4c",
      player,
      side * 0.17,
      0.37,
      0,
    );
    const arm = mesh(
      box(0.16, 0.52, 0.17),
      "#d49b6c",
      player,
      side * 0.4,
      0.97,
      0,
    );
    limbs.push(leg, arm);
  }
  player.position.set(state.position.x, 0.27, state.position.z);
  scene.add(player);
  const selection = mesh(
    new THREE.RingGeometry(1, 1.08, 48),
    "#f9edbf",
    scene,
    0,
    0.29,
    0,
    { transparent: true, opacity: 0.85, side: THREE.DoubleSide },
  );
  selection.rotation.x = -Math.PI / 2;
  selection.castShadow = false;
  const playerRing = mesh(
    new THREE.RingGeometry(0.51, 0.57, 32),
    "#f5dfaa",
    player,
    0,
    0.02,
    0,
    { side: THREE.DoubleSide },
  );
  playerRing.rotation.x = -Math.PI / 2;
  playerRing.castShadow = false;

  const heldTool = new THREE.Group();
  heldTool.position.set(0.4, 0.8, -0.2);
  const handle = mesh(
    cylinder(0.04, 0.04, 0.8, 6),
    "#876541",
    heldTool,
    0,
    0,
    0,
  );
  const toolHead = mesh(
    box(0.42, 0.16, 0.16),
    "#bac5bb",
    heldTool,
    0.1,
    0.35,
    0,
  );
  player.add(heldTool);
  const chips = [];
  for (let i = 0; i < 10; i++) {
    const chip = mesh(
      new THREE.IcosahedronGeometry(0.045, 0),
      "#dfc17e",
      scene,
    );
    chip.visible = false;
    chip.castShadow = false;
    chips.push(chip);
  }
  const raycaster = new THREE.Raycaster();
  const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -0.27);
  const cameraTarget = new THREE.Vector3(0, 0, 2);
  let walkTarget = null;
  let path = [];
  let actionTime = 0;
  let craftTime = 0;
  function navigate(x, z) {
    path = findPath(
      { x: player.position.x, z: player.position.z },
      { x, z },
      obstacles,
      state.world,
    );
    walkTarget = path.shift() || null;
  }
  if (!canStand(player.position.x, player.position.z, obstacles, state.world)) {
    const safe = generated.length && findSafeSpawn();
    player.position.x = safe.x;
    player.position.z = safe.z;
  }
  function findSafeSpawn() {
    for (let r = 0; r < 10; r += 0.5)
      for (let a = 0; a < 6.3; a += 0.3) {
        const x = state.position.x + Math.cos(a) * r,
          z = state.position.z + Math.sin(a) * r;
        if (canStand(x, z, obstacles, state.world)) return { x, z };
      }
    return { x: 0, z: 6 };
  }
  let qualityTimer;
  function updateQuality() {
    const { width, height } = canvas.getBoundingClientRect();
    if (width <= 0 || height <= 0) return;
    applyRenderQuality(
      renderer,
      light,
      renderQuality({
        zoom,
        width,
        height,
        deviceRatio: devicePixelRatio,
        touchDevice,
        graphics: settings.graphics,
        maxDimension: renderer.capabilities.maxTextureSize,
      }),
    );
  }
  function scheduleQuality() {
    clearTimeout(qualityTimer);
    // Finish the gesture before reallocating high-resolution render targets.
    qualityTimer = setTimeout(updateQuality, 180);
  }
  function resize() {
    const { width, height } = canvas.getBoundingClientRect();
    if (width <= 0 || height <= 0) return;
    renderer.setSize(width, height, false);
    const aspect = width / height;
    // Preserve a useful horizontal view on narrow portrait screens.
    const verticalSpan = zoom / Math.min(1, aspect);
    camera.left = (-verticalSpan * aspect) / 2;
    camera.right = (verticalSpan * aspect) / 2;
    camera.top = verticalSpan / 2;
    camera.bottom = -verticalSpan / 2;
    camera.updateProjectionMatrix();
    scheduleQuality();
  }
  const observer = new ResizeObserver(resize);
  observer.observe(canvas);
  function setTarget(clientX, clientY) {
    if (!canTapMove(settings)) return;
    const rect = canvas.getBoundingClientRect();
    raycaster.setFromCamera(
      new THREE.Vector2(
        ((clientX - rect.left) / rect.width) * 2 - 1,
        (-(clientY - rect.top) / rect.height) * 2 + 1,
      ),
      camera,
    );
    const point = new THREE.Vector3();
    if (raycaster.ray.intersectPlane(groundPlane, point))
      navigate(point.x, point.z);
  }
  function setZoom(value) {
    zoom = clampZoom(value);
    resize();
  }
  function changeZoom(delta) {
    setZoom(zoom + delta);
  }
  const cameraGestures = bindCameraGestures(canvas, {
    getZoom: () => zoom,
    setZoom,
    onTap: setTarget,
    onPinch() {
      walkTarget = null;
      path = [];
    },
  });
  const wheelEvents = new AbortController();
  canvas.addEventListener(
    "wheel",
    (e) => {
      e.preventDefault();
      changeZoom(e.deltaY * 0.015);
    },
    { passive: false, signal: wheelEvents.signal },
  );
  function nearest() {
    let best = null,
      distance = 3;
    for (const node of nodes) {
      if (!node.group.visible) continue;
      const d = Math.hypot(
        player.position.x - node.x,
        player.position.z - node.z,
      );
      if (d < distance) {
        best = node;
        distance = d;
      }
    }
    return best;
  }
  let time = 0;
  function frame(dt, movement, running, active) {
    const weather = weatherAt(state.elapsed, state.world?.seed);
    if (active) time += dt;
    if (active) {
      let dx = movement.x,
        dz = movement.z;
      if (dx || dz) {
        walkTarget = null;
        path = [];
        // Screen-relative axes for the isometric camera.
        const x = dx * 0.8 + dz * 0.6;
        dz = dz * 0.8 - dx * 0.6;
        dx = x;
      } else if (walkTarget) {
        dx = walkTarget.x - player.position.x;
        dz = walkTarget.z - player.position.z;
        if (Math.hypot(dx, dz) < 0.12) {
          walkTarget = path.shift() || null;
          dx = 0;
          dz = 0;
        }
      }
      const length = Math.hypot(dx, dz);
      if (length > 0.01) {
        const speed = (running ? 6.8 : 4.2) * dt * weather.speed;
        const step = Math.min(speed, length);
        const next = moveWithCollisions(
          { x: player.position.x, z: player.position.z },
          {
            x: player.position.x + (dx / length) * step,
            z: player.position.z + (dz / length) * step,
          },
          obstacles,
          state.world,
        );
        if (
          Math.hypot(next.x - player.position.x, next.z - player.position.z) <
          0.001
        ) {
          walkTarget = null;
          path = [];
        }
        player.position.x = next.x;
        player.position.z = next.z;
        player.rotation.y = Math.atan2(-dx, -dz);
        limbs.forEach((limb, i) => {
          limb.rotation.x =
            Math.sin(time * (running ? 17 : 11) + (i % 2) * Math.PI) * 0.45;
        });
        player.position.y = 0.27 + Math.abs(Math.sin(time * 11)) * 0.055;
      } else {
        limbs.forEach((limb) => {
          limb.rotation.x *= 0.8;
        });
        player.position.y = 0.27 + Math.sin(time * 2) * 0.025;
      }
      state.position.x = player.position.x;
      state.position.z = player.position.z;
    }
    cameraTarget.lerp(
      new THREE.Vector3(player.position.x, 0, player.position.z - 1.8),
      1 - Math.exp(-dt * 2.5),
    );
    camera.position.copy(cameraTarget).add(new THREE.Vector3(24, 32, 32));
    camera.lookAt(cameraTarget);
    light.position.copy(cameraTarget).add(new THREE.Vector3(-18, 30, 15));
    light.target.position.copy(cameraTarget);
    light.target.updateMatrixWorld();
    wildlife.update(time, player.position, settings.graphics === "low");
    if (active) {
      actionTime = Math.max(0, actionTime - dt);
      craftTime = Math.max(0, craftTime - dt);
    }
    if (actionTime > 0) {
      limbs[1].rotation.x = -1.2 + Math.sin(actionTime * 25) * 0.6;
      player.rotation.z = Math.sin(actionTime * 20) * 0.06;
    } else player.rotation.z = 0;
    heldTool.visible =
      state.crafted.includes("axe") || state.crafted.includes("pickaxe");
    heldTool.rotation.x =
      actionTime > 0 ? -1 + Math.sin(actionTime * 25) * 0.8 : -0.2;
    toolHead.scale.x = state.crafted.includes("pickaxe") ? 1.6 : 1;
    for (let i = 0; i < chips.length; i++) {
      const chip = chips[i];
      chip.visible = actionTime > 0;
      if (chip.visible) {
        const t = 0.45 - actionTime;
        chip.position.set(
          player.position.x + Math.sin(i * 2) * t * 2,
          0.6 + Math.sin(t * 6) * 0.7,
          player.position.z + Math.cos(i * 2) * t * 2,
        );
      }
    }
    const buildScale = 1 + Math.sin(craftTime * 16) * craftTime * 0.1;
    fire.scale.setScalar(buildScale);
    beacon.scale.setScalar(buildScale);
    for (const node of nodes) {
      node.group.visible =
        (state.depleted[node.id] || 0) < node.hits &&
        Math.hypot(node.x - player.position.x, node.z - player.position.z) <
          weather.range;
    }

    for (let i = 0; i < ripples.length; i++)
      if (active) ripples[i].position.x += Math.sin(time * 0.5 + i) * dt * 0.06;
    for (const node of nodes) {
      node.shake = Math.max(0, node.shake - dt * 4);
      node.group.rotation.z =
        Math.sin(time * 44) * node.shake * 0.12 +
        (node.type === "wood" ? Math.sin(time * 1.2 + node.x) * 0.008 : 0);
    }
    const target = nearest();
    selection.visible = !!target && active;
    if (target) selection.position.set(target.x, 0.29, target.z);
    fire.visible = state.crafted.includes("campfire");
    beacon.visible = state.crafted.includes("beacon");
    flame.scale.set(
      1 + Math.sin(time * 11) * 0.1,
      1 + Math.sin(time * 16) * 0.13,
      1,
    );
    gem.rotation.y = time * 0.6;
    weatherRenderer.update(
      dt,
      weather,
      player.position,
      renderer,
      light,
      active,
      reducedMotion,
      settings.graphics === "low",
    );
    renderer.render(scene, camera);
    return target;
  }
  resize();
  return {
    frame,
    nearest,
    nodes,
    changeZoom,
    setSettings(next) {
      settings = next;
      walkTarget = null;
      path = [];
      cameraGestures.cancel();
      const shadows = settings.graphics !== "low";
      if (renderer.shadowMap.enabled !== shadows) {
        renderer.shadowMap.enabled = shadows;
        scene.traverse((object) => {
          if (object.material) object.material.needsUpdate = true;
        });
      }
      updateQuality();
    },
    stopWalk() {
      walkTarget = null;
      path = [];
      cameraGestures.cancel();
    },
    walkTo: navigate,
    animateAction(kind) {
      if (kind === "gather") actionTime = 0.45;
      else craftTime = 0.8;
    },
    refresh() {
      obstacles = obstaclesFor(generated, state);
      if (
        !canStand(player.position.x, player.position.z, obstacles, state.world)
      ) {
        const safe = findSafeSpawn();
        player.position.x = safe.x;
        player.position.z = safe.z;
      }
      for (const node of nodes)
        node.group.visible = (state.depleted[node.id] || 0) < node.hits;
    },
    dispose() {
      clearTimeout(qualityTimer);
      wheelEvents.abort();
      cameraGestures.dispose();
      observer.disconnect();
      const geometries = new Set(),
        materialsToDispose = new Set(),
        textures = new Set();
      scene.traverse((object) => {
        if (object.geometry) geometries.add(object.geometry);
        if (object.material) {
          for (const material of [object.material].flat()) {
            materialsToDispose.add(material);
            if (material.map) textures.add(material.map);
          }
        }
      });
      geometries.forEach((g) => g.dispose());
      textures.forEach((t) => t.dispose());
      materialsToDispose.forEach((m) => m.dispose());
      light.shadow.map?.dispose();
      renderer.dispose();
    },
  };
}
