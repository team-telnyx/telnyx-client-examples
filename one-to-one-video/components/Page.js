import { Fragment } from 'react';
import Head from 'next/head';
import { Grommet, Header, Box, Main, Nav, Anchor, Footer } from 'grommet';
import { Github } from 'grommet-icons';

export default function Page({ title, children }) {
  return (
    <Fragment>
      <Head>
        <title>{title} | Video Call</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Grommet full plain>
        <Box fill>
          <Header pad="small">
            <Nav direction="row">
              <Anchor label="Home" href="/" />
            </Nav>
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
