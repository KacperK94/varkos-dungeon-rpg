import * as THREE from "three";
import { generateFlora } from "./flora.js";

export function addFlora(scene, world, nodes) {
  const flora = generateFlora(world, nodes);
  const palettes = {
    grass: ["#71894b", "#899d59", "#5e7c47", "#a4ae69"],
    flower: ["#f2ce83", "#d6b5db", "#f4eee0", "#dca294"],
    shrub: ["#547a4a", "#658650", "#78985b", "#8aa165"],
  };
  const dummy = new THREE.Object3D(),
    color = new THREE.Color();
  for (const kind of ["grass", "flower", "shrub"]) {
    const items = flora.filter((item) => item.kind === kind);
    const geometry =
      kind === "grass"
        ? new THREE.ConeGeometry(0.14, 0.7, 3)
        : kind === "flower"
          ? new THREE.IcosahedronGeometry(0.16, 0)
          : new THREE.IcosahedronGeometry(0.38, 0);
    const material = new THREE.MeshStandardMaterial({
      roughness: 1,
      flatShading: true,
    });
    const batch = new THREE.InstancedMesh(geometry, material, items.length);
    const stems =
      kind === "flower"
        ? new THREE.InstancedMesh(
            new THREE.CylinderGeometry(0.025, 0.035, 0.55, 3),
            new THREE.MeshStandardMaterial({ color: "#66864c", roughness: 1 }),
            items.length,
          )
        : null;
    items.forEach((item, i) => {
      const height = kind === "grass" ? 0.35 : kind === "flower" ? 0.6 : 0.25;
      dummy.position.set(item.x, 0.26 + height * item.scale, item.z);
      dummy.rotation.set(
        kind === "grass" ? 0.12 : 0,
        item.rotation,
        kind === "grass" ? 0.18 : 0,
      );
      dummy.scale.set(
        item.scale,
        kind === "shrub" ? item.scale * 0.7 : item.scale,
        item.scale,
      );
      dummy.updateMatrix();
      batch.setMatrixAt(i, dummy.matrix);
      batch.setColorAt(i, color.set(palettes[kind][item.color]));
      if (stems) {
        dummy.position.y = 0.26 + 0.275 * item.scale;
        dummy.rotation.set(0, item.rotation, 0);
        dummy.scale.setScalar(item.scale);
        dummy.updateMatrix();
        stems.setMatrixAt(i, dummy.matrix);
      }
    });
    batch.receiveShadow = true;
    scene.add(batch);
    if (stems) {
      stems.receiveShadow = true;
      scene.add(stems);
    }
  }
}
