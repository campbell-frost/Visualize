<template>
  <v-container ref="containerWidth" class="container">
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
  </v-container>
</template>

<script setup>
import { ref } from 'vue';
const soundFile = ref(null);
const isPlaying = ref(false);
const audioElement = ref(null);
const currentTime = ref(0);
const duration = ref(0);
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
</script>

<style>
.canvas {
  display: flex;
  justify-content: center;
  text-align: center;
}

.container{
  width: 1000px;
}

.play-pause-btn {
  position: relative;
  z-index: 1;
}
</style>
