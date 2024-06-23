import * as THREE from "three";
import { createNoise3D, NoiseFunction3D } from "simplex-noise";

type Mesh = THREE.Mesh<THREE.IcosahedronGeometry, THREE.MeshLambertMaterial>;

export class SimplexNoiseUtility {
  noise: NoiseFunction3D;
  RF: number;
  intensity: number;

  constructor(intensity: number, RF = 0.00001) {
    this.noise = createNoise3D();
    this.RF = RF;
    this.intensity = intensity;
  }

  generateNoise(vertex: THREE.Vector3, time: number): number {
    return this.noise(
      vertex.x + time * this.RF * 70,
      vertex.y + time * this.RF * 800,
      vertex.z + time * this.RF * 9
    ) * this.intensity;
  }

  tuneObject(mesh: Mesh, bassFr: number, treFr: number) {
    const geometry = mesh.geometry;
    const positionAttribute = geometry.getAttribute("position");
    const vertex = new THREE.Vector3();
    const offset = geometry.parameters.radius;
    const time = window.performance.now();

    for (let i = 0; i < positionAttribute.count; i++) {
      vertex.fromBufferAttribute(positionAttribute, i).normalize();

      const distance = offset + bassFr +
        this.generateNoise(vertex, time) * treFr;

      vertex.multiplyScalar(distance);
      positionAttribute.setXYZ(i, vertex.x, vertex.y, vertex.z);
    }

    positionAttribute.needsUpdate = true;
  }
}
