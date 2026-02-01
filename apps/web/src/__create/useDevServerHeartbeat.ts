'use client';

import { useEffect } from 'react';

export function useDevServerHeartbeat() {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    // Dynamically import react-idle-timer only on client
    import('react-idle-timer').then(({ useIdleTimer }) => {
      // Note: We can't use hooks inside useEffect, so we'll use a simple interval instead
    }).catch(() => {
      // Ignore import errors
    });
    
    // Simple interval-based heartbeat as fallback
    const interval = setInterval(() => {
      fetch('/', { method: 'GET' }).catch(() => {
        // no-op, just keep dev server alive
      });
    }, 60_000 * 3);
    
    return () => clearInterval(interval);
  }, []);
}
