import React, { useState, Fragment } from 'react';
import { Box, Paragraph } from 'grommet';
import { Magic } from 'grommet-icons';
import InviteEmailForm from './InviteEmailForm';

export default function SignIn() {
  const [signInEmail, setSignInEmail] = useState();

  return (
    <Box width="medium">
      {signInEmail && (
        <Fragment>
          <Paragraph size="xxlarge" color="brand" margin={{ bottom: '0px' }}>
            Sent. <Magic color="brand" size="32px" />
          </Paragraph>
          <Paragraph size="large">Check your inbox.</Paragraph>
        </Fragment>
      )}

      {!signInEmail && (
        <Paragraph size="xlarge">
          Sign-in with a magic link sent to your email.
        </Paragraph>
      )}

      <InviteEmailForm
        submitLabel={signInEmail && 'Send again'}
        onSubmit={({ email }) => setSignInEmail(email)}
      />
    </Box>
  );
}
