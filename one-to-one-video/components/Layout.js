import React, { Fragment } from 'react';
import Head from 'next/head';
import { useSession, signOut } from 'next-auth/client';
import {
  Grommet,
  Anchor,
  Avatar,
  Box,
  Button,
  DropButton,
  Header,
  Main,
  Nav,
  Footer,
  Text,
} from 'grommet';
import { Emoji, Github } from 'grommet-icons';
import useCredentials from '../utils/useCredentials';

export default function Page({ title, children }) {
  const [session] = useSession();
  const [, storeCredentials] = useCredentials();

  function logout() {
    // Remove cached Telnyx credentials
    storeCredentials(null);
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
            {session && session.user && (
              <Nav direction="row" align="center">
                <DropButton
                  label={
                    <Box direction="row" align="center" gap="xsmall">
                      <Avatar src={session.user.image} background="accent-2">
                        {!session.user.image && <Emoji color="accent-3" />}
                      </Avatar>
                    </Box>
                  }
                  dropContent={
                    <Box pad="small" gap="small">
                      <Text color="brand">{session.user.email}</Text>
                      <Button label="Logout" onClick={logout} />
                    </Box>
                  }
                  dropAlign={{ top: 'bottom', right: 'right' }}
                  plain
                />
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
