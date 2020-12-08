import axios from "axios";
import { useCallback, useEffect, useRef, useState } from "react";
import { TelnyxRTC } from "@telnyx/webrtc";
import { Video } from "@telnyx/react-client";
import { useCopyToClipboard } from "react-use";

let INITIAL_STATE = {
  name: "INITIAL",
  data: undefined,
};

export default function Home({ token }) {
  let [state, setState] = useState(INITIAL_STATE);
  let telnyxRTCRef = useRef(undefined);
  let [copyState, copyToClipboard] = useCopyToClipboard();
  let [audioInDevices, setAudioInDevices] = useState([]);
  let [videoDevices, setVideoDevices] = useState([]);

  let [selectedAudioIn, setSelectedAudioIn] = useState();
  let [selectedVideo, setSelectedVideo] = useState();

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
      destinationNumber: process.env.NEXT_PUBLIC_TELNYX_CALL_CONTROL_ADDRESS,
      audio: true,
      video: true,
    });
  }, [telnyxRTCRef.current]);

  let handleHangupClick = useCallback(() => {
    state.data?.call?.hangup?.();
  }, [state.data?.call]);

  let handleChangeAudioIn = useCallback((event) => {
    let micId = event.target.value;
    setSelectedVideo(micId);

    console.log(micId);

    if (micId) {
      telnyxRTCRef.current?.enableMicrophone();
      telnyxRTCRef.current?.setAudioSettings({
        micId,
        echoCancellation: true,
      });
    } else {
      telnyxRTCRef.current?.disableMicrophone();
    }
  });

  let handleChangeVideo = useCallback((event) => {
    let camId = event.target.value;
    setSelectedVideo(camId);

    console.log(camId);

    if (camId) {
      telnyxRTCRef.current?.enableWebcam();
      telnyxRTCRef.current?.setVideoSettings({
        camId,
      });
    } else {
      telnyxRTCRef.current?.disableWebcam();
    }
  });

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
          display: grid;
          grid-gap: 10px;
          grid-auto-flow: column;
          justify-content: center;
          width: 100%;
        }

        .Body-video > * {
          width: 640px;
          height: 480px;
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
            <Video stream={state.data?.call?.localStream} />
            <Video stream={state.data?.call?.remoteStream} />
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
            onChange={handleChangeAudioIn}
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
            onChange={handleChangeVideo}
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
            https://video.telnyx.com/?room=1234234555123
          </span>
          <span className="JoinLink-copy">
            <button
              className="JoinLink-copy-button"
              onClick={() =>
                copyToClipboard("https://video.telnyx.com/?room=1234234555123")
              }
            >
              copy
            </button>
          </span>
        </div>
        <div className="CallControls">
          <button
            className="CallControls-button isHangup"
            onClick={handleHangupClick}
          >
            Hangup
          </button>
        </div>
      </div>
    </div>
  );
}

export async function getStaticProps() {
  console.log(process.env.TELNYX_API_KEY);
  console.log(process.env.TELNYX_SIP_CONNECTION_ID);

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
