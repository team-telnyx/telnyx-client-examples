import { useRef, useEffect } from 'react';

export default function useInterval(callback: () => void, delay: number) {
  const savedCallback = useRef(() => {});

  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    function tick() {
      savedCallback.current();
    }

    tick();
    let id = setInterval(tick, delay);
    return () => clearInterval(id);
  }, [delay]);
}
