import { useState, useEffect } from 'react';

function getStorageValue() {
  if (typeof window !== 'undefined') {
    const value = window.sessionStorage.getItem('telnyx_credentials');

    if (value && value.startsWith('{')) {
      return JSON.parse(value);
    }
  }

  return null;
}

/**
 * Gets and stores Telnyx RTC username & token in session storage to
 * persist the token as long as the tab or browser is open.
 *
 * You can choose another client storage mechanism if
 * you want, such as `localStorage`.
 */
export default function useCredentials() {
  const [credentials, setCredentials] = useState();

  function storeCredentials(value) {
    if (typeof window !== 'undefined') {
      if (value) {
        window.sessionStorage.setItem(
          'telnyx_credentials',
          typeof value === 'object' ? JSON.stringify(value) : value
        );
      } else {
        window.sessionStorage.removeItem('telnyx_credentials');
      }
    }

    setCredentials(value);
  }

  // Check for credentials in session storage on page load,
  // get and save credentials if they don't exist in storage
  useEffect(() => {
    const cachedValue = getStorageValue();

    if (cachedValue) {
      setCredentials(cachedValue);
    } else {
      const controller = new AbortController();

      fetch('/api/rtc/credentials', {
        signal: controller.signal,
      })
        .then((resp) => resp.json())
        .then((creds) => {
          storeCredentials(creds);
        })
        .catch((err) => {
          console.error('useCredentials fetch /api/rtc/credentials', err);
        });

      return function cancel() {
        controller.abort();
      };
    }
  }, []);

  return [credentials, storeCredentials];
}
