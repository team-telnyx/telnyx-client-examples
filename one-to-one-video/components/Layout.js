import { Fragment } from 'react';
import Head from 'next/head';
import { useSession, signOut } from 'next-auth/client';
import {
  Grommet,
  Anchor,
  Avatar,
  Box,
  Button,
  Header,
  Main,
  Nav,
  Footer,
} from 'grommet';
import { Emoji, Github } from 'grommet-icons';
import useCachedToken from '../utils/useCachedToken';

export default function Page({ title, children }) {
  const [session] = useSession();
  const [, setCachedToken] = useCachedToken();

  function logout() {
    // Remove cached Telnyx token
    setCachedToken(null);
    // Sign out of OAuth session
    signOut();
  }

  return (
    <Fragment>
      <Head>
        <title>{title} | Video Call</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Grommet full plain>
        <Box fill>
          <Header pad={{ horizontal: 'medium', vertical: 'small' }}>
            <Nav direction="row">
              <Anchor label="Home" href="/" />
            </Nav>
            {session && (
              <Nav direction="row" align="center">
                {session.user && (
                  <Box direction="row" align="center" gap="small">
                    <Avatar
                      src={session.user.image}
                      background="accent-2"
                      color="accent-1"
                    >
                      {!session.user.image && <Emoji color="accent-1" />}
                    </Avatar>
                  </Box>
                )}

                <Button label="Logout" onClick={logout} />
              </Nav>
            )}
          </Header>

          <Main fill={false} align="center" justify="center">
            {children}
          </Main>

          <Footer pad="small" justify="end">
            <a
              href="https://github.com/team-telnyx/telnyx-client-examples"
              target="_blank"
            >
              <span role="img" aria-label="GitHub logo">
                <Github />
              </span>
            </a>
          </Footer>
        </Box>
      </Grommet>
    </Fragment>
  );
}
