import { Box, Form, FormField, TextInput, Button } from 'grommet';
import Page from '../components/Page';

export default function Login() {
  return (
    <Page title="Login">
      <Box width="medium">
        <Form onSubmit={({ value }) => {}}>
          <FormField
            name="username"
            htmlFor="telnyx_sip_username"
            label="Username"
          >
            <TextInput id="telnyx_sip_username" name="username" />
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
