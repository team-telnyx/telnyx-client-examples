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
          console.log(notification);
          setState({
            ...state,
            data: {
              ...(state.data || {}),
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
      <h1>Telnyx Video Conference</h1>
      <button type="button" onClick={handleCallButtonClick}>
        Call
      </button>
      <button type="button" onClick={handleHangupClick}>
        Hangup
      </button>
      <div>
        <div>
          <h2>Local</h2>
          <video
            ref={videoLocalRef}
            playsInline
            autoPlay
            style={{ background: "black" }}
          />
        </div>
        <div>
          <h2>Remote</h2>
          <video
            ref={videoRemoteRef}
            playsInline
            autoPlay
            style={{ background: "black" }}
          />
        </div>
      </div>
      <pre>{state.name}</pre>
    </div>
  );
}

export async function getStaticProps() {
  console.log(process.env.TELNYX_API_KEY);
  console.log(process.env.TELNYX_SIP_CONNECTION_ID);

  let onDemandCredentialResponse = await axios({
    method: "POST",
    url: "https://api.telnyx.com/v2/telephony_credentials",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.TELNYX_API_KEY}`,
    },
    data: { connection_id: process.env.TELNYX_SIP_CONNECTION_ID },
  });

  console.log(onDemandCredentialResponse.data);

  let tokenResponse = await axios({
    method: "POST",
    url: `https://api.telnyx.com/v2/telephony_credentials/${onDemandCredentialResponse.data.data.id}/token`,
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
