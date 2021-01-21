import { useState, useEffect } from 'react';

function getStorageValue() {
  if (typeof window !== 'undefined') {
    return window.sessionStorage.getItem('telnyx_token');
  }
}

/**
 * Stores Telnyx token in session storage to persist
 * the token as long as the tab or browser is open.
 *
 * You can choose another client storage mechanism if
 * you want, such as `localStorage`.
 */
export default function useCachedToken() {
  const [token, setToken] = useState();

  // Check for token in session storage on page load
  useEffect(() => {
    const cachedValue = getStorageValue();

    setToken(cachedValue || null);
  }, []);

  function saveToken(value) {
    if (typeof window !== 'undefined') {
      window.sessionStorage.setItem('telnyx_token', value);
    }

    setToken(value);
  }

  return [token, saveToken];
}
