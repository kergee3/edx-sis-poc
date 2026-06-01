'use client';

import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

export type NavigationPosition = 'auto' | 'top' | 'left' | 'bottom';

interface SettingsContextType {
  navigationPosition: NavigationPosition;
  setNavigationPosition: (position: NavigationPosition) => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [navigationPosition, setNavigationPositionState] = useState<NavigationPosition>('auto');
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // localStorage は reactive ではないため、マウント後に一度だけ読み込んで state に反映する。
    const savedPosition = localStorage.getItem('navigationPosition') as NavigationPosition | null;
    if (savedPosition && ['auto', 'top', 'left', 'bottom'].includes(savedPosition)) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setNavigationPositionState(savedPosition);
    }
    setIsLoaded(true);
  }, []);

  const setNavigationPosition = (position: NavigationPosition) => {
    setNavigationPositionState(position);
    localStorage.setItem('navigationPosition', position);
  };

  if (!isLoaded) {
    return null;
  }

  return (
    <SettingsContext.Provider
      value={{
        navigationPosition,
        setNavigationPosition,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}
