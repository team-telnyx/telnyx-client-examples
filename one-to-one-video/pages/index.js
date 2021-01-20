import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useSession, signIn } from 'next-auth/client';
import { Box, Button } from 'grommet';
import { Github } from 'grommet-icons';
import useCachedToken from '../utils/useCachedToken';
import Page from '../components/Page';

export default function Home() {
  const router = useRouter();
  const [session, loading] = useSession();
  const [token] = useCachedToken();

  // useEffect(() => {
  //   if (token === null) {
  //     // Redirect to login page
  //     router.push('/login');
  //   }
  // }, [token]);

  console.log(session);

  return (
    <Page title="Home">
      {session && <p>Signed in as {session.user.name}</p>}
      {!session && !loading && (
        <Box width="medium">
          <Button
            primary
            size="large"
            icon={<Github />}
            label="Sign in with GitHub"
            onClick={() => signIn('github')}
          />
        </Box>
      )}
    </Page>
  );
}
