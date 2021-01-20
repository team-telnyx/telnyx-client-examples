import { Box, Form, FormField, TextInput, Button } from 'grommet';
import Page from '../components/Page';

export default function Login() {
  function handleSubmit({ value }) {
    console.log(value);
  }

  return (
    <Page title="Login">
      <Box width="medium">
        <Form onSubmit={handleSubmit}>
          <FormField
            name="username"
            htmlFor="telnyx_sip_username"
            label="Username"
          >
            <TextInput id="telnyx_sip_username" name="username" required />
          </FormField>
          <FormField
            name="password"
            htmlFor="telnyx_sip_password"
            label="Password"
          >
            <TextInput
              id="telnyx_sip_password"
              name="password"
              type="password"
              required
            />
          </FormField>

          <Box margin={{ vertical: 'large' }}>
            <Button type="submit" primary label="Log in" />
          </Box>
        </Form>
      </Box>
    </Page>
  );
}
