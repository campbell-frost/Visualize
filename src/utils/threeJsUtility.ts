import * as THREE from "three";

export class ThreeJsUtility {
  scene: THREE.Scene;
  group: THREE.Group;
  camera: THREE.PerspectiveCamera;
  object: THREE.Mesh<THREE.IcosahedronGeometry, THREE.MeshLambertMaterial>;
  renderer: THREE.WebGLRenderer;

  constructor(container: HTMLElement) {
    this.scene = new THREE.Scene();
    this.group = new THREE.Group();
    this.scene.add(this.group);

    const aspectRatio = container.clientWidth / container.clientHeight;
    this.camera = new THREE.PerspectiveCamera(45, aspectRatio, 0.1, 1000);
    this.camera.position.set(0, 0, 100);
    this.camera.lookAt(this.scene.position);

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(this.renderer.domElement);

    this.createObject();
  }

  createObject() {
    const radius = 10;
    const detail = 3;
    const geometry = new THREE.IcosahedronGeometry(radius, detail);
    const material = new THREE.MeshLambertMaterial({
      color: "#f3f3f3",
      wireframe: true,
    });
    this.object = new THREE.Mesh(geometry, material);
    this.group.add(this.object);
  }

  reshapeObject(radius: number, detail: number) {
    const newGeometry = new THREE.IcosahedronGeometry(radius, detail);
    this.object.geometry.dispose();
    this.object.geometry = newGeometry;
  }

  addLighting() {
    const ambientLight = new THREE.AmbientLight(0xaaaaaa);
    this.scene.add(ambientLight);

    const spotLight = new THREE.SpotLight(0xffffff, 0.9);
    spotLight.position.set(-10, 40, 20);
    spotLight.castShadow = true;
    this.scene.add(spotLight);
  }

  animate() {
    this.object.rotation.y += 0.005;
    this.renderer.render(this.scene, this.camera);
    requestAnimationFrame(() => this.animate());
  }

  resize(width: number, height: number) {
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }  
}