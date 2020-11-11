import axios from "axios";
import { useLayoutEffect, useRef } from "react";
import { TelnyxRTC } from "@telnyx/webrtc";

export default function Home({ token }) {
  let telnyxRTCRef = useRef(undefined);

  useLayoutEffect(() => {
    console.log("running effect");
    telnyxRTCRef.current = new TelnyxRTC({
      login_token: token,
    });

    telnyxRTCRef.current.connect();

    telnyxRTCRef.current.on("telnyx.ready", () => console.log("ready"));
    telnyxRTCRef.current.on("telnyx.error", (error) =>
      console.log("error", error)
    );
  }, []);

  return <span>Home</span>;
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
