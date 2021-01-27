import React from 'react';
import { useSession } from 'next-auth/client';
import useCredentials from '../utils/useCredentials';
import Layout from '../components/Layout';
import VideoRTC from '../components/VideoRTC';
import SignIn from '../components/SignIn';

export default function Home() {
  const [session, loading] = useSession();
  const [credentials] = useCredentials();
  const isSessionReady = Boolean(session);

  return (
    <Layout title="Home">
      {isSessionReady && credentials && (
        <VideoRTC userEmail={session.user.email} credentials={credentials} />
      )}
      {!isSessionReady && !loading && <SignIn />}
    </Layout>
  );
}
