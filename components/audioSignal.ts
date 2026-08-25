export const AUDIO_BAND_COUNT = 11;

export const audioSignal = {
  bands: Array.from({ length: AUDIO_BAND_COUNT }, () => 0),
  bass: 0,
  level: 0,
  mid: 0,
  playing: false,
  treble: 0,
};

export function resetAudioSignal() {
  audioSignal.bands.fill(0);
  audioSignal.bass = 0;
  audioSignal.level = 0;
  audioSignal.mid = 0;
  audioSignal.playing = false;
  audioSignal.treble = 0;
}
