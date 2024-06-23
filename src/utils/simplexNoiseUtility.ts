import * as THREE from "three";
import { createNoise3D, NoiseFunction3D } from "simplex-noise";

type Mesh = THREE.Mesh<THREE.IcosahedronGeometry, THREE.MeshLambertMaterial>;

export default interface ISimplexNoiseUtility {  
  generateNoise(vertex: THREE.Vector3, time: number): number;
  tuneObject(mesh: Mesh, bassFr: number, treFr: number): void;
}

export class SimplexNoiseUtility implements ISimplexNoiseUtility {
  private noise: NoiseFunction3D;
  private RF: number;
  private intensity: number;

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
    const offset = geometry.parameters.radius || 1; // Ensure radius has a default value
    const time = window.performance.now() * 0.001; // Use seconds instead of milliseconds

    for (let i = 0; i < positionAttribute.count; i++) {
      vertex.fromBufferAttribute(positionAttribute, i).normalize();

      let noiseValue = this.generateNoise(vertex, time);
      let distance = offset + bassFr + noiseValue * treFr;

      // Clamp distance to reasonable values
      distance = THREE.MathUtils.clamp(distance, offset * 0.5, offset * 1.5);
      console.log(distance , "i hate you so much")
      vertex.multiplyScalar(distance);
      positionAttribute.setXYZ(i, vertex.x, vertex.y, vertex.z);
    }

    positionAttribute.needsUpdate = true;
  }
}
