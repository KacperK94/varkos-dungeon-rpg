import * as THREE from "three";
export function createWeatherRenderer(scene) {
  const count = 160,
    positions = new Float32Array(count * 3);
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  const material = new THREE.PointsMaterial({
    color: "#c4e2e8",
    size: 0.09,
    transparent: true,
    opacity: 0.7,
    depthWrite: false,
  });
  const rain = new THREE.Points(geometry, material);
  rain.frustumCulled = false;
  scene.add(rain);
  const meteors = new THREE.Group();
  scene.add(meteors);
  for (let i = 0; i < 6; i++) {
    const m = new THREE.Mesh(
      new THREE.ConeGeometry(0.1, 2, 5),
      new THREE.MeshBasicMaterial({ color: "#ffca87", transparent: true }),
    );
    m.rotation.z = -0.7;
    meteors.add(m);
  }
  let visualTime = 0;
  const sky = new THREE.Color(),
    clear = new THREE.Color("#79b9bb"),
    dark = new THREE.Color("#465d69");
  return {
    update(dt, weather, player, renderer, light, active, reducedMotion, low) {
      if (active) visualTime += dt;
      const storm = weather.kind === "storm",
        wind = weather.kind === "wind",
        fog = weather.kind === "fog";
      const intensity = weather.intensity;
      const visibility = fog
        ? 70 - 36 * intensity
        : storm
          ? 70 - 25 * intensity
          : 65;
      scene.fog.near = visibility;
      scene.fog.far = fog
        ? 155 - 62 * intensity
        : storm
          ? 155 - 48 * intensity
          : 155;
      sky
        .copy(clear)
        .lerp(dark, storm ? intensity * 0.7 : fog ? intensity * 0.25 : 0);
      scene.fog.color.copy(sky);
      renderer.setClearColor(sky);
      // Slow, subtle brightening rather than full-screen flashing/strobing.
      const lightning =
        storm && !reducedMotion
          ? Math.max(0, Math.sin(visualTime * 0.65)) ** 24 * 0.7 * intensity
          : 0;
      light.intensity = 3.1 - (storm ? 1.4 * intensity : 0) + lightning;
      rain.visible = storm || wind;
      material.opacity = (storm ? 0.7 : 0.25) * intensity;
      geometry.setDrawRange(0, low ? 60 : count);
      if (rain.visible) {
        for (let i = 0; i < count; i++) {
          const t = visualTime * (storm ? 13 : 4);
          positions[i * 3] =
            player.x + ((i * 7.13 + (wind ? t * 2 : 0)) % 30) - 15;
          positions[i * 3 + 1] = 0.3 + ((((i * 1.37 - t) % 15) + 15) % 15);
          positions[i * 3 + 2] = player.z + ((i * 11.7) % 30) - 15;
        }
        geometry.attributes.position.needsUpdate = true;
      }
      meteors.visible = weather.kind === "meteors";
      meteors.children.forEach((m, i) => {
        const t = (visualTime * 0.25 + i * 0.17) % 1;
        m.visible = !low || i < 2;
        m.position.set(
          player.x + 12 - t * 22 + i * 0.4,
          20 - t * 18,
          player.z - 6 + i * 2,
        );
        m.material.opacity = intensity;
      });
    },
  };
}
