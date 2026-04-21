import { useState, useEffect, useCallback } from 'react';

export function useShotClock(initialSeconds = 40) {
  const [seconds, setSeconds] = useState(initialSeconds);
  const [isActive, setIsActive] = useState(false);
  const [extensionsCount, setExtensionsCount] = useState(2);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    
    if (isActive && seconds > 0) {
      interval = setInterval(() => {
        setSeconds((s) => s - 1);
      }, 1000);
    } else if (!isActive && seconds !== 0) {
      if (interval) clearInterval(interval);
    }
    
    // Auto-pause upon hitting 00s, waiting for Referee decision
    if (seconds === 0 && isActive) {
        setIsActive(false);
        if (interval) clearInterval(interval);
    }

    return () => {
        if (interval) clearInterval(interval);
    }
  }, [isActive, seconds]);

  const toggle = () => setIsActive(!isActive);
  
  const reset = useCallback(() => {
    setSeconds(initialSeconds);
    setIsActive(true);
  }, [initialSeconds]);
  
  const pause = useCallback(() => {
    setIsActive(false);
  }, []);

  const addExtension = useCallback(() => {
    if (extensionsCount > 0) {
      setSeconds(prev => prev + initialSeconds);
      setExtensionsCount(prev => prev - 1);
      if (!isActive) setIsActive(true);
    }
  }, [extensionsCount, initialSeconds, isActive]);

  return { 
    seconds, 
    isActive, 
    extensionsCount,
    toggle, 
    reset, 
    pause,
    addExtension,
    isCritical: seconds <= 10 && seconds > 0,
    isZero: seconds === 0
  };
}
