import { Anchor, Box } from 'grommet';
import Page from '../components/Page';

export default function Home() {
  return (
    <Page title="Home">
      <Box>
        <Anchor label="Login" href="/login" />
      </Box>
    </Page>
  );
}
