import { Grommet } from 'grommet';
import '../styles/globals.css';

function MyApp({ Component, pageProps }) {
  return (
    <Grommet plain>
      <Component {...pageProps} />
    </Grommet>
  );
}

export default MyApp;
