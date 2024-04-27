<template>
  <v-container class="container">
    <v-row class="mt-5"> </v-row>
    <v-row>
      <v-col>
        <div ref="canvas" class="canvas" />
      </v-col>
      <v-col>
        <v-slider v-model="zPos" label="Z position" :step="1" max="100" min="2" track-color="grey" />
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
import { ref, onMounted, watch } from 'vue';
import * as THREE from 'three';

export default {
  name: 'ThreeScene',
  setup() {
    const canvas = ref(null);
    const zPos = ref(1);

    const createScene = () => {
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
      const renderer = new THREE.WebGLRenderer();
      renderer.setSize(500, 500);
      canvas.value?.appendChild(renderer.domElement);
      return { scene, camera, renderer };
    };

    const createCube = () => {
      const geometry = new THREE.BoxGeometry();
      const material = new THREE.MeshBasicMaterial({ color: '#ffffff' });
      return new THREE.Mesh(geometry, material);
    };

    const createPlane = () => {
      const geometry = new THREE.PlaneGeometry(10, 10);
      const material = new THREE.MeshBasicMaterial({ color: '#ffffff' });
      return new THREE.Mesh(geometry, material);
    };

    const createSphere = () => {
      const geometry = new THREE.SphereGeometry(5, 32, 32);
      const material = new THREE.MeshBasicMaterial({ color: '#ffffff' });
      return new THREE.Mesh(geometry, material);
    };

    onMounted(() => {
      const { scene, camera, renderer } = createScene();

      const cube = createCube();
      const plane = createPlane();
      const sphere = createSphere();

      scene.add(plane);

      // Animate function
      const animate = function (shape) {
        requestAnimationFrame(() => animate(shape));
        shape.rotation.x += 0.01;
        shape.rotation.y += 0.01;
        renderer.render(scene, camera);
      };

      animate(plane);

      // Watch for changes in zPos and update camera position accordingly
      watch(zPos, (newValue) => {
        camera.position.z = parseFloat(newValue);
      });
    });

    return { canvas, zPos };
  }
};
</script>

<style>
.canvas {
  display: flex;
  justify-content: center;
  text-align: center;
}
</style>
