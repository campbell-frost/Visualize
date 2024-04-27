<template>
  <v-container class="container">
    <v-row class="mt-5">
    </v-row>
    <v-row>
      <v-col>
        <div ref="canvas" class="canvas" />
      </v-col>
      <v-col>
        <div class="d-flex justify-space-between mb-6 ">
          <v-btn class="flex-grow-1 mx-2" variant="outlined" @click="toggleShape('cube')">Cube</v-btn>
          <v-btn class="flex-grow-1 mx-2" variant="outlined" @click="toggleShape('plane')">Plane</v-btn>
          <v-btn class="flex-grow-1 mx-2" variant="outlined" @click="toggleShape('sphere')">Sphere</v-btn>
        </div>
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
    const currentShape = ref('plane');
    let scene, camera, renderer;

    const createScene = () => {
      scene = new THREE.Scene();
      camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
      renderer = new THREE.WebGLRenderer();
      renderer.setSize(500, 500);
      canvas.value?.appendChild(renderer.domElement);
      return { scene, camera, renderer };
    };

    const createCube = () => {
      const geometry = new THREE.BoxGeometry(10, 10, 10);
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

    const toggleShape = (shape) => {
      currentShape.value = shape;
      scene.clear();
      const shapeToAdd =
        shape === 'cube'
          ? createCube()
          : shape === 'plane'
            ? createPlane()
            : createSphere();
      scene.add(shapeToAdd);
    };

    // Runs when the page loads
    onMounted(() => {
      const { scene, camera, renderer } = createScene();
      toggleShape('plane');

      // Animate function
      const animate = function () {
        requestAnimationFrame(animate);
        scene.children.forEach((child) => {
          child.rotation.x += 0.01;
          child.rotation.y += 0.01;
        });
        renderer.render(scene, camera);
      };

      animate();

      // Watches for changes in zPos and update camera position accordingly
      watch(zPos, (newValue) => {
        camera.position.z = parseFloat(newValue);
      });
    });

    return { canvas, zPos, toggleShape };
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
