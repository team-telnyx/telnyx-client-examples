import { useState, useEffect } from 'react';

function getStorageValue() {
  if (typeof window !== 'undefined') {
    return window.sessionStorage.getItem('telnyx_credentials');
  }
}

/**
 * Stores Telnyx RTC username & token in session storage to
 * persist the token as long as the tab or browser is open.
 *
 * You can choose another client storage mechanism if
 * you want, such as `localStorage`.
 */
export default function useCachedCredentials() {
  const [credentials, setCredentials] = useState();

  // Check for token in session storage on page load
  useEffect(() => {
    const cachedValue = getStorageValue();

    setCredentials(cachedValue ? JSON.parse(cachedValue) : null);
  }, []);

  function saveCredentials(value) {
    if (typeof window !== 'undefined') {
      window.sessionStorage.setItem('telnyx_credentials', value);
    }

    setCredentials(value);
  }

  return [credentials, saveCredentials];
}
