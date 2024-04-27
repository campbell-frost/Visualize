<template>
  <div ref="container">
    <v-row class="mt-5">
      <v-col>
        <v-slider v-model="zPos" label="Z position" :step="1" max="100" min="2" track-color="grey" />
      </v-col>
      </v-row>
  </div>
</template>

<script>
import { ref, onMounted, watch } from 'vue'
import * as THREE from 'three'

export default {
  name: 'ThreeScene',
  setup() {
    const container = ref(null);
    const zPos = ref(1);

    onMounted(() => {
      // Create scene, camera, renderer, etc.
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
      const renderer = new THREE.WebGLRenderer();
      renderer.setSize(window.innerWidth, window.innerHeight);
      container.value?.appendChild(renderer.domElement);

      // Add objects, lights, etc. to the scene
      const geometry = new THREE.BoxGeometry();
      const material = new THREE.MeshBasicMaterial({ color: '#ffffff' });
      const cube = new THREE.Mesh(geometry, material);
      scene.add(cube);

      // Animate function
      const animate = function () {
        requestAnimationFrame(animate);
        cube.rotation.x += 0.01
        cube.rotation.y += 0.01
        renderer.render(scene, camera);
      }
      animate();

      // Watch for changes in zPos and update camera position accordingly
      watch(zPos, (newValue) => {
        camera.position.z = parseFloat(newValue);
      });
    })

    return {
      container,
      zPos
    }
  }
}
</script>
