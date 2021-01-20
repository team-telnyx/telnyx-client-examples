import { useState, useEffect } from 'react';

function getLocalStorageValue() {
  if (window !== 'undefined') {
    return window.localStorage.getItem('telnyx_token');
  }
}

export default function useCachedToken() {
  const [token, setToken] = useState();

  // Check for token in local storage on page load
  useEffect(() => {
    const cachedValue = getLocalStorageValue();

    setToken(cachedValue || null);
  }, []);

  function saveToken(value) {
    if (window !== 'undefined') {
      return window.localStorage.setItem('telnyx_token', value);
    }

    setToken(value);
  }

  return [token, saveToken];
}
