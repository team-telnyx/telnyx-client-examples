import { useState } from 'react';
import { Box, Button, Form, TextInput } from 'grommet';
import { Mail, Send } from 'grommet-icons';
import { getCsrfToken } from 'next-auth/client';

const encodedForm = (formData) => {
  return Object.keys(formData)
    .map((key) => {
      return encodeURIComponent(key) + '=' + encodeURIComponent(formData[key]);
    })
    .join('&');
};

export default function EmailSignIn({ onSubmit, emailLabel, submitLabel }) {
  const [isSending, setIsSending] = useState();

  const sendInvite = async ({ value: { email } }) => {
    setIsSending(true);

    // Send magic sign up/in link to specified email.
    // nextj-auth `signIn` doesn't allow for doing this async.
    // (https://github.com/nextauthjs/next-auth/issues/922)
    // The following is based on the `signIn` source code
    // https://github.com/nextauthjs/next-auth/blob/canary/src/client/index.js#L237
    // signIn('email', { email: value.email });
    const fetchOptions = {
      method: 'post',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: encodedForm({
        email,
        authorizationParams: {},
        csrfToken: await getCsrfToken(),
        callbackUrl: '',
        json: true,
      }),
    };

    const res = await fetch(`/api/auth/signin/email`, fetchOptions);
    const data = await res.json();

    if (onSubmit) {
      onSubmit({
        email,
        success: Boolean(data && data.url),
      });
    }

    setIsSending(false);
  };

  return (
    <Form onSubmit={sendInvite}>
      <Box gap="small" align="center" width="medium">
        <TextInput
          type="email"
          name="email"
          icon={<Mail />}
          placeholder={emailLabel || 'Enter your email'}
          required
        />
        <Button
          type="submit"
          primary
          icon={<Send />}
          size="large"
          label={submitLabel || 'Send'}
          disabled={isSending}
        />
      </Box>
    </Form>
  );
}
