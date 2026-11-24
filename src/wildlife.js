import * as THREE from "three";
export function createWildlife(scene, random, enabled = true) {
  const animals = [];
  const material = (color) =>
    new THREE.MeshStandardMaterial({
      color,
      roughness: 1,
      flatShading: true,
      side: THREE.DoubleSide,
    });
  const wingMaterials = [
    material("#e5b66f"),
    material("#a9ccef"),
    material("#eab8d2"),
  ];
  const fur = material("#d2c3a6"),
    dark = material("#3c493b");
  function part(parent, geometry, mat, x, y, z) {
    const m = new THREE.Mesh(geometry, mat);
    m.position.set(x, y, z);
    parent.add(m);
    return m;
  }
  if (enabled)
    for (let i = 0; i < 30; i++) {
      const group = new THREE.Group();
      const butterfly = i < 18,
        rabbit = i >= 26;
      const x = (random() - 0.5) * 65,
        z = (random() - 0.5) * 65;
      const wings = [];
      if (butterfly) {
        part(group, new THREE.CapsuleGeometry(0.035, 0.2, 2, 4), dark, 0, 0, 0);
        for (const side of [-1, 1]) {
          const pivot = new THREE.Group();
          group.add(pivot);
          part(
            pivot,
            new THREE.CircleGeometry(0.22, 7),
            wingMaterials[i % 3],
            side * 0.2,
            0,
            0,
          );
          wings.push(pivot);
        }
      } else if (rabbit) {
        const body = part(
          group,
          new THREE.SphereGeometry(0.25, 8, 6),
          fur,
          0,
          0.22,
          0,
        );
        body.scale.set(1, 0.8, 1.6);
        part(group, new THREE.SphereGeometry(0.19, 8, 6), fur, 0, 0.44, -0.26);
        for (const side of [-1, 1]) {
          part(
            group,
            new THREE.CapsuleGeometry(0.045, 0.32, 2, 5),
            fur,
            side * 0.09,
            0.73,
            -0.23,
          );
          part(
            group,
            new THREE.SphereGeometry(0.025, 5, 4),
            dark,
            side * 0.13,
            0.49,
            -0.38,
          );
        }
        part(group, new THREE.SphereGeometry(0.12, 6, 5), fur, 0, 0.3, 0.38);
      } else {
        part(group, new THREE.SphereGeometry(0.08, 6, 4), dark, 0, 0.05, 0);
      }
      group.position.set(x, butterfly ? 1.6 : 0.28, z);
      scene.add(group);
      animals.push({
        group,
        wings,
        x,
        z,
        phase: random() * 6,
        kind: butterfly ? "butterfly" : rabbit ? "rabbit" : "bug",
      });
    }
  return {
    update(time, player, low) {
      for (let i = 0; i < animals.length; i++) {
        const a = animals[i];
        a.group.visible =
          (!low || i % 3 === 0) &&
          Math.hypot(a.x - player.x, a.z - player.z) < 32;
        if (!a.group.visible) continue;
        const t = time * (a.kind === "rabbit" ? 0.35 : 0.6) + a.phase;
        a.group.position.x = a.x + Math.sin(t) * 2;
        a.group.position.z = a.z + Math.cos(t * 0.8) * 2;
        a.group.rotation.y = Math.atan2(Math.cos(t), -Math.sin(t * 0.8) * 0.8);
        if (a.kind === "butterfly") {
          a.group.position.y = 1.4 + Math.sin(time * 2 + a.phase) * 0.5;
          a.wings.forEach(
            (w, j) =>
              (w.rotation.y =
                Math.sin(time * 17 + a.phase) * (j ? 1 : -1) * 1.05),
          );
        }
        if (a.kind === "rabbit")
          a.group.position.y =
            0.28 + Math.max(0, Math.sin(time * 5 + a.phase)) * 0.24;
      }
    },
  };
}
