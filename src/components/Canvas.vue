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
          <v-btn @click="audioUtility?.togglePlay()" :icon="audioUtility?.isPlaying ? 'mdi-pause' : 'mdi-play'"
            class="play-pause-btn my-2 mx-2"></v-btn>
          <input type="range" v-model="progress" @change="audioUtility?.seekAudio(progress)" min="0" max="100" step="1"
            class="slider" />
          <input type="range" v-model="volume" @change="audioUtility?.adjustVolume(volume)" min="0" max="1" step="0.01"
            class="slider" />
          <input type="range" v-model="intensity" min="0" max="100" step="1" class="slider" />
        </v-card-item>
      </v-card>
    </div>
  </v-container>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";
import * as THREE from "three";
import IThreeJsUtility, { ThreeJsUtility } from "../utils/threeJsUtility";
import ISimplexNoiseUtility, { SimplexNoiseUtility } from "../utils/simplexNoiseUtility";
import IAudioUtility, { AudioUtility } from "../utils/audioUtility";

// Refs for DOM elements
const mainFile = ref<HTMLInputElement | null>(null);
const audio = ref<HTMLAudioElement | null>(null);
const container = ref<HTMLElement | null>(null);

// Utility classes
let threeJsUtility: IThreeJsUtility | null = null;
let simplexNoiseUtility: ISimplexNoiseUtility | null = null;
let audioUtility: IAudioUtility | null = null;

const progress = ref(0);
const volume = ref(0.5);
const intensity = ref<number>(9);

onMounted(() => {
  if (container.value && audio.value) {
    threeJsUtility = new ThreeJsUtility(container.value);
    simplexNoiseUtility = new SimplexNoiseUtility(Number(intensity.value));
    audioUtility = new AudioUtility(audio.value, progress.value, volume.value, () => { }, threeJsUtility, simplexNoiseUtility);

    threeJsUtility.addLighting();
    threeJsUtility.animate();

    const resizeObserver = new ResizeObserver((entries) => {
      for (let entry of entries) {
        const { width, height } = entry.contentRect;
        threeJsUtility?.resize(width, height);
      }
    });

    resizeObserver.observe(container.value);

    audioUtility.setupAudioContext();

    // Add event listeners
    mainFile.value?.addEventListener("change", audioUtility.handleFileChange.bind(audioUtility));
    audio.value?.addEventListener("play", audioUtility.playMusic.bind(audioUtility));

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
      if (audioUtility) {
        mainFile.value?.removeEventListener("change", audioUtility.handleFileChange.bind(audioUtility));
        audio.value?.removeEventListener("play", audioUtility.playMusic.bind(audioUtility));
      }
    });
  }
});
</script>

<style scoped>
#controls {
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
