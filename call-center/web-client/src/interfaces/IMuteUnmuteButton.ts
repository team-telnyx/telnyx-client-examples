export default interface IMuteUnmuteButton {
  isMuted?: boolean;
  mute: () => void;
  unmute: () => void;
}
