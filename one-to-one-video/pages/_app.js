import { Provider } from 'next-auth/client';
import { WebSocketContextProvider } from '../utils/WebSocketContext';
import '../styles/globals.css';

export default function App({ Component, pageProps }) {
  return (
    <WebSocketContextProvider>
      <Provider session={pageProps.session}>
        <Component {...pageProps} />;
      </Provider>
    </WebSocketContextProvider>
  );
}
