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

  // useEffect(() => {
  //   telnyxRTCRef.current = new TelnyxRTC({
  //     login_token: token,
  //     host: "wss://rtcdev.telnyx.tech:443",
  //   });
  //   telnyxRTCRef.current.connect();

  //   setState({
  //     name: "RTC_CONNECTING",
  //   });

  //   telnyxRTCRef.current.on("telnyx.ready", () => {
  //     telnyxRTCRef.current.enableMicrophone();
  //     telnyxRTCRef.current.enableWebcam();

  //     setState({
  //       name: "RTC_READY",
  //     });
  //   });

  //   telnyxRTCRef.current.on("telnyx.error", (error) => {
  //     console.log("error", error);

  //     setState({
  //       name: "RTC_ERROR",
  //       data: { error },
  //     });
  //   });

  //   telnyxRTCRef.current.on("telnyx.notification", (notification) => {
  //     switch (notification.type) {
  //       case "callUpdate":
  //         if (notification.call.state === "destroy") {
  //           setState({
  //             name: "RTC_READY",
  //           });
  //           break;
  //         }

  //         setState({
  //           name: "CALL_IN_PROGRESS",
  //           data: {
  //             call: notification.call,
  //           },
  //         });
  //         break;
  //       case "participantData":
  //         break;
  //       case "userMediaError":
  //         setState({
  //           name: "USER_MEDIA_ERROR",
  //           data: { notification },
  //         });
  //         break;
  //     }
  //   });
  // }, []);

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
    <div className="Root">
      <style jsx global>{`
        body,
        html {
          min-height: 100vh;
          background: black;
          color: white;
          font-family: sans-serif;
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
          height: 100%;
        }

        .Body-video {
          height: 100%;
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

        .JoinLink {
          display: grid;
          grid-auto-flow: column;
          grid-gap: 10px;
          justify-content: center;
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
        }
      `}</style>
      <div className="Body">
        <div className="Body-video"></div>
      </div>

      <div className="ControlBar">
        <div className="AVControls">
          <select className="AVControls-select">
            <option>Mic Option #1</option>
            <option>Mic Option #2</option>
            <option>Mic Option #3</option>
            <option>Mute</option>
          </select>

          <select className="AVControls-select">
            <option>Video Option #1</option>
            <option>Video Option #2</option>
            <option>Video Option #3</option>
            <option>Stop Video</option>
          </select>
        </div>
        <div className="JoinLink">
          <span className="JoinLink-text">
            https://video.telnyx.com/?room=1234234555123
          </span>
          <span className="JoinLink-copy">
            <button className="JoinLink-copy-button">copy</button>
          </span>
        </div>
        <div className="CallControls">
          <button className="CallControls-button isHangup">Hangup</button>
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
