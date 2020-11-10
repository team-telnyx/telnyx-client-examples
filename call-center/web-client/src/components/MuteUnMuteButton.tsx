import React from 'react';
import IMuteUnmuteButton from '../interfaces/IMuteUnmuteButton';

function MuteUnmuteButton({ isMuted, mute, unmute }: IMuteUnmuteButton) {
  return (
    <button
      type="button"
      className="App-button App-button--small App-button--tertiary"
      onClick={isMuted ? unmute : mute}
    >
      {isMuted ? (
        <span role="img" aria-label={isMuted ? 'Unmute' : 'Mute'}>
          🔇
        </span>
      ) : (
        <span role="img" aria-label={isMuted ? 'Unmute' : 'Mute'}>
          🔈
        </span>
      )}
    </button>
  );
}

export default MuteUnmuteButton;
