<template>
  <v-container>
    <div id="execute" ref="execute">
      <v-card class="m-4 p-4">
        <v-card-item>
          <v-file-input
            clearable
            chips
            variant="outlined"
            label="Upload a music file"
            type="file"
            id="mainFile"
            ref="mainFile"
            class="mt-5"
            prepend-icon=""
          />
        </v-card-item>
        <audio id="audio" ref="audio" accept="audio/*"></audio>


        <v-card-item id="controls">
          <v-btn
            @click="togglePlay"
            :icon="isPlaying ? 'mdi-pause' : 'mdi-play'"
            class="play-pause-btn my-2 mx-2"
          ></v-btn>
          <input
            type="range"
            v-model="progress"
            @change="seekAudio"
            min="0"
            max="100"
            step="1"
            class="slider rangeSlider w-full h-full"
          />
          <input
            type="range"
            v-model="volume"
            @change="adjustVolume"
            min="0"
            max="1"
            step="0.01"
            class="slider w-full h-full"
          />
          <input
            type="range"
            v-model="intensity"
            min="0"
            max="100"
            step="1"
            class="slider w-full h-full"
          />
        </v-card-item>
      </v-card>
    </div>
  </v-container>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import * as THREE from "three";
import { createNoise3D } from "simplex-noise";

import * as dat from "dat.gui";


// Refs for DOM elements
const mainFile = ref<HTMLInputElement | null>(null);
const audio = ref<HTMLAudioElement | null>(null);
const execute = ref<HTMLDivElement | null>(null);

// Reactive state variables
const noise = createNoise3D();

const gui = new dat.GUI();

let context: AudioContext;
let analyser: AnalyserNode;
let dataArray: Uint8Array;
let bufferLength: number;
let scene: THREE.Scene;
let group: THREE.Group;
let camera: THREE.PerspectiveCamera;
let renderer: THREE.WebGLRenderer;
let object: THREE.Mesh<THREE.IcosahedronGeometry, THREE.MeshLambertMaterial>;
const isPlaying = ref(false);
const progress = ref(0);
const volume = ref(0.5);
const intensity = ref<number>(9);

// Utility functions
const average = (arr: Uint8Array) => arr.reduce((sum, b) => sum + b, 0) / arr.length;

const maximum = (arr: Uint8Array) => Math.max(...arr);

const fractional = (val: number, minVal: number, maxVal: number) =>
  (val - minVal) / (maxVal - minVal);

const modulation = (
  val: number,
  minVal: number,
  maxVal: number,
  outerMin: number,
  outerMax: number,
) => outerMin + fractional(val, minVal, maxVal) * (outerMax - outerMin);

const setupAudioContext = () => {
  context = new window.AudioContext();
};

const handleFileChange = (event: Event) => {
  const files = (event.target as HTMLInputElement).files;
  const fileName = document.querySelector("label.file");

  if (files && files.length > 0) {
    fileName?.classList.add("fixed");
    audio.value?.classList.add("working");
    if (audio.value) {
      audio.value.src = URL.createObjectURL(files[0]);
      audio.value.load();
      audio.value.play();
    }
    playMusic();
  }
};

const playMusic = async () => {
  if (!audio.value) return;


  const audioSource = context.createMediaElementSource(audio.value);
  analyser = context.createAnalyser();
  audioSource.connect(analyser);
  analyser.connect(context.destination);
  analyser.fftSize = 512;

  bufferLength = analyser.frequencyBinCount;
  dataArray = new Uint8Array(bufferLength);

  if (context.state === "suspended") {
    await context.resume();
  }

  updateAudio();
  audio.value.play();
  isPlaying.value = true;
};

const createScene = () => {
  scene = new THREE.Scene();
  group = new THREE.Group();

  camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.set(0, 0, 100);
  camera.lookAt(scene.position);
  
  scene.add(group);
};
const createObject = () => {
  const radius = 10;
  const detail = 3;
  const geometry = new THREE.IcosahedronGeometry(radius, detail);
  const material = new THREE.MeshLambertMaterial({
    color: "#f3f3f3",
    wireframe: true,
  });

  object = new THREE.Mesh(geometry, material);
  group.add(object);
};
// options for the GUI
const options = {
  color: 0x0000FF, speed: 0.01, wireframe: false,
};

// changes the color of the object
gui.addColor(options, 'color').onChange(function(e) {
    object.material.color.set(e);
});

// manipulates the rotation speed of the object
gui.add(options, 'speed', 0, 0.1); 

// manipulates the wireframe by check-mark button
gui.add(options, 'wireframe').onChange(function(e) {
    object.material.wireframe = e;
});

// manipulates the rotation speed
let pace = 0;

// value of the object that will be manipulated by GUI
const objectValue = {
  radius: 1,
  detail: 0,
};

// Reshape the object size using the manipulated value
const reshapeObject = () => {
  const newObject = new THREE.IcosahedronGeometry(objectValue.radius, objectValue.detail)
  object.geometry.dispose();
  object.geometry = newObject;
};

// Code for Object GUI manipulation
const objectFolder = gui.addFolder('Object');
const objectPropertiesFolder = objectFolder.addFolder('Properties');
objectPropertiesFolder.add(objectValue, 'radius', 0.1, 10).onChange(reshapeObject);
objectPropertiesFolder.add(objectValue, 'detail', 0, 5).step(1).onChange(reshapeObject);


const addLighting = () => {
  const ambientLight = new THREE.AmbientLight(0xaaaaaa);
  scene.add(ambientLight);

  const spotLight = new THREE.SpotLight(0xffffff, 0.9);
  spotLight.position.set(-10, 40, 20);
  spotLight.castShadow = true;
  scene.add(spotLight);
};

const updateAudio = () => {
  analyser.getByteFrequencyData(dataArray);

  const lowerHalfData = dataArray.slice(0, dataArray.length / 2);
  const upperHalfData = dataArray.slice(dataArray.length / 2);

  const lowerMax = maximum(lowerHalfData);
  const upperAvg = average(upperHalfData);

  const lowerMaxFr = lowerMax / lowerHalfData.length;
  const upperAvgFr = upperAvg / upperHalfData.length;

  tuneObject(
    object,
    modulation(Math.pow(lowerMaxFr, 0.8), 0, 1, 0, 8),
    modulation(upperAvgFr, 0, 1, 0, 4),
  );

  group.rotation.y += 0.005;
  renderer.render(scene, camera);
  requestAnimationFrame(updateAudio);
};

const tuneObject = (
  mesh: THREE.Mesh<THREE.IcosahedronGeometry, THREE.MeshLambertMaterial>,
  bassFr: number,
  treFr: number,
) => {
  const geometry = mesh.geometry as THREE.IcosahedronGeometry;
  const positionAttribute = geometry.getAttribute("position");
  const vertex = new THREE.Vector3();
  const offset = geometry.parameters.radius;

  const time = window.performance.now();
  const rf = 0.00001;

  for (let i = 0; i < positionAttribute.count; i++) {
    vertex.fromBufferAttribute(positionAttribute, i);
    vertex.normalize();
    const distance =
      offset +
      bassFr +
      noise(vertex.x + time * rf * 7, vertex.y + time * rf * 8, vertex.z + time * rf * 9) *
        Number(intensity.value) *
        treFr;
    vertex.multiplyScalar(distance);
    positionAttribute.setXYZ(i, vertex.x, vertex.y, vertex.z);
  }

  positionAttribute.needsUpdate = true;
};

const initVisualizer = () => {
  mainFile.value?.addEventListener("change", handleFileChange);

  audio.value?.addEventListener("play", playMusic);

  createScene();
  createObject();
  addLighting();

  const container = execute.value; // Reference to the container div
  const width = container?.clientWidth || window.innerWidth;
  const height = container?.clientHeight || window.innerHeight;

  renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
  renderer.setSize(width, height);
  container?.appendChild(renderer.domElement);

  window.addEventListener("resize", resizeWindow);

  animate(1);
};
const resizeWindow = () => {
  const container = execute.value; // Reference to the container div
  const width = container?.clientWidth || window.innerWidth;
  const height = container?.clientHeight || window.innerHeight;

  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  renderer.setSize(width, height);
};


// Performs animation based on given time
const animate = (time) => {
  object.rotation.y = time/1000;
  pace += options.speed;
  // Bounces the object
  object.position.y = 4 * Math.abs(Math.sin(pace)); 
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
};

const togglePlay = async () => {
  if (audio.value) {
    if (audio.value.paused) {
      if (context.state === "suspended") {
        await context.resume();
      }
      audio.value.play();
      isPlaying.value = true;
    } else {
      audio.value.pause();
      isPlaying.value = false;
    }
  }
};

const seekAudio = () => {
  if (audio.value) {
    audio.value.currentTime = (audio.value.duration * progress.value) / 100;
  }
};

const adjustVolume = () => {
  if (audio.value) {
    audio.value.volume = volume.value;
  }
};

onMounted(() => {
  setupAudioContext();
  initVisualizer();

  if (audio.value) {
    audio.value.volume = volume.value;
    audio.value.addEventListener("timeupdate", () => {
      progress.value = (audio.value!.currentTime / audio.value!.duration) * 100;
    });
  }
});
</script>
<style scoped>
#controls {
  display: flex;
  align-items: center;
  gap: 10px;
}

#execute {
  width: 100%;
  height: 100vh;
}

</style>

