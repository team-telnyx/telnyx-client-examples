import { useEffect } from 'react';
import { useRouter } from 'next/router';
import useCachedToken from '../utils/useCachedToken';
import Page from '../components/Page';

export default function Home() {
  const router = useRouter();
  const [token] = useCachedToken();

  useEffect(() => {
    if (token === null) {
      // Redirect to login page
      router.push('/login');
    }
  }, [token]);

  return <Page title="Home">Video</Page>;
}
