<template>
  <v-container ref="containerWidth" class="container">
    <div ref="el">
      Width = {{ Width }}

      <v-row class="mt-5">
        <v-col>
          <v-file-input label="Upload a song" chips clearable v-model="soundFile" @change="loadAudio" variant="outlined"
            prepend-icon=""></v-file-input>
        </v-col>
      </v-row>
      <v-row>
        <v-col class="d-flex align-center">
          <v-slider v-model="currentTime" :max="duration" @change="seekAudio" thumb-label="always" step="0.01">
            <template v-slot:prepend>
              <v-btn @click="togglePlayback" :icon="isPlaying ? 'mdi-pause' : 'mdi-play'" class="play-pause-btn"></v-btn>
            </template>
          </v-slider>
        </v-col>
      </v-row>
      <v-row>
        <v-col>
          <div ref="canvas" class="canvas"></div>
        </v-col>
        <v-col>
          <div class="d-flex justify-space-between mb-6">
            <v-btn class="flex-grow-1 mx-2" variant="outlined" @click="toggleShape('cube')">Cube</v-btn>
            <v-btn class="flex-grow-1 mx-2" variant="outlined" @click="toggleShape('plane')">Plane</v-btn>
            <v-btn class="flex-grow-1 mx-2" variant="outlined" @click="toggleShape('sphere')">Sphere</v-btn>
          </div>
          <v-slider v-model="zPos" label="Z position" :step="1" max="100" min="2" track-color="grey"></v-slider>
        </v-col>
      </v-row>
    </div>
  </v-container>
</template>

<script>
import { ref, onMounted, watch } from 'vue';
import { useElementSize } from '@vueuse/core'
import * as THREE from 'three';

export default {
  name: 'ThreeScene',
  setup() {
    const canvas = ref(null);
    const containerWidth = ref(null);
    const zPos = ref(1);
    const soundFile = ref(null);
    const isPlaying = ref(false);
    const audioElement = ref(null);
    const currentTime = ref(0);
    const duration = ref(0);
    const currentShape = ref('plane');
    const el = ref(null)
    const {width} = useElementSize(el);
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

    const loadAudio = () => {
      if (soundFile.value) {
        audioElement.value = new Audio(URL.createObjectURL(soundFile.value));
        audioElement.value.addEventListener('loadedmetadata', () => {
          duration.value = audioElement.value.duration;
        });
        audioElement.value.addEventListener('timeupdate', () => {
          if (!audioElement.value.paused && !audioElement.value.ended) {
            currentTime.value = audioElement.value.currentTime;
          }
        });
      }
    };

    const togglePlayback = () => {
      if (audioElement.value) {
        if (isPlaying.value) {
          audioElement.value.pause();
        } else {
          audioElement.value.play();
        }
        isPlaying.value = !isPlaying.value;
      }
    };


    // Not working yet
    const seekAudio = () => {
      if (audioElement.value) {
        audioElement.value.currentTime = currentTime.value;
      }
    };

    // Runs when the page loads
    onMounted(() => {
      const { scene, camera, renderer } = createScene();
      toggleShape('plane');
      
      console.log(containerWidth.value?.clientWidth);
    
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

    return { canvas, zPos, toggleShape, soundFile, isPlaying, togglePlayback, currentTime, duration, loadAudio, seekAudio, el, width };
  }
};
</script>

<style>
.canvas {
  display: flex;
  justify-content: center;
  text-align: center;
}

.play-pause-btn {
  position: relative;
  z-index: 1;
}
</style>
