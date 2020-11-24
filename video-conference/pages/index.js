import axios from "axios";
import { useCallback, useEffect, useRef, useState } from "react";
import { TelnyxRTC } from "@telnyx/webrtc";

let INITIAL_STATE = {
  name: "INITIAL",
  data: undefined,
};

export default function Home({ token }) {
  let [state, setState] = useState(INITIAL_STATE);
  let telnyxRTCRef = useRef(undefined);
  let videoLocalRef = useRef();
  let videoRemoteRef = useRef();

  useEffect(() => {
    telnyxRTCRef.current = new TelnyxRTC({
      login_token: token,
      env: "development",
    });
    telnyxRTCRef.current.connect();

    setState({
      name: "RTC_CONNECTING",
    });

    telnyxRTCRef.current.on("telnyx.ready", () => {
      telnyxRTCRef.current.enableMicrophone();
      telnyxRTCRef.current.enableWebcam();

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

  // Update remote video stream
  useEffect(() => {
    if (videoRemoteRef.current) {
      videoRemoteRef.current.srcObject = state.data?.call?.remoteStream;
    }
  }, [state.data?.call?.remoteStream]);

  // Update local video stream
  useEffect(() => {
    if (videoLocalRef.current) {
      videoLocalRef.current.srcObject = state.data?.call?.localStream;
    }
  }, [state.data?.call?.localStream]);

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

  return (
    <div>
      <style jsx global>{`
        body,
        html {
          min-height: 100vh;
          background: black;
          color: white;
          font-family: sans-serif;
        }
      `}</style>

      <style jsx>{`
        .no-call {
        }
        .no-call h1 {
          text-align: center;
        }

        .no-call .button-wrapper {
          display: flex;
          width: 100%;
          justify-content: center;
        }

        .no-call .button-wrapper button {
          padding: 10px 20px;
          font-size: 20px;
        }
      `}</style>

      <style jsx>{`
        .active-call .hangup-button {
          position: fixed;
          top: 50%;
          left: 50%;
          transform: translateX(-50%) translateY(-50%);

          padding: 10px 20px;
          font-size: 20px;

          background: red;
          color: white;
          z-index: 2;
          border: none;
        }

        .video {
          height: 50vh;
          position: fixed;
          left: 50%;
          transform: translateX(-50%);
          background: darkgray;
        }

        .local-video {
          top: 0px;
        }

        .remote-video {
          bottom: 0px;
        }
      `}</style>

      {!state.data?.call ? (
        <div className="no-call">
          <h1>Telnyx Video Conference</h1>
          <div className="button-wrapper">
            <button type="button" onClick={handleCallButtonClick}>
              Call
            </button>
          </div>
        </div>
      ) : (
        <div className="active-call">
          <button
            className="hangup-button"
            type="button"
            onClick={handleHangupClick}
          >
            Hangup
          </button>

          <video
            className="video local-video"
            ref={videoLocalRef}
            playsInline
            autoPlay
            style={{ background: "black" }}
          />
          <video
            className="video remote-video"
            ref={videoRemoteRef}
            playsInline
            autoPlay
            style={{ background: "black" }}
          />
        </div>
      )}
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
