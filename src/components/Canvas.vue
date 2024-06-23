<template>
  <v-container>
    <div id="execute" ref="container">
      <v-card class="m-4 p-4">
        <v-card-item>
          <v-file-input clearable chips variant="outlined" label="Upload a music file" type="file" id="mainFile"
            ref="mainFile" class="mt-5" prepend-icon="" />
        </v-card-item>
        <audio id="audio" ref="audio" accept="audio/*"></audio>
        <v-card-item id="controls">
          <v-btn @click="togglePlay" :icon="isPlaying ? 'mdi-pause' : 'mdi-play'"
            class="play-pause-btn my-2 mx-2"></v-btn>
          <input type="range" v-model="progress" @change="seekAudio" min="0" max="100" step="1" class="slider" />
          <input type="range" v-model="volume" @change="adjustVolume" min="0" max="1" step="0.01" class="slider" />
          <input type="range" v-model="intensity" min="0" max="100" step="1" class="slider" />
        </v-card-item>
      </v-card>
    </div>
  </v-container>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";
import * as THREE from "three";
import IThreeJsUtility, { ThreeJsUtility} from "../utils/threeJsUtility";
import ISimplexNoiseUtility, { SimplexNoiseUtility } from "../utils/simplexNoiseUtility";

// Refs for DOM elements
const mainFile = ref<HTMLInputElement | null>(null);
const audio = ref<HTMLAudioElement | null>(null);
const container = ref<HTMLElement | null>(null);

// Utility classes
let threeJsUtility: IThreeJsUtility| null = null;
let simplexNoiseUtility: ISimplexNoiseUtility | null = null;

let context: AudioContext;
let analyser: AnalyserNode;
let dataArray: Uint8Array;
let bufferLength: number;
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

const updateAudio = () => {
  if(!threeJsUtility || !simplexNoiseUtility) return;
  analyser.getByteFrequencyData(dataArray);
  const halfLength = dataArray.length / 2;

  const [lowerHalfData, upperHalfData] = [
    dataArray.slice(0, halfLength),
    dataArray.slice(halfLength)
  ];

  const lowerMaxFr = maximum(lowerHalfData) / lowerHalfData.length;
  const upperAvgFr = average(upperHalfData) / upperHalfData.length;

  simplexNoiseUtility.tuneObject(
    threeJsUtility.object,
    modulation(Math.pow(lowerMaxFr, 0.8), 0, 1, 0, 8),
    modulation(upperAvgFr, 0, 1, 0, 4)
  );

  threeJsUtility.group.rotation.y += 0.005;
  threeJsUtility.renderer.render(threeJsUtility.scene,threeJsUtility.camera);
  requestAnimationFrame(updateAudio);
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
  if (container.value) {
    threeJsUtility = new ThreeJsUtility(container.value);
    simplexNoiseUtility = new SimplexNoiseUtility(Number(intensity.value));
    threeJsUtility.addLighting();
    threeJsUtility.animate();

    const resizeObserver = new ResizeObserver((entries) => {
      for (let entry of entries) {
        const { width, height } = entry.contentRect;
        threeJsUtility?.resize(width, height);
      }
    });

    resizeObserver.observe(container.value);

    // Set up audio context
    setupAudioContext();

    // Add event listeners
    mainFile.value?.addEventListener("change", handleFileChange);
    audio.value?.addEventListener("play", playMusic);

    if (audio.value) {
      audio.value.volume = volume.value;
      audio.value.addEventListener("timeupdate", () => {
        progress.value = (audio.value!.currentTime / audio.value!.duration) * 100;
      });
    }

    onUnmounted(() => {
      resizeObserver.disconnect();
      if (threeJsUtility) {
        threeJsUtility.renderer.dispose();
        threeJsUtility.object.geometry.dispose();
        (threeJsUtility.object.material as THREE.Material).dispose();
      }
      // Remove event listeners
      mainFile.value?.removeEventListener("change", handleFileChange);
      audio.value?.removeEventListener("play", playMusic);
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

.range-slider {
  width: 100%;
}

.slider {
  width: calc(100% - (73px));
  height: 10px;
  border-radius: 5px;
  background: grey;
  outline: none;
  padding: 0;
  margin: 0;

  &::-webkit-slider-thumb {
    appearance: none;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: black;
    cursor: pointer;
    transition: background .15s ease-in-out;

    &:hover {
      background: "teal";
    }
  }

  &:active::-webkit-slider-thumb {
    background: "red";
  }

  &::-moz-range-thumb {
    width: 20px;
    height: 20px;
    border: 0;
    border-radius: 50%;
    background: "teal";
    cursor: pointer;
    transition: background .15s ease-in-out;

    &:hover {
      background: "red";
    }
  }

  &:active::-moz-range-thumb {
    background: "red";
  }

  &:focus {

    &::-webkit-slider-thumb {
      box-shadow: 0 0 0 3px "red",
        0 0 0 6px "teal";
    }
  }
}
</style>
