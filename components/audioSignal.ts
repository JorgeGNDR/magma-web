export const audioSignal = {
  bass: 0,
  level: 0,
  mid: 0,
  playing: false,
  treble: 0,
};

export function resetAudioSignal() {
  audioSignal.bass = 0;
  audioSignal.level = 0;
  audioSignal.mid = 0;
  audioSignal.playing = false;
  audioSignal.treble = 0;
}
