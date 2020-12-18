import axios from "axios";
import { useCallback, useEffect, useRef, useState } from "react";
import { TelnyxRTC } from "@telnyx/webrtc";
import { Video } from "@telnyx/react-client";
import { useCopyToClipboard, useSearchParam } from "react-use";
import { v4 as uuidv4 } from "uuid";
import * as Icons from "heroicons-react";

let INITIAL_STATE = {
  name: "INITIAL",
  data: undefined,
};

export default function Home({ token }) {
  let [state, setState] = useState(INITIAL_STATE);
  let telnyxRTCRef = useRef(undefined);

  let [copyState, copyToClipboard] = useCopyToClipboard();
  let [joinLink, setJoinLink] = useState();

  let [audioInDevices, setAudioInDevices] = useState([]);
  let [videoDevices, setVideoDevices] = useState([]);

  let [selectedAudioIn, setSelectedAudioIn] = useState();
  let [selectedVideo, setSelectedVideo] = useState();
  let [localStream, setLocalStream] = useState();
  let [remoteStream, setRemoteStream] = useState();

  let [isAudioMuted, setIsAudioMuted] = useState(false);
  let [isVideoMuted, setIsVideoMuted] = useState(false);

  let roomId = useSearchParam("room");

  useEffect(() => {
    if (!roomId) {
      let newRoomId = uuidv4();
      window.history.pushState(
        {},
        "",
        `${location.pathname}?room=${newRoomId}`
      );
    }

    setJoinLink(window.location.href);
  }, [roomId]);

  useEffect(() => {
    telnyxRTCRef.current = new TelnyxRTC({
      login_token: token,
      env: "development",
      // host: "wss://rtcdev.telnyx.tech:443",
    });
    telnyxRTCRef.current.connect();

    setState({
      name: "RTC_CONNECTING",
    });

    telnyxRTCRef.current.on("telnyx.ready", () => {
      telnyxRTCRef.current.enableMicrophone();
      telnyxRTCRef.current.enableWebcam();

      telnyxRTCRef.current
        .getAudioInDevices()
        .then((devices) => setAudioInDevices(devices));

      telnyxRTCRef.current
        .getVideoDevices()
        .then((devices) => setVideoDevices(devices));

      setState({
        name: "RTC_READY",
      });
    });

    telnyxRTCRef.current.on("telnyx.error", (error) => {
      console.log("error", error);

      setState({
        name: "RTC_ERROR",
        data: { error },
      });
    });

    telnyxRTCRef.current.on("telnyx.notification", (notification) => {
      switch (notification.type) {
        case "callUpdate":
          if (notification.call.state === "destroy") {
            setState({
              name: "RTC_READY",
            });
            break;
          }

          setState({
            name: "CALL_IN_PROGRESS",
            data: {
              call: notification.call,
            },
          });

          setLocalStream(notification.call.localStream);
          setRemoteStream(notification.call.remoteStream);
          break;
        case "participantData":
          break;
        case "userMediaError":
          setState({
            name: "USER_MEDIA_ERROR",
            data: { notification },
          });
          break;
      }
    });
  }, []);

  let handleCallButtonClick = useCallback(() => {
    telnyxRTCRef.current?.newCall({
      destinationNumber: `sip:${roomId || "telnyx"}@${
        process.env.NEXT_PUBLIC_TELNYX_CALL_CONTROL_ADDRESS
      }`,
      audio: true,
      video: true,
    });

    setIsAudioMuted(false);
    setIsVideoMuted(false);
    changeAudioIn(audioInDevices[0]?.deviceId);
    changeVideo(videoDevices[0]?.deviceId);
  }, [telnyxRTCRef.current, audioInDevices, videoDevices]);

  let handleHangupClick = useCallback(() => {
    state.data?.call?.hangup?.();
  }, [state.data?.call]);

  let changeAudioIn = useCallback(
    (micId) => {
      setSelectedAudioIn(micId);

      telnyxRTCRef.current?.enableMicrophone();
      telnyxRTCRef.current?.setAudioSettings({
        micId,
        echoCancellation: true,
      });

      state.data?.call?.unmuteAudio();
      state.data?.call?.setAudioInDevice(micId)?.then?.(() => {
        setLocalStream(state.data?.call?.localStream);
      });
    },
    [telnyxRTCRef.current, state.data?.call, setSelectedAudioIn]
  );

  let changeVideo = useCallback(
    (camId) => {
      setSelectedVideo(camId);

      telnyxRTCRef.current?.enableWebcam();
      telnyxRTCRef.current?.setVideoSettings({
        camId,
      });

      state.data?.call?.unmuteVideo();
      state.data?.call?.setVideoDevice(camId)?.then?.(() => {
        setLocalStream(state.data?.call?.localStream);
      });
    },
    [telnyxRTCRef.current, state.data?.call, setSelectedVideo]
  );

  let toggleMuteAudio = useCallback(() => {
    if (isAudioMuted) {
      telnyxRTCRef.current?.enableMicrophone();
      state.data?.call?.unmuteAudio();
      setIsAudioMuted(false);
    } else {
      telnyxRTCRef.current?.disableMicrophone();
      state.data?.call?.muteAudio();
      setIsAudioMuted(true);
    }
  }, [
    isAudioMuted,
    setIsAudioMuted,
    state.data?.call?.unmuteAudio,
    state.data?.call?.muteAudio,
    telnyxRTCRef.current?.enableMicrophone,
    telnyxRTCRef.current?.disableMicrophone,
  ]);

  let toggleMuteVideo = useCallback(() => {
    if (isVideoMuted) {
      telnyxRTCRef.current?.enableWebcam();
      state.data?.call?.unmuteVideo();
      setIsVideoMuted(false);
    } else {
      telnyxRTCRef.current?.disableWebcam();
      state.data?.call?.muteVideo();
      setIsVideoMuted(true);
    }
  }, [
    isVideoMuted,
    setIsVideoMuted,
    state.data?.call?.unmuteVideo,
    state.data?.call?.muteVideo,
    telnyxRTCRef.current?.enableWebcam,
    telnyxRTCRef.current?.disableWebcam,
  ]);

  return (
    <div className="Root">
      <style jsx global>{`
        body,
        html {
          min-height: 100vh;
          background: #272739;
          color: white;
          font-family: sans-serif;
          font-weight: 400;
          margin: 0;
        }

        * {
          box-sizing: border-box;
        }

        .Body-video-local {
          width: auto;
          height: 100%;
        }

        .Body-video-remote {
          width: 100%;
          height: 100%;
        }
      `}</style>

      <style jsx>{`
        .Root {
          display: grid;
          grid-template-columns: 100%;
          grid-template-rows: 1fr auto;
          height: 100vh;
        }

        .Body {
          display: flex;
          width: 100%;
          height: 100%;
          justify-content: center;
          align-items: center;
        }

        .Body-video {
          background: black;
          display: grid;
          padding: 20px;
          grid-gap: 20px;
          grid-template-columns: 100%;
          grid-template-rows: 1fr 4fr;
          justify-content: center;
          justify-items: center;
          width: 100%;
          height: 100%;
        }

        .Body-connect {
          background: #32973c;
          color: white;

          cursor: pointer;
          border-radius: 5px;
          font-size: 16px;
          border: 0;
          appearance: none;
          padding: 10px;
        }

        .ControlBar {
          display: grid;
          grid-template-columns: 1fr auto 1fr;
          align-items: center;
          background: #04041a;
          padding: 20px;
        }

        .AVControls {
          display: grid;
          grid-auto-flow: column;
          justify-content: start;
          grid-gap: 10px;
        }

        .AVControls-control {
          position: relative;
          cursor: pointer;
        }

        .AVControls-control.isMuted:before {
          content: "";
          display: block;
          width: 40px;
          height: 2px;
          background: red;
          transform: translateY(-50%) translateX(-50%) rotate(45deg);
          position: absolute;
          top: 50%;
          left: 50%;

          pointer-events: none;
        }

        .AVControls-select {
          position: absolute;
          top: 2px;
          right: 2px;

          display: flex;
          padding: 2px;
          border-radius: 5px;
          background: transparent;
        }

        .AVControls-select:hover {
          background: rgba(255, 255, 255, 0.2);
        }

        .AVControls-button {
          appearance: none;
          background: rgba(255, 255, 255, 0.1);
          padding: 10px 15px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;

          border-radius: 5px;
          border: none;
        }

        .AVControls-button:hover {
          background: rgba(255, 255, 255, 0.2);
        }

        .AVControls-select-icon {
        }

        .AVControls-select-select {
          position: absolute;
          top: 0;
          left: 0;
          bottom: 0;
          right: 0;
          width: 100%;
          height: 15px;
          background: transparent;
          color: transparent;
          border: none;
          outline: none;
          appearance: none;
        }

        .JoinLink {
          display: grid;
          grid-auto-flow: column;
          grid-gap: 10px;
          align-items: center;
          justify-content: center;
        }

        .JoinLink-text {
          max-width: 30ch;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .JoinLink-copy-button {
          background: transparent;
          color: #32973c;
          text-decoration: underline;

          cursor: pointer;
          font-size: 16px;
          border: 0;
          appearance: none;
          padding: 10px;
        }

        .CallControls {
          display: grid;
          grid-auto-flow: column;
          justify-content: end;
          grid-gap: 10px;
        }

        .CallControls-button.isHangup {
          background: red;
          color: white;

          cursor: pointer;
          border-radius: 5px;
          font-size: 16px;
          border: 0;
          appearance: none;
          padding: 10px;
        }
      `}</style>
      <div className="Body">
        {state.data?.call ? (
          <div className="Body-video">
            <Video muted stream={localStream} className="Body-video-local" />
            <Video stream={remoteStream} className="Body-video-remote" />
          </div>
        ) : (
          <button className="Body-connect" onClick={handleCallButtonClick}>
            Connect
          </button>
        )}
      </div>

      <div className="ControlBar">
        <div className="AVControls">
          <div
            className={`AVControls-control ${isAudioMuted ? "isMuted" : ""}`}
          >
            <button className="AVControls-button" onClick={toggleMuteAudio}>
              <Icons.Microphone size={30} />
            </button>
            <label className="AVControls-select">
              <Icons.Menu className="AVControls-select-icon" size={15} />
              <select
                className="AVControls-select-select"
                onChange={(event) => {
                  changeAudioIn(event.target.value);
                }}
                value={selectedAudioIn}
              >
                {audioInDevices.map((device) => (
                  <option key={device.deviceId} value={device.deviceId}>
                    {device.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div
            className={`AVControls-control ${isVideoMuted ? "isMuted" : ""}`}
          >
            <button className="AVControls-button" onClick={toggleMuteVideo}>
              <Icons.VideoCamera size={30} />
            </button>
            <label className="AVControls-select">
              <Icons.Menu className="AVControls-select-icon" size={15} />
              <select
                className="AVControls-select-select"
                onChange={(event) => {
                  changeVideo(event.target.value);
                }}
                value={selectedVideo}
              >
                {videoDevices.map((device) => (
                  <option key={device.deviceId} value={device.deviceId}>
                    {device.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>
        <div className="JoinLink">
          <span className="JoinLink-text">
            <span>{joinLink}</span>
          </span>
          <span className="JoinLink-copy">
            <button
              className="JoinLink-copy-button"
              onClick={() => copyToClipboard(joinLink)}
            >
              copy invitation link
            </button>
          </span>
        </div>
        <div className="CallControls">
          {state.data?.call ? (
            <button
              className="CallControls-button isHangup"
              onClick={handleHangupClick}
            >
              Hangup
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export async function getStaticProps() {
  let onDemandCredentialResponse = await axios({
    method: "POST",
    url: "https://apidev.telnyx.com/v2/telephony_credentials",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.TELNYX_API_KEY}`,
    },
    data: { connection_id: process.env.TELNYX_SIP_CONNECTION_ID },
  });

  console.log(onDemandCredentialResponse.data);

  let tokenResponse = await axios({
    method: "POST",
    url: `https://apidev.telnyx.com/v2/telephony_credentials/${onDemandCredentialResponse.data.data.id}/token`,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.TELNYX_API_KEY}`,
    },
  });

  console.log(onDemandCredentialResponse.data, tokenResponse.data);

  return {
    props: {
      token: tokenResponse.data,
    },
  };
}
