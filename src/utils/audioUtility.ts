import IThreeJsUtility from "./threeJsUtility";
import ISimplexNoiseUtility from "./simplexNoiseUtility";

export default interface IAudioUtility {
  isPlaying: boolean;

  setupAudioContext(): void;
  handleFileChange(event: Event): void;
  playMusic(): Promise<void>;
  togglePlay(): Promise<void>;
  seekAudio(progress: number): void;
  adjustVolume(volume: number): void;
  updateAudio(): void;
}

export class AudioUtility implements IAudioUtility {
  private context: AudioContext;
  private analyser: AnalyserNode;
  private dataArray: Uint8Array;
  private bufferLength: number;
  private audioElement: HTMLAudioElement;
  public isPlaying: boolean;
  public progress: number;
  public volume: number;
  private updateCallback: () => void;
  private threeJsUtility: IThreeJsUtility;
  private simplexNoiseUtility: ISimplexNoiseUtility;

  constructor(audioElement: HTMLAudioElement, progress: number, volume: number, updateCallback: () => void, threeJsUtility: IThreeJsUtility, simplexNoiseUtility: ISimplexNoiseUtility) {
    this.audioElement = audioElement;
    this.isPlaying = false;
    this.progress = progress;
    this.volume = volume;
    this.updateCallback = updateCallback;
    this.threeJsUtility = threeJsUtility;
    this.simplexNoiseUtility = simplexNoiseUtility;
  }

  setupAudioContext(): void {
    this.context = new AudioContext();
  }

  handleFileChange(event: Event): void {
    const files = (event.target as HTMLInputElement).files;
    if (files && files.length > 0) {
      this.audioElement.src = URL.createObjectURL(files[0]);
      this.audioElement.load();
      this.audioElement.play();
      this.playMusic();
    }
  }

  async playMusic(): Promise<void> {
    const audioSource = this.context.createMediaElementSource(this.audioElement);
    this.analyser = this.context.createAnalyser();
    audioSource.connect(this.analyser);
    this.analyser.connect(this.context.destination);
    this.analyser.fftSize = 512;

    this.bufferLength = this.analyser.frequencyBinCount;
    this.dataArray = new Uint8Array(this.bufferLength);

    if (this.context.state === "suspended") {
      await this.context.resume();
    }

    this.updateAudio();
    this.audioElement.play();
    this.isPlaying = true;
  }

  async togglePlay(): Promise<void> {
    if (this.audioElement.paused) {
      if (this.context.state === "suspended") {
        await this.context.resume();
      }
      this.audioElement.play();
      this.isPlaying = true;
    } else {
      this.audioElement.pause();
      this.isPlaying = false;
    }
  }

  seekAudio(progress: number): void {
    const newTime = (this.audioElement.duration * progress) / 100;
    this.audioElement.currentTime = newTime;
  }

  adjustVolume(volume: number): void {
    this.audioElement.volume = volume;
  }

  updateAudio(): void {
    this.analyser.getByteFrequencyData(this.dataArray);
    const halfLength = this.dataArray.length / 2;

    const [lowerHalfData, upperHalfData] = [
      this.dataArray.slice(0, halfLength),
      this.dataArray.slice(halfLength)
    ];

    const lowerMaxFr = this.maximum(lowerHalfData) / lowerHalfData.length;
    const upperAvgFr = this.average(upperHalfData) / upperHalfData.length;

    this.simplexNoiseUtility.tuneObject(
      this.threeJsUtility.object,
      this.modulation(Math.pow(lowerMaxFr, 0.8), 0, 1, 0, 8),
      this.modulation(upperAvgFr, 0, 1, 0, 4)
    );

    this.threeJsUtility.group.rotation.y += 0.005;
    this.threeJsUtility.renderer.render(this.threeJsUtility.scene, this.threeJsUtility.camera);
    requestAnimationFrame(this.updateAudio.bind(this));
  }

  private average(arr: Uint8Array): number {
    return arr.reduce((sum, b) => sum + b, 0) / arr.length;
  }

  private maximum(arr: Uint8Array): number {
    return Math.max(...arr);
  }

  private fractional(val: number, minVal: number, maxVal: number): number {
    return (val - minVal) / (maxVal - minVal);
  }

  private modulation(val: number, minVal: number, maxVal: number, outerMin: number, outerMax: number): number {
    return outerMin + this.fractional(val, minVal, maxVal) * (outerMax - outerMin);
  }
}
