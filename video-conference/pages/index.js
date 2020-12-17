import axios from "axios";
import { useCallback, useEffect, useRef, useState } from "react";
import { TelnyxRTC } from "@telnyx/webrtc";
import { Video } from "@telnyx/react-client";
import { useCopyToClipboard, useSearchParam } from "react-use";
import { v4 as uuidv4 } from "uuid";

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

    changeAudioIn(audioInDevices[0]?.deviceId);
    changeVideo(videoDevices[0]?.deviceId);
  }, [telnyxRTCRef.current, audioInDevices, videoDevices]);

  let handleHangupClick = useCallback(() => {
    state.data?.call?.hangup?.();
  }, [state.data?.call]);

  let changeAudioIn = useCallback(
    (micId) => {
      setSelectedAudioIn(micId);
      console.log(micId);

      if (micId) {
        telnyxRTCRef.current?.enableMicrophone();
        telnyxRTCRef.current?.setAudioSettings({
          micId,
          echoCancellation: true,
        });

        state.data?.call?.unmuteAudio();
        state.data?.call?.setAudioInDevice(micId)?.then?.(() => {
          setLocalStream(state.data?.call?.localStream);
        });
      } else {
        telnyxRTCRef.current?.disableMicrophone();
        state.data?.call?.muteAudio();
      }
    },
    [telnyxRTCRef.current, state.data?.call, setSelectedAudioIn]
  );

  let changeVideo = useCallback(
    (camId) => {
      setSelectedVideo(camId);
      console.log(camId);

      if (camId) {
        telnyxRTCRef.current?.enableWebcam();
        telnyxRTCRef.current?.setVideoSettings({
          camId,
        });

        state.data?.call?.unmuteVideo();
        state.data?.call?.setVideoDevice(camId)?.then?.(() => {
          setLocalStream(state.data?.call?.localStream);
        });
      } else {
        telnyxRTCRef.current?.disableWebcam();
        state.data?.call?.muteVideo();
      }
      setLocalStream(state.data?.call?.localStream);
    },
    [telnyxRTCRef.current, state.data?.call, setSelectedVideo]
  );

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
          grid-template-rows: 1fr 80px;
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
          grid-template-rows: 300px 1fr;
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

        .AVControls-select {
          width: 14ch;
        }

        .JoinLink {
          display: grid;
          grid-auto-flow: column;
          grid-gap: 10px;
          align-items: center;
          justify-content: center;
        }

        .JoinLink-text {
          max-width: 39ch;
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
          <select
            className="AVControls-select"
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

            <option key="mute" value="">
              Mute
            </option>
          </select>

          <select
            className="AVControls-select"
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
            <option key="stop" value="">
              Stop Video
            </option>
          </select>
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
              copy
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
